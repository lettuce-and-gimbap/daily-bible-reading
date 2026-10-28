// 밝은 8비트 픽셀풍 연주곡. 외부 음원 없이 Web Audio로 실시간 합성한다.
export const CATEGORIES = ['잔잔함', '밝음', '신남', '웅장함', '기도와 묵상'];

// 장조 펜타토닉 중심의 짧고 기억하기 쉬운 선율.
const motifs = [
  [60, 64, 67, 69, 67, 64, 62, 64, 67, 72, 69, 67, 64, 62, 60, 64],
  [72, 76, 79, 76, 74, 76, 79, 81, 79, 76, 74, 72, 74, 76, 72, 67],
  [67, 69, 72, 76, 74, 72, 69, 67, 72, 74, 76, 79, 76, 74, 72, 69],
  [60, 67, 64, 72, 67, 64, 69, 67, 60, 64, 67, 74, 72, 69, 67, 64],
  [69, 72, 76, 74, 72, 69, 67, 69, 72, 76, 79, 76, 74, 72, 69, 67],
];

// C, G, F 장조 계열 진행으로 어두운 단조 진행을 피한다.
const progressions = [
  [[48, 52, 55], [43, 47, 50], [41, 45, 48], [48, 52, 55]],
  [[48, 52, 55], [41, 45, 48], [43, 47, 50], [48, 52, 55]],
  [[41, 45, 48], [48, 52, 55], [43, 47, 50], [48, 52, 55]],
  [[43, 47, 50], [41, 45, 48], [48, 52, 55], [43, 47, 50]],
];

const titles = [
  ['햇살 한 모금', '푸른 초장의 산책', '샘가의 낮잠', '아침 이슬 톡톡', '평안한 소풍'],
  ['햇살의 찬양', '감사의 뜰', '새로운 아침', '소망의 빛'],
  ['기쁨의 발걸음', '통통 튀는 찬양', '승리의 행진', '기쁜 소식', '함께 부르는 노래'],
  ['영광의 빛', '기쁨의 행진', '왕의 귀환', '하늘의 문'],
  ['골방의 작은 기쁨', '잠잠한 기다림', '별빛 아래 쉼', '품 안의 평안'],
];
const tempos = [88, 104, 126, 112, 78];

export const TRACKS = titles.flatMap((names, categoryIndex) => names.map((name, index) => ({
  name,
  category: CATEGORIES[categoryIndex],
  bpm: tempos[categoryIndex] + (index % 3) * 3,
  type: categoryIndex === 2 && index % 2 ? 'square' : 'triangle',
  melody: Array.from({ length: 32 }, (_, n) => {
    const base = motifs[(categoryIndex + index) % motifs.length][(n + index * 3) % 16];
    return base + (n > 15 && n % 8 === 0 ? 12 : 0) + (index % 2 ? 2 : 0);
  }),
  chords: progressions[index % progressions.length].map((chord) => chord.map((note) => note + (index % 2 ? 2 : 0))),
  arpeggio: categoryIndex !== 3,
})));

// 모든 분위기를 차례로 돌고, 각 분위기 안에서는 곡이 겹치지 않게 섞는다.
export function createPlaylist(random = Math.random) {
  const shuffle = (items) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const bags = new Map();
  let categories = [];
  let last = '';
  return () => {
    if (!categories.length) {
      categories = shuffle([...CATEGORIES]);
      if (categories[0] === last) categories.push(categories.shift());
    }
    const category = categories.shift();
    last = category;
    if (!bags.get(category)?.length) {
      bags.set(category, shuffle(TRACKS.map((track, i) => track.category === category ? i : -1).filter((i) => i >= 0)));
    }
    return bags.get(category).pop();
  };
}

