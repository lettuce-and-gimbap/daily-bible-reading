// Historical or hypothetical figures named in a chapter are context, not people
// physically present in that chapter's Pixel World. Keep this list explicit:
// words such as "조상" also describe characters who are present in genealogies
// or active narratives, so a broad role-text filter would remove real actors.
const CHAPTERS = {
  // These chapters are exclusively ancestral name lists. Their records remain
  // searchable in the Bible text, but they do not place generations together.
  '1ch.1': ['*'],
  '1ch.2': ['*'],
  '1ch.3': ['*'],
  'gen.5': ['*'],
  'gen.10': ['*'],
  'gen.36': ['*'],
  // These are only referenced in the chapter's relationship note: the text
  // explicitly places Eliezer in Abraham's concern and Lot in Sodom, not in
  // the visitors' meeting at Mamre.
  'gen.15': ['엘리에셀'],
  'gen.18': ['롯'],
  'gen.33': ['하몰'],
  'gen.11': ['나홀', '하란'],
  'gen.22': ['나홀'],
  '1ch.6': ['레위', '아론'],
  '1ch.9': ['사울', '요나단', '므립바알'],
  '1ch.24': ['엘르아살', '이다말'],
  '1co.10': ['우리 조상들', '모세'],
  '1pe.1': ['선지자들'],
  '1sa.12': ['모세'],
  '2ki.21': ['선지자들'],
  '2sa.7': ['다윗의 후손'],
  '2sa.22': ['다윗의 후손'],
  '2ti.2': ['다윗'],
  '2co.3': ['모세'],
  'act.3': ['아브라함', '모세'],
  'act.7': ['아브라함', '요셉', '모세', '솔로몬'],
  'act.13': ['다윗'],
  'exo.13': ['요셉'],
  'exo.3': ['이드로', '바로'],
  'exo.4': ['바로'],
  // This chapter's genealogy identifies the living leaders but does not bring
  // their ancestors or descendants into the scene.
  'exo.6': ['아므람', '요게벳', '엘르아살', '비느하스', '고라'],
  'lev.24': ['슬로밋'],
  'ezk.20': ['조상들'],
  'gal.3': ['아브라함'],
  'heb.1': ['선지자들', '조상들'],
  'heb.3': ['모세', '광야의 조상들'],
  'heb.4': ['광야의 조상들', '여호수아', '다윗'],
  'heb.7': ['아브라함', '레위'],
  'heb.8': ['모세', '조상들'],
  'isa.51': ['아브라함'],
  'jas.2': ['아브라함'],
  'jer.11': ['조상들'],
  'jer.15': ['모세와 사무엘', '므낫세'],
  'jer.35': ['요나답'],
  'jhn.4': ['야곱'],
  'jhn.8': ['아브라함'],
  'jos.24': ['요셉'],
  'luk.16': ['아브라함'],
  'neh.9': ['아브라함', '조상들', '선지자들'],
  'psa.22': ['조상들'],
  'psa.44': ['조상들'],
  'psa.47': ['아브라함'],
  'psa.77': ['모세', '아론'],
  'psa.78': ['조상들', '모세', '다윗'],
  'psa.95': ['광야의 조상들'],
  'psa.99': ['모세', '아론', '사무엘'],
  'psa.105': ['아브라함', '이삭', '야곱', '요셉', '모세', '아론', '바로'],
  'psa.106': ['조상들', '모세', '아론', '다단과 아비람', '비느하스'],
  'rom.1': ['다윗'],
  'rom.4': ['아브라함', '다윗', '사라'],
  'rom.9': ['아브라함', '이삭', '리브가', '야곱', '에서', '모세', '바로'],
  'rom.15': ['이새'],
  'rev.22': ['다윗'],
  'zec.1': ['조상들'],
  'zec.7': ['조상들'],
};

export function isMentionOnlyPerson(person, { code = '', chapter = '' } = {}) {
  if (/본문에 이름이 언급/.test(person?.role || '')) return true;
  const reviewed = CHAPTERS[`${code}.${chapter}`] || [];
  return reviewed.includes('*') || reviewed.includes(person?.name);
}

export function withoutMentionOnlyActors(scene, mentionOnlyNames = []) {
  if (!scene?.actors?.length) return scene;
  const mentioned = new Set(mentionOnlyNames);
  const actors = scene.actors.filter(name => !mentioned.has(name) && !isMentionOnlyPerson({ name }, scene));
  if (actors.length === scene.actors.length) return scene;
  return {
    ...scene,
    actors,
    actions: Object.fromEntries(Object.entries(scene.actions || {}).filter(([name]) => actors.includes(name))),
    actorLines: Object.fromEntries(Object.entries(scene.actorLines || {}).filter(([name]) => actors.includes(name))),
    passiveMotions: Object.fromEntries(Object.entries(scene.passiveMotions || {}).filter(([name]) => actors.includes(name))),
  };
}

export const mentionOnlyChapterNames = CHAPTERS;
