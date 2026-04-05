import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3002', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io/',
  });

  // Store io instance globally so API routes can access it
  (globalThis as Record<string, unknown>).__nuclave_io = io;

  io.on('connection', (socket) => {
    // Join an arena room
    socket.on('join-arena', (arenaId: string) => {
      socket.join(`arena:${arenaId}`);
      const room = io.sockets.adapter.rooms.get(`arena:${arenaId}`);
      const count = room?.size ?? 0;

      // Notify all participants of updated count
      io.to(`arena:${arenaId}`).emit('participant-count', count);
    });

    // New contribution submitted
    socket.on('new-contribution', (data: { arenaId: string; contribution: unknown }) => {
      // Broadcast to all other participants in the arena
      socket.to(`arena:${data.arenaId}`).emit('contribution-added', data.contribution);
    });

    // Signal toggled
    socket.on('signal-update', (data: { arenaId: string; contributionId: string; signals: unknown }) => {
      socket.to(`arena:${data.arenaId}`).emit('signals-updated', {
        contributionId: data.contributionId,
        signals: data.signals,
      });
    });

    // Phase changed
    socket.on('phase-change', (data: { arenaId: string; phase: string }) => {
      io.to(`arena:${data.arenaId}`).emit('phase-changed', data.phase);
    });

    // Summary updated
    socket.on('summary-update', (data: { arenaId: string; summary: unknown }) => {
      io.to(`arena:${data.arenaId}`).emit('summary-updated', data.summary);
    });

    // Leave arena
    socket.on('leave-arena', (arenaId: string) => {
      socket.leave(`arena:${arenaId}`);
      const room = io.sockets.adapter.rooms.get(`arena:${arenaId}`);
      const count = room?.size ?? 0;
      io.to(`arena:${arenaId}`).emit('participant-count', count);
    });

    // Disconnect
    socket.on('disconnect', () => {
      // Socket.io auto-removes from rooms on disconnect
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Nuclave ready on http://${hostname}:${port}`);
  });
});
