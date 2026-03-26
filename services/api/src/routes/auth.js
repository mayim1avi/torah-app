import { findUserByEmail, findUserById, createUser, verifyPassword } from '../db/users.js';

export default async function authRoutes(fastify) {
  // POST /auth/register
  fastify.post('/auth/register', async (req, reply) => {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) {
      return reply.code(400).send({ error: 'name, email and password are required' });
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: 'Password must be at least 6 characters' });
    }
    const existing = await findUserByEmail(email);
    if (existing) return reply.code(409).send({ error: 'Email already registered' });

    const user = await createUser({ name, email, password });
    const token = fastify.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '90d' });
    return { token, user };
  });

  // POST /auth/login
  fastify.post('/auth/login', async (req, reply) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return reply.code(400).send({ error: 'email and password are required' });
    }
    const user = await findUserByEmail(email);
    if (!user) return reply.code(401).send({ error: 'Invalid credentials' });

    const valid = await verifyPassword(password, user.password);
    if (!valid) return reply.code(401).send({ error: 'Invalid credentials' });

    const token = fastify.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '90d' });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  });

  // GET /auth/me  (requires token)
  fastify.get('/auth/me', { preHandler: [fastify.authenticate] }, async (req) => {
    return findUserById(req.user.sub);
  });
}
