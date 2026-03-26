import {
  getRootCategories,
  getCategoryById,
  getChildren,
  getAncestors,
} from '../db/categories.js';
import {
  getLessonsByCategory,
  getSeriesByCategory,
  getTeachersByCategory,
  getInstitutionsByCategory,
} from '../db/content.js';

export default async function categoryRoutes(fastify) {
  // GET /api/categories — root categories
  fastify.get('/categories', async () => {
    return getRootCategories();
  });

  // GET /api/categories/:id — category detail + children + ancestors
  fastify.get('/categories/:id', async (req, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: 'Invalid id' });

    const [category, children, ancestors] = await Promise.all([
      getCategoryById(id),
      getChildren(id),
      getAncestors(id),
    ]);

    if (!category) return reply.code(404).send({ error: 'Category not found' });

    return { ...category, children, ancestors };
  });

  // GET /api/categories/:id/content — series + lessons in a category
  // Query params: teacherIds (comma-sep), institutionIds (comma-sep), type (all|series|lessons), limit, offset
  fastify.get('/categories/:id/content', async (req, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: 'Invalid id' });

    const {
      teacherIds: teacherIdsRaw = '',
      institutionIds: institutionIdsRaw = '',
      type = 'all',
      limit = 50,
      offset = 0,
    } = req.query;

    const teacherIds = teacherIdsRaw
      ? teacherIdsRaw.split(',').map(Number).filter(Boolean)
      : [];
    const institutionIds = institutionIdsRaw
      ? institutionIdsRaw.split(',').map(Number).filter(Boolean)
      : [];
    const opts = { teacherIds, institutionIds, limit: Number(limit), offset: Number(offset) };

    const [series, lessons, teachers, institutions] = await Promise.all([
      type !== 'lessons' ? getSeriesByCategory(id, opts) : [],
      type !== 'series' ? getLessonsByCategory(id, opts) : [],
      getTeachersByCategory(id),
      getInstitutionsByCategory(id),
    ]);

    return { series, lessons, filters: { teachers, institutions } };
  });
}
