import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/config';

class SocketService {
  private socket: Socket | null = null;
  private socketUrl = SOCKET_URL;
  private currentToken: string | null = null;
  private reconnectCallbacks: Array<() => void> = [];

  connect(token: string) {
    if (this.socket && this.currentToken === token) return;

    if (this.socket) this.socket.disconnect();

    this.currentToken = token;
    this.socket = io(this.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });

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

  joinRoom(rideId: string) {
    this.socket?.emit('join-ride', { rideId });
  }

  leaveRoom(rideId: string) {
    this.socket?.emit('leave-ride', { rideId });
  }

  onReconnect(callback: () => void) {
    this.reconnectCallbacks.push(callback);
    return () => {
      this.reconnectCallbacks = this.reconnectCallbacks.filter((cb) => cb !== callback);
    };
  }

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
