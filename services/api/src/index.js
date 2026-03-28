import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import categoryRoutes from './routes/categories.js';
import seriesRoutes from './routes/series.js';
import lessonRoutes from './routes/lessons.js';
import teacherRoutes from './routes/teachers.js';
import institutionRoutes from './routes/institutions.js';
import searchRoutes from './routes/search.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import parashaRoutes from './routes/parasha.js';
import audioRoutes from './routes/audio.js';

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: true });

// JWT plugin — exposes fastify.jwt and fastify.authenticate
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'dev-secret',
});

// Decorator used as preHandler in protected routes
fastify.decorate('authenticate', async function (req, reply) {
  try {
    await req.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

// Public routes
await fastify.register(categoryRoutes, { prefix: '/api' });
await fastify.register(seriesRoutes, { prefix: '/api' });
await fastify.register(lessonRoutes, { prefix: '/api' });
await fastify.register(teacherRoutes, { prefix: '/api' });
await fastify.register(institutionRoutes, { prefix: '/api' });
await fastify.register(searchRoutes, { prefix: '/api' });
await fastify.register(parashaRoutes, { prefix: '/api' });
await fastify.register(audioRoutes, { prefix: '/api' });

// Auth routes (no prefix — /auth/login, /auth/register, /auth/me)
await fastify.register(authRoutes);

// Protected user routes
await fastify.register(userRoutes, { prefix: '/api' });

fastify.get('/health', async () => ({ status: 'ok' }));

const port = Number(process.env.PORT) || 3001;
await fastify.listen({ port, host: '0.0.0.0' });
console.log(`API running on http://localhost:${port}`);
