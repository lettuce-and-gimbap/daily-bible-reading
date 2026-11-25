// 기존에 공개된 장별 해설 중 명시적으로 절을 지목한 문단만 해당 절에 연결한다.
const fs = require('fs');
const bible = require('../../js/core/bible.js');
const counts = JSON.parse(fs.readFileSync('js/core/versecounts.js', 'utf8').match(/const VERSE_COUNTS\s*=\s*(\[[^\]]+\])/)[1]);
const figures = require('../../data/summary/real-figures.json');
const ranges = {
  '1sa': {5:[1,2],6:[12,15],17:[1,3],22:[1,2],26:[7,12],28:[7,8],31:[1,2]},
  '2sa': {2:[12,13],5:[6,9],21:[1,2]},
  '1ki': {1:[38,40],3:[4,5],5:[6,10],7:[27,37],9:[15,17],12:[28,30],14:[25,26],15:[12,15],16:[23,24]},
  '2ki': {2:[6,8],3:[4,5],5:[10,14],9:[1,3],10:[29,31],18:[13,17],19:[35,37],20:[20,20],23:[8,8]}
};
const outputDir = process.argv[2] || 'data/verse-study';
fs.mkdirSync(outputDir, {recursive:true});
// 절별 감수 결과를 장별 원본으로 덮어쓰지 않는다. 비교는 빈 출력 폴더에 만든다.
for (const code of Object.keys(ranges)) {
  if (fs.existsSync(require('path').join(outputDir,`${code}-existing.json`))) {
    throw new Error('기존 절별 주석을 덮어쓸 수 없습니다. 빈 출력 폴더를 지정하세요.');
  }
}
for (const code of Object.keys(ranges)) {
  const chapters = JSON.parse(fs.readFileSync(`data/summary/${code}-study.json`));
  const book = bible.BOOKS.find(x => x.code === code), passages = [];
  for (const [chapterKey, chapter] of Object.entries(chapters)) {
    const chap = Number(chapterKey), max = counts[bible.chapterIndex(code, chap)];
    for (const [i, text] of (chapter.paragraphs || []).entries()) {
      if (text.length < 45) continue;
      const pattern = new RegExp(`(?<![0-9])${chap}\\s*:\\s*(\\d{1,3}(?:[–—-]\\d{1,3})?(?:\\s*,\\s*\\d{1,3}(?:[–—-]\\d{1,3})?(?!\\d|\\s*:))*)`, 'g');
      const seen = new Set();
      for (const m of text.matchAll(pattern)) {
        // 다른 성경 권의 같은 장 번호를 현재 권의 절로 오인하지 않는다.
        const before = text.slice(Math.max(0,m.index-16),m.index);
        if (/(?:삼상|삼하|왕상|왕하|대상|대하|창|출|레|민|신|시|마|막|눅|요|행|롬)\s*$/.test(before)) continue;
        if (bible.BOOKS.some(b => b.code !== code && before.trimEnd().endsWith(b.name))) continue;
        for (const part of m[1].split(/\s*,\s*/)) {
        const [lo, hi = lo] = part.split(/[–—-]/).map(Number), key = `${lo}-${hi}`;
        if (lo < 1 || hi < lo || hi > max || seen.has(key)) continue;
        seen.add(key);
        const sourceLinks = (chapter.sources || []).filter(x => {
          if (!x.url || !/^https:\/\//.test(x.url)) return false;
          return /(?:bskorea\.or\.kr|sbl-site\.org|bhs\.ibibles\.net|mechon-mamre\.org)$/.test(new URL(x.url).hostname);
        }).map(x => ({label:x.label,url:x.url}));
        passages.push({id:`old-study-${code}-${chap}-${i}-${lo}-${hi}`,code,chapter:chap,lo,hi,
          title:/[\u0590-\u05ff]/.test(text)?'원어와 본문 맥락':'본문의 맥락',category:'구절 해설',
          summary:'이 구절과 연결된 기존 심화 해설이에요.',detail:text,
          refs:[`${book.name} ${chap}:${lo}${hi===lo?'':'-'+hi}`],sourceLinks,
          sourceNote:'기존 장별 AI 작성 해설에 표시된 절을 본문 주석에 연결했어요. 원문과 문맥을 확인하며 읽어 주세요. 전체 신학 감수가 완료된 자료는 아니에요.',images:[]});
        }
      }
    }
  }
  for (const [chapterKey, [lo,hi]] of Object.entries(ranges[code])) {
    const chap = Number(chapterKey);
    for (const [i, figure] of (figures[code]?.[chap] || []).entries()) {
      passages.push({id:`real-photo-${code}-${chap}-${i}`,code,chapter:chap,lo,hi,title:'관련 장소·유물 사진',category:'실물 참고 자료',
        summary:figure.alt,detail:figure.label.replace(/\bJPEG\b/g,'').replace(/파일\s+\d+\s+bytes,?/gi,'').replace(/\s+/g,' ').trim(),refs:[`${book.name} ${chap}:${lo}${hi===lo?'':'-'+hi}`],
        sourceLinks:[...(figure.licenseUrl?[{label:'사진 이용 조건',url:figure.licenseUrl}]:[]),...(figure.references||[])],
        sourceNote:'아래 원본 자료와 이용 조건을 확인해 주세요. 사진이 본문 사건의 직접 자료인지 비교 자료인지는 설명에서 구분해요.',
        images:[{url:figure.src,caption:figure.alt,credit:'자세한 출처와 이용 조건은 위 설명을 확인해 주세요.',pageUrl:figure.sourceUrl}]});
    }
  }
  fs.writeFileSync(require('path').join(outputDir,`${code}-existing.json`),JSON.stringify({passages},null,2)+'\n');
  console.log(code, passages.length, '항목,',new Set(passages.map(x=>x.chapter)).size,'장,',passages.filter(x=>x.images.length).length,'사진');
}
