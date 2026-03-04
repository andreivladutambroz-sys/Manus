import { Server as HTTPServer } from 'http';
import { wsManager } from './websocket';

/**
 * Initialize WebSocket server with HTTP server
 */
export function initializeWebSocket(httpServer: HTTPServer) {
  wsManager.initialize(httpServer);
  console.log('✓ WebSocket collaboration server initialized');
}

/**
 * Cleanup WebSocket on server shutdown
 */
export function cleanupWebSocket() {
  wsManager.destroy();
  console.log('✓ WebSocket collaboration server cleaned up');
}