export function createBgm() {
  let context = null;
  let gain = null;
  let tone = null;
  let echo = null;
  let timer = null;
  let next = 0;
  let step = 0;
  let track = 0;
  let enabled = false;
  const pick = createPlaylist();
  track = pick();

  const note = (midi, start, length, volume, type = 'triangle', attack = 0.012) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    const end = start + length;
    const peak = start + Math.min(attack, length * 0.2);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, peak);
    envelope.gain.setTargetAtTime(volume * 0.42, peak, Math.max(0.025, length * 0.12));
    envelope.gain.setTargetAtTime(0.00001, end, 0.045);
    oscillator.connect(envelope);
    envelope.connect(tone);
    envelope.connect(echo);
    oscillator.start(start);
    oscillator.stop(end + 0.35);
  };

  function schedule() {
    if (!enabled || context.state !== 'running') return;
    next = Math.max(next, context.currentTime + 0.02);
    while (next < context.currentTime + 0.25) {
      const current = TRACKS[track];
      const beat = 60 / current.bpm;
      const phrase = step % 8;
      const bar = Math.floor(step / 8);
      const chord = current.chords[bar % 4];
      const melodyIndex = Math.floor(step / 2) % current.melody.length;
      const pitch = current.melody[melodyIndex];

      // 짧은 리드와 엇박 플럭으로 게임 음악 같은 경쾌함을 만든다.
      if (phrase !== 7 && !(current.category === '잔잔함' && phrase === 6)) {
        note(pitch, next, beat * (phrase % 4 === 2 ? 0.72 : 0.43), current.category === '잔잔함' ? 0.065 : 0.075, current.type);
        if (phrase === 4 && bar % 2 === 1) note(pitch + 12, next + beat * 0.08, beat * 0.3, 0.026, 'square');
      }
      if (phrase === 0) {
        chord.forEach((midi, i) => note(midi + 12, next + i * 0.025, beat * 2.7, 0.014, 'triangle', 0.06));
        note(chord[0] - 12, next, beat * 0.72, 0.052, 'triangle', 0.008);
      }
      if (phrase === 2 || phrase === 6) {
        const chordNote = chord[(phrase / 2) % 3] + 12;
        note(chordNote, next, beat * 0.28, 0.035, 'square', 0.006);
      }

      next += beat * 0.5;
      step++;
      if (step === 256) {
        step = 0;
        track = pick();
        next += beat;
      }
    }
  }

  return {
    get enabled() { return enabled; },
    async setEnabled(value) {
      if (!value) {
        enabled = false;
        clearInterval(timer);
        timer = null;
        if (context) await context.suspend();
        return false;
      }
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Audio) throw new Error('이 브라우저는 배경음악을 지원하지 않아요.');
      if (!context) {
        try { if (globalThis.navigator?.audioSession) globalThis.navigator.audioSession.type = 'playback'; } catch (_) {}
        context = new Audio();
        gain = context.createGain();
        gain.gain.value = 1.15;
        tone = context.createBiquadFilter();
        tone.type = 'lowpass';
        tone.frequency.value = 5200;
        tone.Q.value = 0.35;
        tone.connect(gain);
        echo = context.createDelay(1);
        echo.delayTime.value = 0.19;
        const wet = context.createGain();
        const feedback = context.createGain();
        wet.gain.value = 0.055;
        feedback.gain.value = 0.08;
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2800;
        echo.connect(filter);
        filter.connect(wet);
        wet.connect(gain);
        filter.connect(feedback);
        feedback.connect(echo);
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -8;
        limiter.knee.value = 12;
        limiter.ratio.value = 3;
        limiter.attack.value = 0.006;
        limiter.release.value = 0.16;
        gain.connect(limiter);
        limiter.connect(context.destination);
      }
      await context.resume();
      enabled = true;
      next = Math.max(next, context.currentTime + 0.04);
      clearInterval(timer);
      timer = setInterval(schedule, 80);
      schedule();
      return true;
    },
    dispose() {
      enabled = false;
      clearInterval(timer);
      context?.close();
    },
  };
}
