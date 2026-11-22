import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('잠언 11장 창작 도해와 참고 자료가 주석에 연결된다',()=>{
 const code=fs.readFileSync('js/features/summary.js','utf8');
 const start=code.indexOf('function chapterStudyFigure('),end=code.indexOf('\nfunction wisdomPlaceHtml(',start);
 assert(start>=0&&end>start);
 const context={esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),wisdomSourceLink:s=>`<a href="${s.url}">${s.label}</a>`};
 vm.createContext(context);vm.runInContext(code.slice(start,end),context);
 const data=JSON.parse(fs.readFileSync('data/summary/pro-study.json','utf8'));
 const html=context.chapterStudyFigure('pro',data['11'].figures[0]);
 assert.match(html,/img\/pro-study\/honest-scales\.svg/);
 assert.match(html,/metmuseum\.org\/art\/collection\/search\/327369/);
 assert(fs.existsSync('img/pro-study/honest-scales.svg'));
 assert.equal(context.chapterStudyFigure('pro',{id:'../bad',label:'bad'}),'');
});
