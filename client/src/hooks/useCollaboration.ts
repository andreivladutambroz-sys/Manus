import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface CollaborativeUser {
  userId: string;
  userName: string;
  socketId: string;
  joinedAt: Date;
  cursor?: { x: number; y: number };
  lastActive: Date;
}

export interface CollaborationEvent {
  type: 'user-joined' | 'user-left' | 'cursor-moved' | 'field-edited' | 'comment-added' | 'user-timeout';
  userId: string;
  userName: string;
  data?: any;
  timestamp: Date;
}

export function useCollaboration(diagnosticId: string, userId: string, userName: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<CollaborativeUser[]>([]);
  const [events, setEvents] = useState<CollaborationEvent[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const socket = io(baseURL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✓ Connected to collaboration server');
      setIsConnected(true);

      // Join diagnostic session
      socket.emit('join-diagnostic', {
        diagnosticId,
        userId,
        userName,
      });
    });

    socket.on('disconnect', () => {
      console.log('✗ Disconnected from collaboration server');
      setIsConnected(false);
    });

    socket.on('session-state', (data: any) => {
      setSessionId(data.sessionId);
      setActiveUsers(data.users);
    });

    socket.on('user-joined', (data: any) => {
      setActiveUsers((prev) => [
        ...prev,
        {
          userId: data.userId,
          userName: data.userName,
          socketId: '',
          joinedAt: new Date(data.timestamp),
          lastActive: new Date(data.timestamp),
        },
      ]);
      addEvent({
        type: 'user-joined',
        userId: data.userId,
        userName: data.userName,
        timestamp: new Date(data.timestamp),
      });
    });

    socket.on('user-left', (data: any) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      addEvent({
        type: 'user-left',
        userId: data.userId,
        userName: data.userName,
        timestamp: new Date(data.timestamp),
      });
    });

    socket.on('cursor-moved', (data: any) => {
      setActiveUsers((prev) =>
        prev.map((u) =>
          u.userId === data.userId
            ? { ...u, cursor: { x: data.x, y: data.y }, lastActive: new Date(data.timestamp) }
            : u
        )
      );
    });

    socket.on('field-edited', (data: any) => {
      addEvent({
        type: 'field-edited',
        userId: data.userId,
        userName: data.userName,
        data: {
          fieldName: data.fieldName,
          value: data.value,
          version: data.version,
        },
        timestamp: new Date(data.timestamp),
      });
    });

    socket.on('comment-added', (data: any) => {
      addEvent({
        type: 'comment-added',
        userId: data.userId,
        userName: data.userName,
        data: {
          comment: data.comment,
          fieldName: data.fieldName,
        },
        timestamp: new Date(data.timestamp),
      });
    });

    socket.on('user-timeout', (data: any) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      addEvent({
        type: 'user-timeout',
        userId: data.userId,
        userName: data.userName,
        timestamp: new Date(data.timestamp),
      });
    });

    socket.on('error', (error: any) => {
      console.error('Collaboration error:', error);
    });

    return () => {
      if (socket.connected) {
        socket.emit('leave-diagnostic', { diagnosticId });
        socket.disconnect();
      }
    };
  }, [diagnosticId, userId, userName]);

  const addEvent = useCallback((event: CollaborationEvent) => {
    setEvents((prev) => {
      const updated = [...prev, event];
      // Keep only last 100 events
      return updated.slice(-100);
    });
  }, []);

  // Send cursor position
  const sendCursorMove = useCallback(
    (x: number, y: number) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('cursor-move', {
          diagnosticId,
          x,
          y,
        });
      }
    },
    [diagnosticId]
  );

  // Send field edit
  const sendFieldEdit = useCallback(
    (fieldName: string, value: any, version: number = 1) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('edit-field', {
          diagnosticId,
          fieldName,
          value,
          version,
        });
      }
    },
    [diagnosticId]
  );

  // Send comment
  const sendComment = useCallback(
    (comment: string, fieldName: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('add-comment', {
          diagnosticId,
          comment,
          fieldName,
        });
      }
    },
    [diagnosticId]
  );

  // Request state sync
  const syncState = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('sync-state', {
        diagnosticId,
      });
    }
  }, [diagnosticId]);

  // Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping');
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    activeUsers,
    events,
    sessionId,
    sendCursorMove,
    sendFieldEdit,
    sendComment,
    syncState,
  };
}
