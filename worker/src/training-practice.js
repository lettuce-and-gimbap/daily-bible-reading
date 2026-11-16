const BANKS = { westminster: 1, discipleship: 2 };
const TYPES = new Set(["choice", "short", "written"]);

function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const semesterOf = ({ item, section }) => item === "discipleship"
  ? Number(section.match(/^([12])학기 /u)?.[1]) || null
  : null;

async function allowedBanks(env, mask, item) {
  const names = Object.keys(BANKS).filter((name) => (mask & BANKS[name]) && (!item || item === name));
  const data = await Promise.all(names.map(async (name) => {
    const questions = await env.TRAINING_PRACTICE.get(name, "json");
    return (questions || []).map((question) => ({ ...question, item: name }));
  }));
  return data.flat();
}

function unitLists(questions) {
  const lists = new Map();
  for (const question of questions) {
    const key = JSON.stringify([question.item, question.section]);
    if (!lists.has(key)) lists.set(key, []);
    lists.get(key).push(question);
  }
  return [...lists.values()];
}

// A filter has a complete cycle so successive rounds can cover every eligible
// item. Interleave courses and semesters, then add one item from each unit.
export function practiceRound(questions, rotation = 0, size = 10) {
  if (!questions.length) return [];
  const rounds = Math.ceil(questions.length / size);
  const cycle = Math.floor(rotation / rounds);
  const start = (rotation % rounds) * size;
  const random = seededRandom(cycle + 1);
  const tracks = [[], [], []];
  for (const unit of unitLists(questions)) {
    const track = semesterOf(unit[0]) || 0;
    tracks[track].push(shuffle(unit, random));
  }
  const units = [];
  for (let i = 0; i < Math.max(...tracks.map((track) => track.length)); i++) {
    for (const track of tracks) if (track[i]) units.push(track[i]);
  }
  const counts = { choice: 0, short: 0, written: 0 };
  const selected = [];
  let drawn;
  do {
    drawn = false;
    for (const unit of units) {
      if (!unit.length) continue;
      const prefer = unit.reduce((best, question, i) => counts[question.type] < counts[unit[best].type] ? i : best, 0);
      const [question] = unit.splice(prefer, 1);
      counts[question.type]++;
      selected.push(question);
      drawn = true;
      if (selected.length >= start + size) return shuffle(selected.slice(start), random);
    }
  } while (drawn);
  return shuffle(selected.slice(start), random);
}

const normalize = (text) => text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const denied = /^\s*(?:(?:은|는|이|가|을|를|에|로|으로|만|도|이라는|라는|라고)\s*)*(?:아니|아님|않|없|부정|필요\s*없|해당\s*없)/u;

function containsConcept(answer, key) {
  const phrase = normalize(key);
  if (!phrase) return false;
  // Search inside each clause and reject an explicit denial immediately after the match.
  return answer.normalize("NFKC").toLowerCase().split(/[.!?;,\n。！？]/u).some((part) => {
    const chars = [...part.matchAll(/[\p{L}\p{N}]/gu)];
    const compact = chars.map((char) => char[0]).join("");
    for (let at = compact.indexOf(phrase); at >= 0; at = compact.indexOf(phrase, at + 1)) {
      const end = chars[at + phrase.length - 1];
      if (end && !denied.test(part.slice(end.index + end[0].length))) return true;
    }
    return false;
  });
}

export function gradeQuestion(question, reply) {
  let correct;
  let modelAnswer;
  let rubric;
  let score;
  if (question.type === "choice") {
    if (!Number.isInteger(reply) || reply < 0 || reply >= question.choices.length) return null;
    correct = question.answer === reply;
    modelAnswer = question.choices[question.answer];
  } else {
    if (typeof reply !== "string" || !reply.trim() || reply.length > 360) return null;
    if (question.type === "short") {
      const answer = normalize(reply).replace(/(?:입니다|이다)$/u, "");
      correct = question.accepted.some((value) => normalize(value).replace(/(?:입니다|이다)$/u, "") === answer);
      modelAnswer = question.accepted[0];
    } else {
      rubric = question.rubric.map(([label, ...aliases]) => ({
        label,
        matched: [label, ...aliases].some((value) => containsConcept(reply, value)),
      }));
      const hits = rubric.filter(({ matched }) => matched).length;
      score = Math.floor(hits * 100 / rubric.length);
      correct = hits * 5 >= rubric.length * 4;
      modelAnswer = question.modelAnswer;
    }
  }
  return { correct, modelAnswer, feedback: question.feedback, source: question.source, rubric, score };
}

export async function trainingPractice(action, env, json, body, mask) {
  const { item, section, semester, type, rotation, id, reply } = body;
  if (item !== undefined && (typeof item !== "string" || !Object.hasOwn(BANKS, item) || !(BANKS[item] & mask))) {
    return json({ error: "이 자료의 연습 권한이 없어요." }, 403);
  }
  if (action === "grade" && (!item || typeof id !== "string" || id.length > 32)) {
    return json({ error: "문항을 확인해 주세요." }, 400);
  }
  if (!env.TRAINING_PRACTICE) return json({ error: "문제 자료를 준비하고 있어요." }, 503);
  const questions = await allowedBanks(env, mask, item);

  if (action === "catalog") {
    return json({ total: questions.length, units: unitLists(questions).map((list) => ({
      item: list[0].item,
      semester: semesterOf(list[0]),
      title: list[0].section,
      count: list.length,
    })) });
  }
  if (action === "start") {
    if ((section !== undefined && (!item || typeof section !== "string" || section.length > 160))
      || (semester !== undefined && (item !== "discipleship" || ![1, 2].includes(semester)))
      || (type !== undefined && !TYPES.has(type))) return json({ error: "연습 범위를 확인해 주세요." }, 400);
    const eligible = questions.filter((question) => (!section || section === question.section)
      && (!semester || semesterOf(question) === semester) && (!type || type === question.type));
    const offset = Number.isInteger(rotation) && rotation >= 0 && rotation < 10000 ? rotation : 0;
    const selected = practiceRound(eligible, offset, 10).map(({ id, item, section, type, prompt, choices }) => ({
      id, item, section, type, prompt, choices,
    }));
    return json({ questions: selected });
  }
  const question = questions.find((question) => question.id === id);
  if (!question) return json({ error: "문항을 찾을 수 없어요." }, 404);
  const result = gradeQuestion(question, reply);
  if (!result) return json({ error: "답을 확인해 주세요." }, 400);
  return json(result);
}
