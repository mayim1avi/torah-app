import { getLessonById, getCategoriesByLesson } from '../db/lessons.js';

export default async function lessonRoutes(fastify) {
  fastify.get('/lessons/:id', async (req, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: 'Invalid id' });

    const [lesson, categories] = await Promise.all([
      getLessonById(id),
      getCategoriesByLesson(id),
    ]);

    if (!lesson) return reply.code(404).send({ error: 'Lesson not found' });
    return { ...lesson, categories };
  });
}
