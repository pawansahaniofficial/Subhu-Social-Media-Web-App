import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/server/routes/auth.js';
import postsRoutes from './src/server/routes/posts.js';
import usersRoutes from './src/server/routes/users.js';
import friendsRoutes from './src/server/routes/friends.js';
import messagesRoutes from './src/server/routes/messages.js';
import storiesRoutes from './src/server/routes/stories.js';
import callsRoutes from './src/server/routes/calls.js';
import notificationsRoutes from './src/server/routes/notifications.js';
import moderationRoutes from './src/server/routes/moderation.js';
import searchRoutes from './src/server/routes/search.js';
import systemRoutes from './src/server/routes/system.js';
import { SubhuWebSocketServer } from './src/server/websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Middlewares
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API v1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/posts', postsRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/friends', friendsRoutes);
  app.use('/api/v1/messages', messagesRoutes);
  app.use('/api/v1/stories', storiesRoutes);
  app.use('/api/v1/calls', callsRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/moderation', moderationRoutes);
  app.use('/api/v1/search', searchRoutes);
  app.use('/api/v1/system', systemRoutes);

  // Initialize WebSocket and WebRTC Signaling Server
  new SubhuWebSocketServer(server);

  // Vite integration: Dev middleware or Static production serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Subhu Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Subhu server:', err);
  process.exit(1);
});
