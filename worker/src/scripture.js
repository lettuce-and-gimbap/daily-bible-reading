// Scripture books live in the Worker KV binding, outside public Pages assets.
const EDITIONS = new Set(['gae', 'easy', 'niv', 'han', 'hyun', 'saenew']);
const BOOKS = new Set('gen exo lev num deu jos jdg rut 1sa 2sa 1ki 2ki 1ch 2ch ezr neh est job psa pro ecc sng isa jer lam ezk dan hos jol amo oba jnh mic nam hab zep hag zec mal mat mrk luk jhn act rom 1co 2co gal eph php col 1th 2th 1ti 2ti tit phm heb jas 1pe 2pe 1jn 2jn 3jn jud rev'.split(' '));

export async function scriptureChapter(request, env, json, cors) {
  if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405);
  const q = new URL(request.url).searchParams;
  const book = q.get('book') || '';
  const chapter = Number(q.get('chapter'));
  const editions = [...new Set([q.get('ver'), q.get('ver2'), q.get('ver3')].filter(Boolean))];
  if (!BOOKS.has(book) || q.has('ver4') || !Number.isInteger(chapter) || chapter < 1 || chapter > 150 ||
      editions.length < 1 || editions.length > 3 || editions.some(v => !EDITIONS.has(v))) {
    return json({ error: 'invalid scripture reference' }, 400);
  }
  const stored = await env.SUBS.get(`scripture:v1:${book}`, 'json');
  if (!stored?.editions) return json({ error: 'scripture data unavailable' }, 503);
  const rows = editions.flatMap(edition => (stored.editions[edition]?.[chapter] || []).map(([verse, text]) => ({
    ver: edition, label: String(verse), text,
  })));
  if (!rows.length || editions.some(edition => !stored.editions[edition]?.[chapter]?.length)) {
    return json({ error: 'chapter unavailable' }, 404);
  }
  return new Response(JSON.stringify({ book, chapter, rows }), {
    headers: { ...cors, 'content-type': 'application/json; charset=utf-8',
               'cache-control': 'private, no-store' },
  });
}
