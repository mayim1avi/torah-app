import { getSeriesById, getLessonsBySeries, getTeachersBySeries } from '../db/series.js';

export default async function seriesRoutes(fastify) {
  fastify.get('/series/:id', async (req, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: 'Invalid id' });

    const [series, teachers] = await Promise.all([
      getSeriesById(id),
      getTeachersBySeries(id),
    ]);

    if (!series) return reply.code(404).send({ error: 'Series not found' });
    return { ...series, teachers };
  });

  fastify.get('/series/:id/lessons', async (req, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: 'Invalid id' });

    const { limit = 100, offset = 0 } = req.query;
    return getLessonsBySeries(id, { limit: Number(limit), offset: Number(offset) });
  });
}
