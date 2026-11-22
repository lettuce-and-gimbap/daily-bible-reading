import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('관계도 원문은 절 접미사와 범위를 읽고 표제는 절 번호로 취급하지 않는다', async () => {
 const chosen=[];
 const context={document:{addEventListener(){}},CHAPTERS:[{book:{code:'psa'},chap:13}],PUSH_SERVER:'https://example.test',
  versePairs:async (_idx,filter)=>{for(let i=1;i<=8;i++)if(filter(i))chosen.push(i);return [{n:1}];},
  versePairsHtml:()=>'<p>본문</p>'};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync('js/features/summary-relationship-graph.js','utf8'),context);
 const box={hidden:true,dataset:{},innerHTML:''},label={textContent:''};
 const btn={parentElement:{querySelector:()=>box},getAttribute:()=>null,setAttribute(){},querySelector:()=>label};
 await context.rgShowOrig(btn,{book:'psa',chap:13,verses:'1-2, 4-5절'});
 assert.deepEqual(chosen,[1,2,4,5]);assert.match(box.innerHTML,/본문/);
 box.dataset={};chosen.length=0;
 await context.rgShowOrig(btn,{book:'psa',chap:13,verses:'표제절, 3절'});
 assert.deepEqual(chosen,[3]);
 box.dataset={};chosen.length=0;
 await context.rgShowOrig(btn,{book:'psa',chap:13,verses:'표제절'});
 assert.deepEqual(chosen,[]);assert.match(box.innerHTML,/표제/);
});
