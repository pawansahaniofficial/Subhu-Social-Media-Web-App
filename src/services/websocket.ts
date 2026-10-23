type MessageHandler = (payload: any) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimeout: any = null;
  private token: string | null = null;

  public connect(token: string) {
    this.token = token;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        // Authenticate
        this.send({ type: 'auth', token });
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.emit(payload.type, payload);
          // Also emit wildcard
          this.emit('*', payload);
        } catch (err) {
          console.error('Failed to parse incoming WebSocket message', err);
        }
      };

      this.socket.onclose = () => {
        this.socket = null;
        if (this.token) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => this.connect(this.token!), 3000);
        }
      };

      this.socket.onerror = (err) => {
        console.warn('WebSocket warning/error:', err);
      };
    } catch (e) {
      console.error('Could not initialize WebSocket', e);
    }
  }

  public disconnect() {
    this.token = null;
    clearTimeout(this.reconnectTimeout);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public send(payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  public on(event: string, handler: MessageHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  public off(event: string, handler: MessageHandler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, payload: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(payload);
        } catch (e) {
          console.error(`Error in WebSocket listener for ${event}:`, e);
        }
      });
    }
  }
}

export const wsClient = new WebSocketClient();
