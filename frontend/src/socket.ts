import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL ?? "";

class SocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL);

    this.socket.on("connect", () => {
      console.log("Socket conectado");
      this.socket?.emit("authenticate", token);
    });

    this.socket.on("authenticated", (data) => {
      console.log("Socket autenticado:", data);
    });

    this.socket.on("auth_error", (data) => {
      console.error("Error de autenticación:", data);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket desconectado");
    });

    // Registrar listeners guardados
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off(event: string, callback?: Function) {
    if (callback) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
      this.socket?.off(event, callback as any);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  emit(event: string, data?: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketManager = new SocketManager();
