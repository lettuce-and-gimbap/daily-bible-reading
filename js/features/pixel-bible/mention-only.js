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
  'num.10': ['르우엘'],
  'num.12': ['구스 여인'],
  'deu.9': ['아론'],
  // Joshua recounts Moses' completed conquest and oath; he is not present in
  // either the summary of the campaigns or Caleb's later land request.
  'jos.12': ['모세'],
  'jos.14': ['모세'],
  // Gideon is recounted as deceased in Judges 8–9. Abimelech's father in
  // chapter 8, Naomi's dead family in Ruth 1–2, and Ruth 4's genealogy are
  // not present-day actors in those scenes.
  'jdg.8': ['아비멜렉'],
  'jdg.9': ['기드온'],
  'rut.1': ['엘리멜렉', '말론', '기룐'],
  'rut.2': ['엘리멜렉'],
  'rut.4': ['베레스', '이새', '다윗'],
  // Samuel's history survey names earlier leaders, and chapter 7 only says
  // the Amorites lived peacefully with Israel. They are not in those scenes.
  '1sa.7': ['아모리 사람들'],
  // Chapter 14's closing family register is not an extension of the battle
  // scene; chapter 21 recalls Goliath's sword and Saul while David is away.
  '1sa.14': ['기스', '아히노암', '메랍', '미갈'],
  '1sa.21': ['골리앗', '사울', '다윗의 소년들'],
  // Dagon is an idol statue rather than a human actor; its scene prop remains
  // an object, and the priests are a narrated custom rather than named actors.
  '1sa.5': ['다곤', '다곤의 제사장들'],
  '1sa.12': ['모세', '아론', '시스라', '여룹바알', '베단', '입다', '나하스'],
  // Samuel is reported dead; the later marriage-status note does not put
  // Ahinoam, Michal, or Paltiel in Abigail and David's meeting.
  '1sa.25': ['사무엘', '아히노암', '미갈', '발디'],
  '1sa.27': ['사울'],
  '1sa.29': ['사울'],
  // David's recalled history, family registers, and past deaths in 2 Samuel
  // remain linked in the relation graph but are not extra scene characters.
  '2sa.1': ['사울', '요나단'],
  '2sa.3': ['암논', '압살롬', '아도니야'],
  '2sa.4': ['므비보셋', '요나단', '유모', '림몬', '사울', '아브넬'],
  '2sa.5': ['솔로몬', '다윗의 아들들'],
  '2sa.6': ['사울', '아비나답'],
  '2sa.7': ['사울', '다윗의 후손'],
  '2sa.8': ['아비아달', '아히둡', '아힐룻'],
  '2sa.9': ['사울', '요나단'],
  '2sa.10': ['나하스'],
  '2sa.11': ['엘리암'],
  '2sa.12': ['우리아', '비유 속 부자', '비유 속 가난한 사람'],
  '2sa.13': ['시므아', '달매'],
  '2sa.14': ['압살롬의 딸', '비유 속 두 아들', '여인의 친족들'],
  '2sa.16': ['게라'],
  '2sa.19': ['압살롬'],
  '2sa.20': ['압살롬', '다윗의 후궁 열 명'],
  '2sa.22': ['사울', '다윗의 후손'],
  // First Chronicles contains further family registers and past-history
  // notices; only the embedded active episodes keep their scene participants.
  '1ch.4': ['유다', '갈렙(여분네의 아들)'],
  '1ch.5': ['르우벤', '요셉', '유다'],
  '1ch.6': ['레위', '아론', '사독', '여호사닥'],
  '1ch.7': ['여호수아'],
  '1ch.8': ['*'],
  '1ch.9': ['사울', '요나단', '므립바알', '다윗', '사무엘'],
  '1ch.10': ['다윗'],
  '1ch.17': ['다윗의 아들'],
  '1ch.19': ['나하스'],
  '1ch.23': ['아론', '모세'],
  '1ch.24': ['엘르아살', '이다말'],
  '1ch.29': ['사무엘·나단·갓'],
  // Chronicles' historical prologues and succession lists retain their
  // genealogy edges, but do not populate the event's visible cast.
  '2ch.1': ['다윗'],
  '2ch.3': ['다윗', '오르난'],
  '2ch.6': ['다윗', '이방인'],
  '2ch.10': ['아히야'],
  '2ch.11': ['마아가', '마할랏'],
  '2ch.13': ['미가야(우리엘의 딸)'],
  '2ch.21': ['아합의 딸'],
  '2ch.26': ['이사야'],
  '2ch.27': ['웃시야'],
  '2ch.29': ['다윗'],
  '2ch.36': ['예레미야', '요시야'],
  'ezr.3': ['이웃 민족'],
  'ezr.9': ['백성과 제사장'],
  // In Ezra 6 the kings are cited as sources of earlier decrees, not as
  // participants at the dedication and Passover in Jerusalem.
  'ezr.6': ['고레스'],
  'neh.1': ['모세'],
  'neh.5': ['이전 총독들'],
  'neh.7': ['스룹바벨'],
  'neh.9': ['아브라함', '모세', '조상들', '선지자들'],
  'neh.11': ['아삽'],
  'neh.12': ['예수아', '스룹바벨'],
  'neh.13': ['산발랏'],
  // Haman is already dead by chapter 9; his ten sons are killed in the scene,
  // but he is identified only as their father and the Jews' former enemy.
  'est.9': ['하만'],
  // Job's friends refer to people in past events, hypotheticals, and poetic
  // examples. Keep their relationship evidence without placing them in the
  // present scene. The spirit is recounted from Eliphaz's remembered vision;
  // Elihu's father and the proposed mediator are also not scene participants.
  'job.4': ['영'],
  'job.8': ['욥의 자녀들'],
  'job.19': ['욥의 아내', '형제와 친척', '대속자'],
  'job.21': ['악인'],
  'job.24': ['악인', '가난한 자들'],
  'job.27': ['악인'],
  'job.29': ['가난한 자와 고아', '성문의 사람들'],
  'job.30': ['조롱하는 젊은이들'],
  'job.31': ['종들', '가난한 자와 과부'],
  'job.32': ['바라겔'],
  'job.33': ['중보자'],
  'job.34': ['지혜 있는 자들'],
  'job.35': ['압제받는 사람들'],
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
