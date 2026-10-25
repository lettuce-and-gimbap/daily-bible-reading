import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('요약 관계도 모듈은 PDF와 요약 화면보다 먼저 같은 전역 스크립트 환경에 로드된다',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const scripts=['summary-relationship-graph.js','graph-pdf.js','summary.js'];
 const positions=scripts.map(file=>html.indexOf(`js/features/${file}`));
 assert.ok(positions.every(position=>position>=0));
 assert.deepEqual([...positions],[...positions].sort((a,b)=>a-b));

 const context=vm.createContext({
  document:{addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}},
  setTimeout,clearTimeout,Map,Set,WeakMap,Math,JSON,Promise,URL,console,
 });
 for(const file of scripts){
  const source=fs.readFileSync(new URL(`../js/features/${file}`,import.meta.url),'utf8');
  assert.doesNotThrow(()=>vm.runInContext(source,context,{filename:file}),file);
 }
 assert.equal(vm.runInContext('typeof relationGraphHtml',context),'function');
 assert.equal(vm.runInContext('typeof renderSummaryTab',context),'function');
 assert.equal(vm.runInContext('typeof rgModels',context),'object');
});
