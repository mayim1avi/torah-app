import { getAllInstitutions, getInstitutionById, getSeriesByInstitution, getLessonsByInstitution } from '../db/institutions.js';

export default async function institutionRoutes(fastify) {
  fastify.get('/institutions', async (req) => {
    const { search = '', limit = 200, offset = 0 } = req.query;
    return getAllInstitutions({ search, limit: Number(limit), offset: Number(offset) });
  });

  fastify.get('/institutions/:id', async (req, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: 'Invalid id' });
    const inst = await getInstitutionById(id);
    if (!inst) return reply.code(404).send({ error: 'Institution not found' });
    return inst;
  });

  fastify.get('/institutions/:id/series', async (req, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: 'Invalid id' });
    const { limit = 50, offset = 0 } = req.query;
    return getSeriesByInstitution(id, { limit: Number(limit), offset: Number(offset) });
  });

  fastify.get('/institutions/:id/lessons', async (req, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: 'Invalid id' });
    const { limit = 50, offset = 0 } = req.query;
    return getLessonsByInstitution(id, { limit: Number(limit), offset: Number(offset) });
  });
}
