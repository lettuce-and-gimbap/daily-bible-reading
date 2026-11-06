// 통독 본문의 실제 스크롤 영역을 기준으로 이동 거리와 남은 시간을 계산한다.
function createReadingAutoScroll(body, host, trigger) {
  const bar = document.createElement('div');
  bar.className = 'reading-auto-scroll';
  bar.id = 'reading-scroll-controls';
  bar.hidden = true;
  bar.innerHTML = `<div class="auto-scroll-main"><span class="auto-scroll-heading">자동 스크롤</span><button type="button" class="btn" data-play aria-pressed="false">▶ 시작</button><span class="auto-scroll-info"><span data-status>일시정지</span><output data-eta aria-label="맨 아래까지 남은 시간" title="맨 아래까지 남은 시간">00:00</output></span></div><label class="auto-scroll-speed">느리게 <input type="range" min="3" max="30" step="0.5" value="7" aria-label="자동 스크롤 속도 (초당 픽셀)"> 빠르게 <output data-speed>7 px/s</output></label>`;
  host.append(bar);
  function togglePanel() {
    bar.hidden = !bar.hidden;
    trigger.setAttribute('aria-expanded', String(!bar.hidden));
    updateEta();
  }
  trigger.addEventListener('click', togglePanel);
  const play = bar.querySelector('[data-play]'), slider = bar.querySelector('input');
  const speedLabel = bar.querySelector('[data-speed]'), eta = bar.querySelector('[data-eta]'), status = bar.querySelector('[data-status]');
  let speed = 7, running = false, frame = 0, last = null, position = 0, expected = 0, destroyed = false;
  function syncRunning() { trigger.textContent = running ? '자동 ON' : '자동 OFF'; trigger.setAttribute('aria-pressed', String(running)); }
  const distance = () => Math.max(0, body.scrollHeight - body.clientHeight - body.scrollTop);
  function updateEta() {
    const seconds = Math.ceil(distance() / speed);
    eta.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function pause(label = '일시정지') {
    running = false;
    cancelAnimationFrame(frame);
    frame = 0; last = null;
    play.textContent = '▶ 시작'; play.setAttribute('aria-pressed', 'false'); status.textContent = label; syncRunning();
  }
  function tick(time) {
    if (!running) return;
    if (!body.isConnected || trigger.hidden || document.hidden || document.querySelector('dialog[open]')) { pause(); return; }
    if (Math.abs(body.scrollTop - expected) > 1) position = expected = body.scrollTop;
    if (last !== null) {
      // 소수 픽셀을 누적해 낮은 속도에서도 브라우저의 정수 반올림으로 멈추지 않는다.
      position = Math.min(body.scrollHeight - body.clientHeight, position + speed * Math.min((time - last) / 1000, 0.1));
      body.scrollTop = position;
      expected = body.scrollTop;
    }
    last = time;
    updateEta();
    if (distance() <= 0) { pause('도착'); eta.textContent = '00:00'; return; }
    frame = requestAnimationFrame(tick);
  }
  function toggle() {
    if (running) return pause();
    updateEta();
    if (distance() <= 0) return pause('도착');
    position = expected = body.scrollTop; last = null; running = true;
    play.textContent = 'Ⅱ 멈춤'; play.setAttribute('aria-pressed', 'true'); status.textContent = '재생 중'; syncRunning();
    frame = requestAnimationFrame(tick);
  }
  function changeSpeed() { speed = Math.max(3, Math.min(30, Number(slider.value) || 7)); speedLabel.textContent = `${speed} px/s`; updateEta(); }
  function scrolled() {
    if (!running || Math.abs(body.scrollTop - expected) <= 1) return;
    position = expected = body.scrollTop;
    updateEta();
  }
  function visibility() { if (document.hidden) pause(); }
  play.addEventListener('click', toggle); slider.addEventListener('input', changeSpeed);
  body.addEventListener('scroll', scrolled, {passive:true});
  document.addEventListener('visibilitychange', visibility);
  // 본문 로딩·화면 전환 시 다시 계산하고 화면이 제거되면 리스너도 해제한다.
  const observer = new MutationObserver(() => {
    if (!body.isConnected) { destroy(); return; }
    // 늦게 로드되는 본문·주석 표시로 DOM이 바뀌어도 재생 상태를 유지한다.
    if (running) position = expected = body.scrollTop;
    updateEta();
  });
  observer.observe(body, {childList:true, subtree:true});
  const routeObserver = new MutationObserver(() => { if (!body.isConnected) destroy(); });
  routeObserver.observe(host.parentElement.parentElement, {childList:true});
  function destroy() {
    if (destroyed) return;
    destroyed = true; pause(); observer.disconnect(); routeObserver.disconnect();
    body.removeEventListener('scroll', scrolled); document.removeEventListener('visibilitychange', visibility); trigger.removeEventListener('click', togglePanel); bar.remove();
  }
  updateEta(); syncRunning();
  return {pause, destroy, setVisible(visible) { trigger.hidden = !visible; if (!visible) { bar.hidden = true; trigger.setAttribute('aria-expanded', 'false'); pause(); } }};
}
