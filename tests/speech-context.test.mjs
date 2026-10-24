import test from 'node:test';
import assert from 'node:assert/strict';
import {speechContext} from '../js/features/pixel-bible/speech-context.js';
const chapters=[{code:'1ki',chap:22,data:{story:'장 전체의 긴 요약이에요.',events:[{verses:'5-8',text:'여호사밧은 먼저 하나님의 뜻을 묻자고 해요. 왕이 원하는 말과 하나님의 뜻 사이에 갈등이 있어요.'},{verses:'29-40',text:'뒤에 벌어지는 전쟁 이야기예요.'}]}}];
test('대사 설명에는 해당 절의 상황만 간결하게 담고 장 전체 요약은 버린다',()=>{
 const explanation=speechContext({text:'먼저 뜻을 물어봅시다.',ref:'열왕기상 22:5-8',speaker:{name:'여호사밧'},detailText:chapters[0].data.story},chapters);
 assert.match(explanation,/여호사밧/);assert.doesNotMatch(explanation,/장 전체|전쟁/);assert.ok(explanation.length<=240);
});
test('일반 일상 대사와 설명 없는 장 단위 참조에는 설명을 만들어 붙이지 않는다',()=>{
 assert.equal(speechContext({origin:'object-daily',detailText:'무관한 설명',ref:'열왕기상 22:5-8'},chapters),'');
 assert.equal(speechContext({ref:'열왕기상 22장',detailText:chapters[0].data.story},chapters),'');
});
