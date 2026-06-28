import {
  getSavedLessons, isLessonSaved, saveLesson, unsaveLesson, saveLessonsBatch,
} from '../db/library.js';
import { upsertProgress, getProgress, getProgressBatch, getHistory } from '../db/progress.js';

export default async function userRoutes(fastify) {
  // All routes require auth
  const auth = { preHandler: [fastify.authenticate] };

  // ── Library ────────────────────────────────────────────────────────────

  // GET /api/user/library
  fastify.get('/user/library', auth, async (req) => {
    return getSavedLessons(req.user.sub);
  });

  // GET /api/user/library/:lessonId — check if saved
  fastify.get('/user/library/:lessonId', auth, async (req) => {
    const saved = await isLessonSaved(req.user.sub, Number(req.params.lessonId));
    return { saved };
  });

  // POST /api/user/library/:lessonId — save
  fastify.post('/user/library/:lessonId', auth, async (req, reply) => {
    await saveLesson(req.user.sub, Number(req.params.lessonId));
    return reply.code(201).send({ saved: true });
  });

  // DELETE /api/user/library/:lessonId — unsave
  fastify.delete('/user/library/:lessonId', auth, async (req) => {
    await unsaveLesson(req.user.sub, Number(req.params.lessonId));
    return { saved: false };
  });

  // POST /api/user/library/batch  body: { lessonIds: [1, 2, 3] }
  fastify.post('/user/library/batch', auth, async (req, reply) => {
    const { lessonIds } = req.body ?? {};
    if (!Array.isArray(lessonIds) || !lessonIds.length)
      return reply.code(400).send({ error: 'lessonIds required' });
    await saveLessonsBatch(req.user.sub, lessonIds.map(Number));
    reply.code(201);
    return { saved: true };
  });

  // ── Progress & History ─────────────────────────────────────────────────

  // POST /api/user/progress  body: { lessonId, positionMs, durationMs }
  fastify.post('/user/progress', auth, async (req, reply) => {
    const { lessonId, positionMs, durationMs = 0 } = req.body ?? {};
    if (!lessonId) return reply.code(400).send({ error: 'lessonId required' });
    await upsertProgress(req.user.sub, lessonId, positionMs, durationMs);
    return { ok: true };
  });

  // GET /api/user/progress/batch?ids=1,2,3
  fastify.get('/user/progress/batch', auth, async (req) => {
    const ids = (req.query.ids || '').split(',').map(Number).filter(Boolean);
    if (!ids.length) return {};
    const rows = await getProgressBatch(req.user.sub, ids);
    return Object.fromEntries(rows.map(r => [r.lesson_id, r]));
  });

  // GET /api/user/progress/:lessonId
  fastify.get('/user/progress/:lessonId', auth, async (req) => {
    const progress = await getProgress(req.user.sub, Number(req.params.lessonId));
    return progress ?? { position_ms: 0, duration_ms: 0, completed: 0 };
  });

  // GET /api/user/history
  fastify.get('/user/history', auth, async (req) => {
    const { limit = 30 } = req.query;
    return getHistory(req.user.sub, { limit: Number(limit) });
  });
}
