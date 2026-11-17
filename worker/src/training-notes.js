const MAX_NOTE_BYTES = 12000;
const CONCEPTS = [
  "행위 언약", "은혜 언약", "창조 언약", "새 언약", "순종", "불순종", "언약", "삼위일체", "삼위 하나님",
  "칭의", "성화", "중생", "회개", "견인", "양자 됨", "성령", "믿음", "은혜", "재림", "부활", "화목",
  "청지기", "사랑", "섬김", "기도", "묵상", "전신갑주", "거룩함", "정경", "영감", "공관복음", "대속",
];
const label = (semester, lesson) => `${semester}학기 ${lesson}과`;
const isTerm = (semester, lesson) => [1, 2].includes(semester) && Number.isInteger(lesson) && lesson >= 1 && lesson <= 12;
const questionPrefix = /^(?:[Qq]|질문)\s*[:：]\s*/u;
const answerPrefix = /^(?:[Aa]|답안?)\s*[:：]\s*/u;

// Teacher-authored text stays in the existing Cloudflare environment.
// Every inferred answer is literally present in the saved note.
export async function compileNote(text, semester, lesson, section) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const auto = [];
  const explicit = [];
  const content = [];
  let pending;
  let fenced = false;
  const seen = new Set();
  function add(list, prompt, answer, quote) {
    if (!prompt || !answer || answer.length > 130 || prompt.length > 360 || seen.has(prompt)) return;
    seen.add(prompt);
    list.push({ section, type: "short", prompt, accepted: [answer], feedback: quote,
      source: `관리자 보충 노트 · ${label(semester, lesson)}` });
  }
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("```")) {
      fenced = !fenced;
      content.push(raw);
      continue;
    }
    if (fenced) {
      content.push(raw);
      continue;
    }
    if (questionPrefix.test(line)) {
      pending = line.replace(questionPrefix, "");
      continue;
    }
    if (answerPrefix.test(line)) {
      if (pending) {
        const answer = line.replace(answerPrefix, "");
        add(explicit, pending, answer, `관리자 노트의 답안: ${answer}`);
      }
      pending = null;
      continue;
    }
    content.push(raw);
    if (!line || /^[#>|\x60]/u.test(line)) continue;
    const sentence = line.replace(/^[-*•]\s+/u, "");
    const definition = sentence.match(/^([^:：]{2,24})[:：]\s+(.{8,240})$/u);
    if (definition && !/^https?$/iu.test(definition[1])) {
      const term = definition[1].replace(/\*\*/g, "").trim();
      const explanation = definition[2].replace(/\*\*/g, "").trim();
      add(auto, `다음 설명에 해당하는 용어는 무엇인가요? ${explanation.replaceAll(term, "____")}`, term, sentence);
      continue;
    }
    for (const passage of sentence.split(/(?<=[.!?])\s+/u)) {
      const plain = passage.replace(/\*\*/g, "");
      const marked = passage.match(/\*\*([^*]{2,20})\*\*/u)?.[1];
      const concept = marked || CONCEPTS.find((word) => plain.includes(word));
      if (concept && plain.length >= concept.length + 9 && plain.length <= 210) {
        add(auto, `관리자 노트의 빈칸을 채우세요. ${plain.replaceAll(concept, "____")}`, concept, plain);
      }
    }
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const stamp = [...new Uint8Array(digest).slice(0, 6)].map((n) => n.toString(16).padStart(2, "0")).join("");
  const questions = [...explicit, ...auto].slice(0, 12).map((question, i) => ({
    ...question, id: `n-${semester}-${lesson}-${stamp}-${i + 1}`,
  }));
  return { publishedText: content.join("\n").trim(), questions };
}

export async function notesAdmin(action, request, env, json, body) {
  if (request.method !== "POST") return json({ error: "지원하지 않는 요청이에요." }, 405);
  if (!env.TRAINING_NOTES) return json({ error: "노트 저장소를 준비하고 있어요." }, 503);
  const { semester, lesson, text, revision } = body;
  if (!isTerm(semester, lesson)) return json({ error: "학기와 과를 선택해 주세요." }, 400);
  const db = env.TRAINING_NOTES;
  const existing = await db.prepare("SELECT raw_text, published_text, questions_json, revision FROM lesson_notes WHERE semester = ? AND lesson = ?")
    .bind(semester, lesson).first();
  if (action === "load") {
    return json({ text: existing?.raw_text || "", revision: existing?.revision || 0,
      publishedText: existing?.published_text || "", questions: JSON.parse(existing?.questions_json || "[]") });
  }
  if (!["preview", "save"].includes(action)) return json({ error: "지원하지 않는 요청이에요." }, 404);
  if (typeof text !== "string" || new TextEncoder().encode(text).byteLength > MAX_NOTE_BYTES || /[\u0000]/u.test(text)) {
    return json({ error: "노트는 UTF-8 텍스트 12 KB 이내로 입력해 주세요." }, 400);
  }
  const bank = await env.TRAINING_PRACTICE.get("discipleship", "json");
  const section = bank?.find((q) => q.section.startsWith(label(semester, lesson) + " "))?.section;
  if (!section) return json({ error: "해당 과의 문제 범위를 찾을 수 없어요." }, 404);
  const draft = await compileNote(text, semester, lesson, section);
  if (action === "preview") return json(draft);
  if (!Number.isInteger(revision) || revision !== (existing?.revision || 0)) {
    return json({ error: "다른 화면에서 노트가 변경됐어요. 복사해 둔 뒤 다시 불러와 주세요." }, 409);
  }
  const result = await db.prepare(`
    INSERT INTO lesson_notes (semester, lesson, raw_text, published_text, questions_json, revision)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(semester, lesson) DO UPDATE SET raw_text=excluded.raw_text,
      published_text=excluded.published_text, questions_json=excluded.questions_json, revision=excluded.revision
    WHERE lesson_notes.revision = ?
  `).bind(semester, lesson, text, draft.publishedText, JSON.stringify(draft.questions), revision + 1, revision).run();
  if (!result.meta?.changes) return json({ error: "노트가 변경됐어요. 다시 불러와 주세요." }, 409);
  return json({ ...draft, revision: revision + 1 });
}

export async function quizQuestionsFromNotes(env) {
  if (!env.TRAINING_NOTES) return [];
  const { results } = await env.TRAINING_NOTES.prepare("SELECT questions_json FROM lesson_notes WHERE questions_json != '[]' ORDER BY semester, lesson").all();
  return results.flatMap(({ questions_json }) => JSON.parse(questions_json));
}

export async function publishedLessonNote(env, semester, lesson) {
  if (!env.TRAINING_NOTES || !isTerm(semester, lesson)) return "";
  const row = await env.TRAINING_NOTES.prepare("SELECT published_text FROM lesson_notes WHERE semester = ? AND lesson = ?")
    .bind(semester, lesson).first();
  return row?.published_text || "";
}
