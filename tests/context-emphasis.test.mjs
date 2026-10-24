import test from 'node:test';
import assert from 'node:assert/strict';
import {contextTerms,emphasizedContext} from '../js/features/pixel-bible/context-emphasis.js';
import {roleMonologues} from '../js/features/pixel-bible/role-monologues.js';
test('설명의 핵심어만 강조하고 HTML은 안전한 텍스트로 남긴다',()=>{
 const terms=contextTerms({text:'조상의 유산인 포도원을 넘길 수 없어.'});
 const html=emphasizedContext('<script>포도원</script>은 조상의 유산이에요.',terms);
 assert.match(html,/<mark><strong>포도원<\/strong><\/mark>/);
 assert.ok(!html.includes('<script>'));assert.match(html,/&lt;script&gt;/);
 assert.equal(emphasizedContext('풀이가 없어요.',[]),'풀이가 없어요.');
});
test('이름 또는 가족관계만으로 추상적인 공통 속마음을 만들지 않는다',()=>{
 assert.deepEqual(roleMonologues({name:'인물',refs:[]},[],null),[]);
 assert.deepEqual(roleMonologues({name:'인물',role:'누군가의 아들',refs:[]},[],null),[]);
 const lines=roleMonologues({name:'일꾼'},[{role:'이삭 줍는 일꾼'}],null);
 assert.ok(lines.every(l=>/이삭|물|한 줌/.test(l.text)));
});
