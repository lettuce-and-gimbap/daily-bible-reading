// 개발자 피드백: 화면이 바뀌면 녹음과 마이크를 즉시 정리한다.
let feedbackCleanup = null;
function feedbackCardHtml() {
  return `<section class="card" id="feedback-card"><h2>개발자에게 말해요</h2>
    <p class="muted small">불편한 점이나 바라는 기능을 글·음성으로 알려 주세요. 벅수 관리자에게 전달돼요.</p>
    ${account ? `<form id="feedback-form"><textarea id="feedback-text" rows="4" maxlength="3000" placeholder="어떤 점이 불편하셨나요?" aria-label="개발자에게 보낼 내용"></textarea>
    <div class="inline wrap"><button class="btn ghost small" type="button" id="feedback-record">🎙 음성 녹음</button><button class="btn ghost small" type="button" id="feedback-clear" hidden>음성 지우기</button><span class="muted small" id="feedback-status" role="status"></span></div>
    <audio id="feedback-preview" controls hidden></audio><p class="muted small">음성은 최대 1분이에요. 전송하면 계정 이름과 함께 관리자에게 저장돼요.</p><button class="btn primary small" type="submit" id="feedback-send">보내기</button></form>` : '<p class="muted">위 계정 메뉴에서 로그인하면 보낼 수 있어요.</p>'}
    ${isAdmin() ? '<details id="feedback-inbox"><summary>📬 받은 피드백</summary><button class="btn ghost small" id="feedback-refresh">새로고침</button><div id="feedback-items" aria-live="polite"></div><button class="btn ghost small" id="feedback-more" hidden>이전 피드백 더 보기</button></details>' : ''}</section>`;
}
function bindFeedbackCard() {
  if (feedbackCleanup) feedbackCleanup();
  const card = document.getElementById('feedback-card');
  if (!card) return;
  const get = (id) => card.querySelector('#' + id);
  let recorder, stream, timer, limit, blob, previewUrl, starting = false, disposed = false;
  const urls = [];
  const status = (s) => { if (get('feedback-status')) get('feedback-status').textContent = s; };
  const release = () => { clearInterval(timer); clearTimeout(limit); if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
  const observer = new MutationObserver(() => { if (!card.isConnected) feedbackCleanup(); });
  feedbackCleanup = () => { disposed = true; observer.disconnect(); if (recorder?.state === 'recording') recorder.stop(); release(); if (previewUrl) URL.revokeObjectURL(previewUrl); urls.forEach(u => URL.revokeObjectURL(u)); };
  observer.observe(app, { childList: true });
  const record = get('feedback-record');
  if (record) {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { record.disabled = true; status('이 브라우저에서는 글로 보내 주세요.'); }
    record.onclick = async () => {
      if (starting) return;
      if (recorder?.state === 'recording') { recorder.stop(); return; }
      starting = true; record.disabled = true;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (disposed) { release(); return; }
        const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported(t));
        recorder = mime ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 64000 }) : new MediaRecorder(stream);
        const chunks = [];
        recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        recorder.onstop = () => {
          release(); if (disposed) return;
          blob = new Blob(chunks, { type: recorder.mimeType });
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          previewUrl = URL.createObjectURL(blob); get('feedback-preview').src = previewUrl; get('feedback-preview').hidden = false;
          get('feedback-clear').hidden = false; record.textContent = '🎙 다시 녹음'; get('feedback-send').disabled = false; status('녹음했어요. 들어본 후 보내 주세요.');
        };
        recorder.onerror = () => { release(); get('feedback-send').disabled = false; status('녹음에 실패했어요. 다시 시도해 주세요.'); };
        recorder.start(); record.textContent = '■ 녹음 마치기'; get('feedback-send').disabled = true;
        const start = Date.now(); status('녹음 중 · 0초 / 60초');
        timer = setInterval(() => status(`녹음 중 · ${Math.floor((Date.now() - start) / 1000)}초 / 60초`), 1000);
        limit = setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 60000);
      } catch (e) { release(); status('마이크 권한을 확인해 주세요. 글로도 보낼 수 있어요.'); }
      finally { starting = false; if (!disposed) record.disabled = false; }
    };
    get('feedback-clear').onclick = () => { blob = null; if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = null; get('feedback-preview').removeAttribute('src'); get('feedback-preview').hidden = true; get('feedback-clear').hidden = true; record.textContent = '🎙 음성 녹음'; status('음성을 지웠어요.'); };
    get('feedback-form').onsubmit = async e => {
      e.preventDefault(); const message = get('feedback-text').value.trim();
      if (!message && !blob) return status('글을 쓰거나 음성을 녹음해 주세요.');
      if (blob && blob.size > 1350000) return status('음성이 너무 커요. 조금 짧게 다시 녹음해 주세요.');
      get('feedback-send').disabled = true; record.disabled = true; get('feedback-clear').disabled = true; status('보내는 중…');
      try {
        const audio = blob ? await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result).split(',')[1]); r.onerror = reject; r.readAsDataURL(blob); }) : '';
        await accountApi('feedback', { message, audio, mime: blob?.type || '' });
        if (disposed) return;
        get('feedback-text').value = ''; get('feedback-clear').disabled = false; get('feedback-clear').click(); status('벅수 관리자에게 보냈어요. 감사합니다!');
      } catch (err) { status(err.message || '전송에 실패했어요. 다시 시도해 주세요.'); }
      finally { if (!disposed) { get('feedback-send').disabled = false; record.disabled = !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder; get('feedback-clear').disabled = false; } }
    };
  }
  if (!isAdmin()) return;
  let before = '', busy = false;
  const load = async (more = false) => {
    if (busy) return; busy = true;
    const box = get('feedback-items');
    try {
      const data = await accountApi('feedback' + (more && before ? '?before=' + before : ''));
      if (disposed) return;
      if (!more) box.replaceChildren();
      if (!data.items.length && !more) box.textContent = '아직 받은 피드백이 없어요.';
      for (const item of data.items) {
        const article = document.createElement('article'); article.className = 'feedback-item';
        article.innerHTML = `<p><b>${esc(item.user_id)}</b> · ${esc(new Date(item.created).toLocaleString('ko-KR'))}${item.seen ? '' : ' · 새 피드백'}</p><p class="feedback-message">${esc(item.message)}</p>${item.mime ? '<button class="btn ghost small" data-audio>음성 듣기</button>' : ''}${!item.seen ? '<button class="btn ghost small" data-read>확인했어요</button>' : ''}`;
        article.querySelector('[data-audio]')?.addEventListener('click', async e => {
          const b = e.currentTarget; b.disabled = true;
          try { const data = await accountApi('feedback/audio?id=' + encodeURIComponent(item.id)); if (disposed) return; const bytes = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0)); const u = URL.createObjectURL(new Blob([bytes], { type: data.mime })); urls.push(u); const audio = document.createElement('audio'); audio.controls = true; audio.src = u; b.replaceWith(audio); }
          catch (err) { showToast(err.message); b.disabled = false; }
        });
        article.querySelector('[data-read]')?.addEventListener('click', async e => { const b = e.currentTarget; b.disabled = true; try { await accountApi('feedback/read', { id: item.id }); b.textContent = '확인 완료'; } catch (err) { b.disabled = false; showToast(err.message); } });
        box.append(article);
      }
      before = data.items.at(-1)?.created || ''; get('feedback-more').hidden = data.items.length < 20;
    } catch (err) { if (!disposed) showToast(err.message); }
    finally { busy = false; }
  };
  get('feedback-inbox').ontoggle = () => { if (get('feedback-inbox').open) load(); };
  get('feedback-refresh').onclick = () => load(); get('feedback-more').onclick = () => load(true);
}

