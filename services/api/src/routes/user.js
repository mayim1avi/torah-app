import {
  getSavedLessons, isLessonSaved, saveLesson, unsaveLesson,
} from '../db/library.js';
import { upsertProgress, getProgress, getHistory } from '../db/progress.js';

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

  // ── Progress & History ─────────────────────────────────────────────────

  // POST /api/user/progress  body: { lessonId, positionMs, durationMs }
  fastify.post('/user/progress', auth, async (req, reply) => {
    const { lessonId, positionMs, durationMs = 0 } = req.body ?? {};
    if (!lessonId) return reply.code(400).send({ error: 'lessonId required' });
    await upsertProgress(req.user.sub, lessonId, positionMs, durationMs);
    return { ok: true };
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
