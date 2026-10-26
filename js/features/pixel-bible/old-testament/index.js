import {PENTATEUCH_DIALOGUE_ROWS} from './law.js';
import {HISTORY_DIALOGUE_ROWS} from './history.js';
import {POETRY_DIALOGUE_ROWS} from './poetry.js';
import {MAJOR_PROPHETS_DIALOGUE_ROWS} from './major-prophets.js';
import {MINOR_PROPHETS_DIALOGUE_ROWS} from './minor-prophets.js';

const orderedRows=[
  ...PENTATEUCH_DIALOGUE_ROWS,
  ...HISTORY_DIALOGUE_ROWS,
  ...POETRY_DIALOGUE_ROWS,
  ...MAJOR_PROPHETS_DIALOGUE_ROWS,
  ...MINOR_PROPHETS_DIALOGUE_ROWS,
].sort((a,b)=>a[6]-b[6]);

// 기존 소비자는 6개 항목의 행 형식을 유지한다.
export const OLD_TESTAMENT_DIALOGUE_ROWS=orderedRows.map(([code,chapter,name,verses,lines,emotion,_order,lineRefs,lineContexts])=>[
  code,chapter,name,verses,lines,emotion,lineRefs||null,lineContexts||null,
]);

export const OLD_TESTAMENT_CODES=new Set([
  'gen','exo','lev','num','deu','jos','jdg','rut','1sa','2sa','1ki','2ki',
  '1ch','2ch','ezr','neh','est','job','psa','pro','ecc','sng','isa','jer',
  'lam','ezk','dan','hos','jol','amo','oba','jnh','mic','nam','hab','zep',
  'hag','zec','mal',
]);

const BOOK_NAMES={
  gen:'창세기',exo:'출애굽기',lev:'레위기',num:'민수기',deu:'신명기',
  jos:'여호수아',jdg:'사사기',rut:'룻기','1sa':'사무엘상','2sa':'사무엘하',
  '1ki':'열왕기상','2ki':'열왕기하','1ch':'역대상','2ch':'역대하',
  ezr:'에스라',neh:'느헤미야',est:'에스더',job:'욥기',psa:'시편',pro:'잠언',
  ecc:'전도서',sng:'아가',isa:'이사야',jer:'예레미야',lam:'예레미야애가',
  ezk:'에스겔',dan:'다니엘',hos:'호세아',jol:'요엘',amo:'아모스',oba:'오바댜',
  jnh:'요나',mic:'미가',nam:'나훔',hab:'하박국',zep:'스바냐',hag:'학개',
  zec:'스가랴',mal:'말라기',
};

export function oldTestamentMonologues(person,occurrences){
  const out=[];
  for(const [code,chapter,name,verses,lines,emotion,lineRefs,lineContexts] of OLD_TESTAMENT_DIALOGUE_ROWS){
    if(person.name!==name||!occurrences.some(item=>item.code===code&&item.chap===chapter))continue;
    for(const [i,text] of lines.entries())out.push({text,ref:`${BOOK_NAMES[code]} ${chapter}:${lineRefs?.[i]||verses}`,detailText:lineContexts?.[i]||'',emotion,origin:'authored'});
  }
  return out;
}
