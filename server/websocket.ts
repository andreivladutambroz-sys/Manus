import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { nanoid } from 'nanoid';

export interface CollaborationSession {
  id: string;
  diagnosticId: string;
  users: Map<string, UserSession>;
  createdAt: Date;
  lastActivity: Date;
}

export interface UserSession {
  userId: string;
  userName: string;
  socketId: string;
  joinedAt: Date;
  cursor?: { x: number; y: number };
  lastActive: Date;
}

export interface CollaborationMessage {
  type: 'cursor' | 'edit' | 'comment' | 'presence' | 'activity';
  userId: string;
  userName: string;
  timestamp: Date;
  data: any;
}

class WebSocketManager {
  private io: SocketIOServer | null = null;
  private sessions: Map<string, CollaborationSession> = new Map();
  private userSessions: Map<string, UserSession> = new Map();
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 60000,
    });

    this.setupEventHandlers();
    this.startCleanupInterval();

    console.log('✓ WebSocket server initialized');
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`✓ User connected: ${socket.id}`);

      socket.on('join-diagnostic', (data: any) => this.handleJoinDiagnostic(socket, data));
      socket.on('leave-diagnostic', (data: any) => this.handleLeaveDiagnostic(socket, data));
      socket.on('cursor-move', (data: any) => this.handleCursorMove(socket, data));
      socket.on('edit-field', (data: any) => this.handleEditField(socket, data));
      socket.on('add-comment', (data: any) => this.handleAddComment(socket, data));
      socket.on('sync-state', (data: any) => this.handleSyncState(socket, data));
      socket.on('disconnect', () => this.handleDisconnect(socket));
      socket.on('error', (error: any) => this.handleError(socket, error));

      // Heartbeat
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Handle user joining a diagnostic session
   */
  private handleJoinDiagnostic(socket: Socket, data: any) {
    const { diagnosticId, userId, userName } = data;

    if (!diagnosticId || !userId) {
      socket.emit('error', { message: 'Missing required fields' });
      return;
    }

    // Get or create session
    let session = this.sessions.get(diagnosticId);
    if (!session) {
      session = {
        id: nanoid(),
        diagnosticId,
        users: new Map(),
        createdAt: new Date(),
        lastActivity: new Date(),
      };
      this.sessions.set(diagnosticId, session);
    }

    // Add user to session
    const userSession: UserSession = {
      userId,
      userName,
      socketId: socket.id,
      joinedAt: new Date(),
      lastActive: new Date(),
    };

    session.users.set(userId, userSession);
    this.userSessions.set(socket.id, userSession);

    // Join socket to room
    socket.join(`diagnostic:${diagnosticId}`);

    // Notify others
    socket.to(`diagnostic:${diagnosticId}`).emit('user-joined', {
      userId,
      userName,
      timestamp: new Date(),
    });

    // Send current session state to new user
    socket.emit('session-state', {
      sessionId: session.id,
      users: Array.from(session.users.values()),
      timestamp: new Date(),
    });

    console.log(`✓ User ${userId} joined diagnostic ${diagnosticId}`);
  }

  /**
   * Handle user leaving diagnostic session
   */
  private handleLeaveDiagnostic(socket: Socket, data: any) {
    const { diagnosticId } = data;
    const userSession = this.userSessions.get(socket.id);

    if (!userSession) return;

    const session = this.sessions.get(diagnosticId);
    if (session) {
      session.users.delete(userSession.userId);

      // Notify others
      socket.to(`diagnostic:${diagnosticId}`).emit('user-left', {
        userId: userSession.userId,
        userName: userSession.userName,
        timestamp: new Date(),
      });

      // Clean up empty sessions
      if (session.users.size === 0) {
        this.sessions.delete(diagnosticId);
      }
    }

    socket.leave(`diagnostic:${diagnosticId}`);
    this.userSessions.delete(socket.id);
  }

  /**
   * Handle cursor movement
   */
  private handleCursorMove(socket: Socket, data: any) {
    const { diagnosticId, x, y } = data;
    const userSession = this.userSessions.get(socket.id);

    if (!userSession) return;

    userSession.cursor = { x, y };
    userSession.lastActive = new Date();

    socket.to(`diagnostic:${diagnosticId}`).emit('cursor-moved', {
      userId: userSession.userId,
      userName: userSession.userName,
      x,
      y,
      timestamp: new Date(),
    });
  }

  /**
   * Handle field edit
   */
  private handleEditField(socket: Socket, data: any) {
    const { diagnosticId, fieldName, value, version } = data;
    const userSession = this.userSessions.get(socket.id);

    if (!userSession) return;

    userSession.lastActive = new Date();

    const session = this.sessions.get(diagnosticId);
    if (session) {
      session.lastActivity = new Date();
    }

    socket.to(`diagnostic:${diagnosticId}`).emit('field-edited', {
      userId: userSession.userId,
      userName: userSession.userName,
      fieldName,
      value,
      version,
      timestamp: new Date(),
    });
  }

  /**
   * Handle comment addition
   */
  private handleAddComment(socket: Socket, data: any) {
    const { diagnosticId, comment, fieldName } = data;
    const userSession = this.userSessions.get(socket.id);

    if (!userSession) return;

    userSession.lastActive = new Date();

    socket.to(`diagnostic:${diagnosticId}`).emit('comment-added', {
      userId: userSession.userId,
      userName: userSession.userName,
      comment,
      fieldName,
      timestamp: new Date(),
    });
  }

  /**
   * Handle state sync request
   */
  private handleSyncState(socket: Socket, data: any) {
    const { diagnosticId } = data;
    const session = this.sessions.get(diagnosticId);

    if (session) {
      socket.emit('state-sync', {
        sessionId: session.id,
        users: Array.from(session.users.values()),
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle user disconnect
   */
  private handleDisconnect(socket: Socket) {
    const userSession = this.userSessions.get(socket.id);

    if (userSession) {
      // Find and notify all sessions this user was in
      const keysToDelete: string[] = [];
      this.sessions.forEach((session, diagnosticId) => {
        if (session.users.has(userSession.userId)) {
          session.users.delete(userSession.userId);

          this.io?.to(`diagnostic:${diagnosticId}`).emit('user-left', {
            userId: userSession.userId,
            userName: userSession.userName,
            timestamp: new Date(),
          });

          // Clean up empty sessions
          if (session.users.size === 0) {
            keysToDelete.push(diagnosticId);
          }
        }
      });
      keysToDelete.forEach(key => this.sessions.delete(key));
      this.userSessions.delete(socket.id);
    }

    console.log(`✓ User disconnected: ${socket.id}`);
  }

  /**
   * Handle errors
   */
  private handleError(socket: Socket, error: any) {
    console.error(`Socket error for ${socket.id}:`, error);
    socket.emit('error', { message: 'An error occurred' });
  }

  /**
   * Start cleanup interval for inactive sessions
   */
  private startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.sessions.forEach((session, diagnosticId) => {
        const userKeysToDelete: string[] = [];
        session.users.forEach((user, userId) => {
          if (now - user.lastActive.getTime() > this.sessionTimeout) {
            userKeysToDelete.push(userId);
            this.io?.to(`diagnostic:${diagnosticId}`).emit('user-timeout', {
              userId,
              userName: user.userName,
              timestamp: new Date(),
            });
          }
        });
        userKeysToDelete.forEach(userId => session.users.delete(userId));
        if (session.users.size === 0) {
          keysToDelete.push(diagnosticId);
        }
      });
      keysToDelete.forEach(key => this.sessions.delete(key));
    }, 5 * 60 * 1000);
  }

  /**
   * Get session info
   */
  getSessionInfo(diagnosticId: string) {
    const session = this.sessions.get(diagnosticId);
    if (!session) return null;

    const users: any[] = [];
    session.users.forEach(user => users.push(user));

    return {
      sessionId: session.id,
      diagnosticId,
      userCount: session.users.size,
      users,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
    };
  }

  /**
   * Get all active sessions
   */
  getAllSessions() {
    const sessions: any[] = [];
    this.sessions.forEach((session) => {
      const users: any[] = [];
      session.users.forEach(user => users.push(user));
      sessions.push({
        sessionId: session.id,
        diagnosticId: session.diagnosticId,
        userCount: session.users.size,
        users,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
      });
    });
    return sessions;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.io) {
      this.io.close();
    }
  }
}

export const wsManager = new WebSocketManager();
