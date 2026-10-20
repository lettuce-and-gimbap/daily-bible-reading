// 로그인한 사용자의 피드백. 수신함과 음성 원본은 벅수 계정만 조회한다.
export async function feedback(path, request, db, uid, body, json) {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    if (uid !== 'buucksoo') return json({ error: '관리자만 확인할 수 있어요' }, 403);
    if (path === '/account/feedback/audio') {
      const row = await db.prepare('SELECT audio, mime FROM feedback WHERE id = ?').bind(url.searchParams.get('id') || '').first();
      return row ? json(row) : json({ error: '음성을 찾을 수 없어요' }, 404);
    }
    const before = Number(url.searchParams.get('before')) || Date.now() + 1;
    const { results } = await db.prepare('SELECT id, user_id, message, mime, created, seen FROM feedback WHERE created < ? ORDER BY created DESC LIMIT 20').bind(before).all();
    const count = await db.prepare('SELECT COUNT(*) AS n FROM feedback WHERE seen = 0').first();
    return json({ items: results, unread: count.n });
  }
  if (request.method !== 'POST') return json({ error: '지원하지 않는 요청이에요' }, 405);
  if (path === '/account/feedback/read') {
    if (uid !== 'buucksoo') return json({ error: '관리자만 확인할 수 있어요' }, 403);
    await db.prepare('UPDATE feedback SET seen = 1 WHERE id = ?').bind(String(body.id || '')).run();
    return json({ ok: true });
  }
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const audio = typeof body.audio === 'string' ? body.audio : '';
  const mime = String(body.mime || '');
  if ((!message && !audio) || message.length > 3000) return json({ error: '글은 3,000자 이내로 입력해 주세요' }, 400);
  if (audio && (audio.length > 1800000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(audio) || !/^audio\/(webm|mp4|ogg)(;codecs=[\w.,-]+)?$/.test(mime))) return json({ error: '음성 형식이나 크기를 확인해 주세요 (최대 약 1.3MB)' }, 400);
  const recent = await db.prepare('SELECT COUNT(*) AS n FROM feedback WHERE user_id = ? AND created > ?').bind(uid, Date.now() - 3600000).first();
  if (recent.n >= 10) return json({ error: '한 시간에 10개까지 보낼 수 있어요. 조금 뒤에 다시 보내 주세요' }, 429);
  await db.prepare('INSERT INTO feedback (id, user_id, message, audio, mime, created, seen) VALUES (?, ?, ?, ?, ?, ?, 0)').bind(crypto.randomUUID(), uid, message, audio, audio ? mime : '', Date.now()).run();
  return json({ ok: true });
}
