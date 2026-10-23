import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { SubhuDatabase } from './db.js';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
}

export class SubhuWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, string> = new Map(); // ws -> userId
  private db: SubhuDatabase;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.db = SubhuDatabase.getInstance();
    this.init();
  }

  private init(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      // Parse token from URL if provided (e.g. /ws?token=xxx)
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');

      if (token) {
        const session = this.db.getSessionByToken(token);
        if (session) {
          this.clients.set(ws, session.userId);
          this.broadcastPresence(session.userId, 'online');
        }
      }

      ws.on('message', (data: string) => {
        try {
          const payload = JSON.parse(data.toString());
          this.handleMessage(ws, payload);
        } catch (err) {
          console.error('Invalid WebSocket payload:', err);
        }
      });

      ws.on('close', () => {
        const userId = this.clients.get(ws);
        if (userId) {
          this.clients.delete(ws);
          // Check if user has no remaining sockets
          const stillOnline = Array.from(this.clients.values()).includes(userId);
          if (!stillOnline) {
            this.broadcastPresence(userId, 'offline');
          }
        }
      });

      ws.on('error', (err) => {
        console.error('WebSocket connection error:', err);
      });
    });
  }

  private handleMessage(ws: WebSocket, payload: any): void {
    const { type, ...data } = payload;

    switch (type) {
      case 'auth': {
        const session = this.db.getSessionByToken(data.token);
        if (session) {
          this.clients.set(ws, session.userId);
          ws.send(JSON.stringify({ type: 'auth_success', userId: session.userId }));
          this.broadcastPresence(session.userId, 'online');
        } else {
          ws.send(JSON.stringify({ type: 'auth_failed', error: 'Invalid or expired token' }));
        }
        break;
      }

      case 'chat_message': {
        const senderId = this.clients.get(ws);
        if (!senderId) return;

        const { conversationId, content, attachments } = data;
        const message = this.db.sendMessage(conversationId, senderId, content, attachments);

        // Send to all members of conversation
        const conv = this.db.getConversations(senderId).find((c) => c.id === conversationId);
        if (conv) {
          conv.memberIds.forEach((memberId) => {
            this.sendToUser(memberId, {
              type: 'new_message',
              message,
              conversationId,
            });
          });
        }
        break;
      }

      case 'typing_indicator': {
        const senderId = this.clients.get(ws);
        if (!senderId) return;

        const { conversationId, isTyping } = data;
        const conv = this.db.getConversations(senderId).find((c) => c.id === conversationId);
        if (conv) {
          conv.memberIds
            .filter((id) => id !== senderId)
            .forEach((memberId) => {
              this.sendToUser(memberId, {
                type: 'typing_update',
                conversationId,
                userId: senderId,
                isTyping,
              });
            });
        }
        break;
      }

      // WebRTC Signaling Events
      case 'webrtc_call_initiate': {
        const callerId = this.clients.get(ws);
        if (!callerId) return;

        const { calleeId, callType, offer } = data;
        const caller = this.db.getUserById(callerId);

        this.sendToUser(calleeId, {
          type: 'webrtc_incoming_call',
          callerId,
          caller: caller ? { id: caller.id, fullName: caller.fullName, avatar: caller.avatar, username: caller.username } : null,
          callType,
          offer,
        });
        break;
      }

      case 'webrtc_call_answer': {
        const calleeId = this.clients.get(ws);
        if (!calleeId) return;

        const { callerId, answer } = data;
        this.sendToUser(callerId, {
          type: 'webrtc_call_accepted',
          calleeId,
          answer,
        });
        break;
      }

      case 'webrtc_ice_candidate': {
        const senderId = this.clients.get(ws);
        if (!senderId) return;

        const { targetUserId, candidate } = data;
        this.sendToUser(targetUserId, {
          type: 'webrtc_ice_candidate',
          senderId,
          candidate,
        });
        break;
      }

      case 'webrtc_call_end': {
        const senderId = this.clients.get(ws);
        if (!senderId) return;

        const { targetUserId } = data;
        this.sendToUser(targetUserId, {
          type: 'webrtc_call_ended',
          senderId,
        });
        break;
      }
    }
  }

  private sendToUser(userId: string, payload: any): void {
    const raw = JSON.stringify(payload);
    for (const [socket, clientUserId] of this.clients.entries()) {
      if (clientUserId === userId && socket.readyState === WebSocket.OPEN) {
        socket.send(raw);
      }
    }
  }

  private broadcastPresence(userId: string, status: 'online' | 'offline'): void {
    const raw = JSON.stringify({
      type: 'presence_update',
      userId,
      status,
    });
    for (const [socket] of this.clients.entries()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(raw);
      }
    }
  }
}
