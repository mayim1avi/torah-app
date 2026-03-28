import {
  getRootCategories,
  getCategoryById,
  getChildren,
  getAncestors,
  generateVirtualChildren,
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
  // :id can be a real id (11) or a virtual id (11_3)
  fastify.get('/categories/:id', async (req, reply) => {
    const rawId = req.params.id;
    const isVirtual = rawId.includes('_');
    const realId = Number(isVirtual ? rawId.split('_')[0] : rawId);
    const page = isVirtual ? Number(rawId.split('_')[1]) : null;

    if (!realId) return reply.code(400).send({ error: 'Invalid id' });

    const [category, children, ancestors] = await Promise.all([
      getCategoryById(realId),
      getChildren(realId),
      getAncestors(realId),
    ]);

    if (!category) return reply.code(404).send({ error: 'Category not found' });

    const virtualChildren = generateVirtualChildren(category);
    const allChildren = [...virtualChildren, ...children];

    // For virtual subcategory pages, add the virtual node itself to ancestors
    if (isVirtual) {
      const virtualName = (virtualChildren.find(v => v.id === rawId) ?? {}).name ?? rawId;
      ancestors.push({ id: realId, name: category.name });
      return {
        ...category,
        id: rawId,
        name: virtualName,
        page,
        children: [],
        ancestors,
        virtual: true,
      };
    }

    return { ...category, children: allChildren, ancestors };
  });

  // GET /api/categories/:id/content
  fastify.get('/categories/:id/content', async (req, reply) => {
    const rawId = req.params.id;
    const isVirtual = rawId.includes('_');
    const id = Number(isVirtual ? rawId.split('_')[0] : rawId);
    const page = isVirtual ? Number(rawId.split('_')[1]) : null;

    if (!id) return reply.code(400).send({ error: 'Invalid id' });

    const {
      teacherIds: teacherIdsRaw = '',
      institutionIds: institutionIdsRaw = '',
      type = 'all',
      limit = 50,
      offset = 0,
      q = '',
    } = req.query;

    const teacherIds = teacherIdsRaw
      ? teacherIdsRaw.split(',').map(Number).filter(Boolean)
      : [];
    const institutionIds = institutionIdsRaw
      ? institutionIdsRaw.split(',').map(Number).filter(Boolean)
      : [];
    const opts = { teacherIds, institutionIds, q, page, limit: Number(limit), offset: Number(offset) };

    const [series, lessons, teachers, institutions] = await Promise.all([
      type !== 'lessons' ? getSeriesByCategory(id, opts) : [],
      type !== 'series' ? getLessonsByCategory(id, opts) : [],
      getTeachersByCategory(id),
      getInstitutionsByCategory(id),
    ]);

    return { series, lessons, filters: { teachers, institutions } };
  });
}
