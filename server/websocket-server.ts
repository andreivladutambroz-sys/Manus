import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { IncomingMessage } from "http";

interface ImportProgressUpdate {
  type: "progress" | "complete" | "error" | "started";
  batchNumber?: number;
  totalBatches?: number;
  vehiclesImported?: number;
  totalVehicles?: number;
  percentage?: number;
  eta?: string;
  message?: string;
  error?: string;
  timestamp: number;
}

interface ClientSubscription {
  id: string;
  socket: WebSocket;
  subscriptions: Set<string>;
}

class ImportProgressServer {
  private wss: WebSocketServer;
  private clients: Map<string, ClientSubscription> = new Map();
  private importState: Map<string, any> = new Map();

  constructor(httpServer: Server) {
    this.wss = new WebSocketServer({ server: httpServer });

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      const clientId = this.generateClientId();
      const subscription: ClientSubscription = {
        id: clientId,
        socket: ws,
        subscriptions: new Set(),
      };

      this.clients.set(clientId, subscription);
      console.log(`[WebSocket] Client connected: ${clientId}`);

      ws.on("message", (data: string) => {
        try {
          const message = JSON.parse(data);
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error("[WebSocket] Invalid message:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
              timestamp: Date.now(),
            })
          );
        }
      });

      ws.on("close", () => {
        this.clients.delete(clientId);
        console.log(`[WebSocket] Client disconnected: ${clientId}`);
      });

      ws.on("error", (error: Error) => {
        console.error(`[WebSocket] Error for client ${clientId}:`, error);
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: "connected",
          clientId,
          timestamp: Date.now(),
        })
      );
    });
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleClientMessage(clientId: string, message: any) {
    const subscription = this.clients.get(clientId);
    if (!subscription) return;

    switch (message.type) {
      case "subscribe":
        subscription.subscriptions.add(message.channel);
        subscription.socket.send(
          JSON.stringify({
            type: "subscribed",
            channel: message.channel,
            timestamp: Date.now(),
          })
        );
        break;

      case "unsubscribe":
        subscription.subscriptions.delete(message.channel);
        subscription.socket.send(
          JSON.stringify({
            type: "unsubscribed",
            channel: message.channel,
            timestamp: Date.now(),
          })
        );
        break;

      case "get-state":
        const state = this.importState.get(message.channel);
        subscription.socket.send(
          JSON.stringify({
            type: "state",
            channel: message.channel,
            state: state || null,
            timestamp: Date.now(),
          })
        );
        break;
    }
  }

  /**
   * Broadcast import progress update to all subscribed clients
   */
  public broadcastProgress(channel: string, update: ImportProgressUpdate) {
    // Store latest state
    this.importState.set(channel, update);

    // Broadcast to subscribed clients
    this.clients.forEach((subscription) => {
      if (subscription.subscriptions.has(channel)) {
        subscription.socket.send(JSON.stringify(update));
      }
    });
  }

  /**
   * Send progress update to specific client
   */
  public sendToClient(clientId: string, update: ImportProgressUpdate) {
    const subscription = this.clients.get(clientId);
    if (subscription) {
      subscription.socket.send(JSON.stringify(update));
    }
  }

  /**
   * Get current import state
   */
  public getState(channel: string) {
    return this.importState.get(channel);
  }

  /**
   * Clear import state
   */
  public clearState(channel: string) {
    this.importState.delete(channel);
  }

  /**
   * Get number of connected clients
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients subscribed to a channel
   */
  public getSubscribedClients(channel: string): string[] {
    const clients: string[] = [];
    this.clients.forEach((subscription) => {
      if (subscription.subscriptions.has(channel)) {
        clients.push(subscription.id);
      }
    });
    return clients;
  }
}

// Global instance
let importProgressServer: ImportProgressServer | null = null;

export function initializeWebSocketServer(httpServer: Server) {
  importProgressServer = new ImportProgressServer(httpServer);
  return importProgressServer;
}

export function getWebSocketServer(): ImportProgressServer | null {
  return importProgressServer;
}

export type { ImportProgressUpdate };
