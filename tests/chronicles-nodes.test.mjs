import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const graph=JSON.parse(fs.readFileSync('data/chronicles-nodes.json','utf8'));
const guide=JSON.parse(fs.readFileSync('data/chronicles-guide.json','utf8'));
const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
test('역대서 노드와 관계는 고유 ID와 두 권 안의 근거를 갖는다',()=>{
 assert.equal(nodes.size,graph.nodes.length);
 const ids=new Set();
 for(const n of graph.nodes){assert(['person','group','divine'].includes(n.type));assert(n.label&&n.refs.length);}
 for(const e of graph.edges){assert(!ids.has(e.id));ids.add(e.id);assert(nodes.has(e.from)&&nodes.has(e.to));assert.notEqual(e.from,e.to);assert(graph.relationshipTypes[e.type]);assert(e.refs.length);}
 for(const ref of [...graph.nodes.flatMap(n=>n.refs),...graph.edges.flatMap(e=>e.refs)]){
  const m=ref.match(/^(역대상|역대하) (\d+):(\d+)(?:-(\d+))?$/);assert(m,ref);assert(Number(m[2])<=(m[1]==='역대상'?29:36),ref);assert(Number(m[3])>0&&Number(m[4]||m[3])>=Number(m[3]),ref);
 }
});
test('왕위 계승과 혈통을 혼동하지 않고 동명이인·서술자를 분리한다',()=>{
 const ruler=id=>graph.nodes.find(n=>n.rulerRef===id).id;
 const parent=(a,b)=>graph.edges.some(e=>e.type==='parent_child'&&e.from===ruler(a)&&e.to===ruler(b));
 assert(!parent('saul','david'));assert(!parent('athaliah','joash-judah'));assert(!parent('jehoahaz','jehoiakim'));
 assert(graph.nodes.filter(n=>n.label==='사울').length>=2);
 assert(graph.nodes.filter(n=>n.label==='나단').length>=2);
 assert(graph.nodes.filter(n=>n.label==='다말').length>=2);
 assert.equal(graph.speakerLinks.length,guide.dialogueInventory.length);
 const dialogueIds=new Set(guide.dialogueInventory.map(s=>s.id));
 for(const s of graph.speakerLinks){assert(dialogueIds.has(s.dialogueId));if(s.voiceType==='narrator')assert.equal(s.nodeId,null);else assert(nodes.has(s.nodeId));}
 for(const r of guide.rulers)assert.equal(graph.nodes.filter(n=>n.rulerRef===r.id).length,1);
});
test('부모 계보는 순환하지 않고 검토 중 관계를 별도로 보관한다',()=>{
 const children=new Map();for(const e of graph.edges.filter(e=>e.type==='parent_child'))children.set(e.from,[...(children.get(e.from)||[]),e.to]);
 const done=new Set(),active=new Set();function visit(id){assert(!active.has(id),id);if(done.has(id))return;active.add(id);for(const c of children.get(id)||[])visit(c);active.delete(id);done.add(id);}for(const id of nodes.keys())visit(id);
 assert(graph.pendingRelations.some(r=>r.id==='review-zedekiah-3-16'));
 assert(graph.pendingRelations.some(r=>r.id==='review-david-repeated-names'));
});
