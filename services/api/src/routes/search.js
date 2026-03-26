import { searchContent } from '../db/search.js';

export default async function searchRoutes(fastify) {
  fastify.get('/search', async (req) => {
    const {
      q = '',
      categoryId,
      teacherIds: teacherIdsRaw = '',
      institutionIds: institutionIdsRaw = '',
      type = 'all',
      limit = 30,
      offset = 0,
    } = req.query;

    const teacherIds = teacherIdsRaw
      ? teacherIdsRaw.split(',').map(Number).filter(Boolean)
      : [];
    const institutionIds = institutionIdsRaw
      ? institutionIdsRaw.split(',').map(Number).filter(Boolean)
      : [];

    return searchContent({
      q,
      categoryId: categoryId ? Number(categoryId) : null,
      teacherIds,
      institutionIds,
      type,
      limit: Number(limit),
      offset: Number(offset),
    });
  });
}
