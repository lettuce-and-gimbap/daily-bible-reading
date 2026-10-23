import test from 'node:test';
import assert from 'node:assert/strict';
import {objectContextSpeech,speechView} from '../js/features/pixel-bible/speech-view.js';
import {OBJECT_MONOLOGUES,objectMonologue} from '../js/features/pixel-bible/object-monologues.js';
import {personalLines} from '../js/features/pixel-bible/personal-lines.js';
import {buildChapterDialogue} from '../js/features/pixel-bible/chapter-dialogue.js';
import {PAIR_DIALOGUE} from '../js/features/pixel-bible/pair-dialogue.js';
import {objectLinesFor} from '../js/features/pixel-bible/object-scenes.js';
import {ELIJAH_SCENES} from '../js/features/pixel-bible/scenes.js';

test('엘리야의 나무 독백은 현재 장의 공포와 탈진을 담고 긴 근거는 상세에 남긴다',()=>{
 const n={name:'엘리야',refs:['열왕기상 19장']},chapters=[{code:'1ki',name:'열왕기상',chap:19}],evidence={text:'광야의 로뎀나무 아래에서 지쳐 눕는 장면의 상세 맥락.',ref:'열왕기상 19:3–8'};
 const line=speechView(objectContextSpeech('나무',evidence,{speaker:n,kind:'tree',chapters,random:()=>0}));
 assert.match(line.text,/두려움/);assert.match(line.text,/버틸 힘/);assert.equal(line.emotion,'sad');assert.equal(line.detailText,evidence.text);
 assert.equal(line.ref,'열왕기상 19:3–5');
 const other=objectMonologue(n,'tree',[{code:'1ki',name:'열왕기상',chap:18}],{random:()=>0});assert.equal(other.origin,'object-daily');assert.doesNotMatch(other.text,/도망쳤|버틸 힘/);
 const scene=ELIJAH_SCENES.find(s=>s.id==='rest-elijah');assert.ok(objectLinesFor(scene,'엘리야').some(t=>t.includes('두려움')),'장면 경로도 해설 대신 동일한 인물 목소리를 사용');
});

test('이세벨의 독백·관계·인장 대사에는 나봇 제거와 포도원 강탈의 의도가 함께 있다',()=>{
 const chapters=[{code:'1ki',name:'열왕기상',chap:21,data:{people:[{name:'이세벨',role:'아합의 아내'}]}}],context=buildChapterDialogue(chapters);
 const n={...context.people[0],refs:['열왕기상 21장']};
 for(const line of personalLines(n,chapters,context)){assert.match(line.text,/나봇/);assert.match(line.text,/없애|죽|증인/);}
 const pair=PAIR_DIALOGUE.find(p=>p.speaker==='이세벨'&&p.target==='아합'&&p.chapter==='1ki.21');assert.ok(pair.lines.some(t=>/나봇.*없애/.test(t)));
 const line=objectMonologue(n,'seal',chapters,{random:()=>0});assert.match(line.text,/나봇.*없애/);assert.match(line.text,/포도원/);
});

test('짧은 두 문장은 의도까지 보이고 긴 해설은 첫 문장만 보인다',()=>{
 const full='나봇을 없애야 포도원을 빼앗지. 왕의 도장으로 장로들을 움직이겠어.';
 assert.equal(speechView({text:full}).text,full);
 const long='나는 오늘 이 길을 가야겠어. '+'본문 사건을 자세하게 설명합니다. '.repeat(30);assert.equal(speechView({text:long}).text,'나는 오늘 이 길을 가야겠어.');assert.equal(speechView({text:long}).detailText,long.trim());
 for(const row of OBJECT_MONOLOGUES)for(const text of row[6])assert.ok([...text].length<=64,text);
});
