// In-memory cache: url -> Buffer
// Evicts oldest entry when total exceeds MAX_BYTES
const cache = new Map();
let totalBytes = 0;
const MAX_BYTES = 300 * 1024 * 1024; // 300 MB

async function getBuffer(url) {
  if (cache.has(url)) return cache.get(url);

  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!resp.ok) throw new Error(`upstream ${resp.status}`);

  const buf = Buffer.from(await resp.arrayBuffer());

  // Evict oldest entries until there is room
  while (totalBytes + buf.length > MAX_BYTES && cache.size > 0) {
    const [oldKey, oldBuf] = cache.entries().next().value;
    cache.delete(oldKey);
    totalBytes -= oldBuf.length;
  }

  cache.set(url, buf);
  totalBytes += buf.length;
  return buf;
}

export default async function audioRoutes(fastify) {
  // GET /api/audio/proxy?url=<encoded>
  // Streams audio with proper range-request support regardless of upstream capabilities.
  fastify.get('/audio/proxy', async (req, reply) => {
    const rawUrl = req.query.url;
    if (!rawUrl) return reply.code(400).send({ error: 'Missing url' });

    let url;
    try {
      url = decodeURIComponent(rawUrl);
      new URL(url); // validate
    } catch {
      return reply.code(400).send({ error: 'Invalid url' });
    }

    if (!/^https?:\/\//i.test(url)) {
      return reply.code(400).send({ error: 'Only http/https allowed' });
    }

    try {
      const buf = await getBuffer(url);
      const total = buf.length;

      reply.header('accept-ranges', 'bytes');
      reply.header('content-type', 'audio/mpeg');
      reply.header('cache-control', 'public, max-age=3600');

      const rangeHeader = req.headers.range;
      if (!rangeHeader) {
        reply.header('content-length', total);
        return reply.send(buf);
      }

      // Parse: "bytes=start-end"
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (!match) return reply.code(416).send({ error: 'Invalid range' });

      const start = match[1] ? parseInt(match[1]) : 0;
      const end = match[2] ? Math.min(parseInt(match[2]), total - 1) : total - 1;

      if (start > end || start >= total) {
        reply.header('content-range', `bytes */${total}`);
        return reply.code(416).send({ error: 'Range not satisfiable' });
      }

      const chunk = buf.slice(start, end + 1);
      reply.code(206)
        .header('content-range', `bytes ${start}-${end}/${total}`)
        .header('content-length', chunk.length);
      return reply.send(chunk);
    } catch (err) {
      fastify.log.error(err, 'audio proxy error');
      return reply.code(502).send({ error: 'Failed to fetch audio' });
    }
  });
}
