import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
  private currentToken: string | null = null;
  private reconnectCallbacks: Array<() => void> = [];

  connect(token: string) {
    if (this.socket && this.currentToken === token) return; // already connected

    if (this.socket) this.socket.disconnect();

    this.currentToken = token;
    this.socket = io(this.socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });

    // Issue #24: on reconnect, fire all registered callbacks so pages can
    // refetch active ride + rejoin their room
    this.socket.on('reconnect', () => {
      console.log('[Socket] Reconnected — running recovery callbacks');
      this.reconnectCallbacks.forEach((cb) => cb());
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection Error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentToken = null;
    }
  }

  /** Join a ride room after booking or on reconnect */
  joinRoom(rideId: string) {
    this.socket?.emit('join-ride', { rideId });
  }

  /** Leave a ride room */
  leaveRoom(rideId: string) {
    this.socket?.emit('leave-ride', { rideId });
  }

  /** Register a callback to run on every reconnect (page-level recovery) */
  onReconnect(callback: () => void) {
    this.reconnectCallbacks.push(callback);
    // Return cleanup function so callers can deregister
    return () => {
      this.reconnectCallbacks = this.reconnectCallbacks.filter((cb) => cb !== callback);
    };
  }

  /** Driver: announce going online so backend joins driver room */
  goOnline() {
    this.socket?.emit('driver-go-online');
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
