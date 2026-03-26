import { getAllTeachers, getTeacherById } from '../db/teachers.js';

export default async function teacherRoutes(fastify) {
  fastify.get('/teachers', async (req) => {
    const { search = '', limit = 200, offset = 0 } = req.query;
    return getAllTeachers({ search, limit: Number(limit), offset: Number(offset) });
  });

  fastify.get('/teachers/:id', async (req, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: 'Invalid id' });
    const teacher = await getTeacherById(id);
    if (!teacher) return reply.code(404).send({ error: 'Teacher not found' });
    return teacher;
  });
}
