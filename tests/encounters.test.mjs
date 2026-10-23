import test from 'node:test';
import assert from 'node:assert/strict';
import {EncounterDirector,beside} from '../js/features/pixel-bible/encounters.js';
import {buildChapterDialogue} from '../js/features/pixel-bible/chapter-dialogue.js';
import {SpeechDirector} from '../js/features/pixel-bible/dialogue.js';
import {hangingPose} from '../js/features/pixel-bible/motion.js';
import {relationshipLines} from '../js/features/pixel-bible/relationship-lines.js';

function fixture(){
 const chapters=[{code:'1ki',name:'열왕기상',chap:21,data:{people:[{name:'아합',role:'포도원을 원한 왕'},{name:'나봇',role:'유산을 지킨 포도원 주인'}],rels:[{from:'아합',to:'나봇',label:'포도원 요구',verses:'1-4',note:'아합이 포도원을 원했지만 나봇은 조상의 유산을 넘기지 않았어요.'}]}}];
 const context=buildChapterDialogue(chapters);
 const npcs=context.people.map((p,i)=>({...p,refs:[p.ref],x:10+i,y:10,path:[{x:15,y:10}],task:{},action:'tree',usingObject:{}}));
 return {npcs,director:new EncounterDirector(chapters,context,{random:()=>0})};
}

test('옆 칸 조우 즉시 서로 마주보고 각자 사건에 맞는 대사를 한다',()=>{
 const {director,npcs}=fixture();
 const first=director.tick(0,npcs);assert.equal(first.length,1);
 assert.equal(first[0].speaker.name,'아합');assert.match(first[0].text,/포도원/);
 assert.equal(npcs[0].direction,'right');assert.equal(npcs[1].direction,'left');
 assert.ok(npcs.every(n=>!n.path.length&&!n.task&&!n.usingObject&&n.encounter));
 const reply=director.tick(800,npcs);assert.equal(reply.length,2);
 assert.equal(reply[1].speaker.name,'나봇');assert.match(reply[1].text,/유산|조상/);
 assert.ok(reply.every(l=>l.until-l.started===5000));
 assert.equal(director.tick(5000,npcs).length,1);
 assert.equal(director.tick(5800,npcs).length,0);
 assert.ok(npcs.every(n=>!n.encounter));
 assert.equal(director.tick(5900,npcs).length,0,'같은 자리에서는 반복하지 않음');
 npcs[1].x=20;director.tick(5901,npcs);npcs[1].x=11;
 assert.equal(director.tick(5902,npcs).length,1,'떠났다가 다시 만나면 시작');
});

test('상하 조우·드래그 배제·다시 놓기와 인물 숨기기를 처리한다',()=>{
 const {director,npcs}=fixture();npcs[1].x=10;npcs[1].y=11;
 assert.equal(director.tick(0,npcs,{excluded:[npcs[1]]}).length,0);
 assert.equal(director.tick(1,npcs).length,1);
 assert.equal(npcs[0].direction,'down');assert.equal(npcs[1].direction,'up');
 director.tick(2,[npcs[0]]);assert.ok(npcs.every(n=>!n.encounter));
 assert.equal(beside({x:0,y:0},{x:1,y:1}),false);
 assert.equal(beside({x:0,y:0},{x:0,y:0}),false);
});

test('모든 관계 대사는 짧게 말하고 관계 설명은 자세히 보기용으로 남긴다',()=>{
 const a={name:'하눈',identity:{id:'neh3-hanun'}},b={name:'살룬',identity:{id:'neh3-shallun'}};
 const relation={label:'함께 재건',from:{code:'neh',chap:3},to:{code:'neh',chap:3},text:'하눈은 골짜기 문을 세웠고 살룬은 샘문을 수리했습니다.',ref:'느헤미야 3:13-15'};
 const lines=relationshipLines(a,b,relation,new Map(),{random:()=>0});
 assert.equal(lines.length,2);
 for(const line of lines){
  assert.ok(line.text.length<=64);assert.doesNotMatch(line.text,/이 일의 말씀을 함께 살펴보자/);
  assert.equal(line.detailText,`${relation.text} (${relation.ref})`);
  assert.equal(line.ref,relation.ref);
  assert.ok(!line.text.includes(relation.text));
 }
});

test('관계 없는 근접 인물은 대화하지 않고 랜덤 말풍선은 독립적으로 유지한다',()=>{
 const {director,npcs}=fixture(),ambient=new SpeechDirector();
 const current=ambient.interrupt({id:'ambient',text:'랜덤 대사',speaker:{}},0);
 director.tick(0,npcs);assert.equal(ambient.current,current);
 director.clear();director.context={people:[],relations:[]};
 assert.equal(director.tick(1,npcs).length,0);
});

test('매달림은 정면 고정·여섯 도트 자세·인물별 팔다리 움직임을 갖는다',()=>{
 const base={key:'lively',frequency:6,phase:0,swing:.17};
 const poses=Array.from({length:6},(_,i)=>hangingPose(base,i/6));
 assert.ok(poses.every(p=>p.direction==='down'&&p.pose.bodyX===0&&p.pose.bodyY===0));
 assert.equal(new Set(poses.map(p=>JSON.stringify(p.pose))).size,6);
 const limp=poses.map((_,i)=>hangingPose({...base,limp:true},i/6));
 assert.ok(limp.every(p=>p.pose.leftLeg===1&&p.pose.rightLeg===0));
 assert.equal(hangingPose(base,3,0,true).angle,0);
 assert.notDeepEqual(hangingPose({...base,key:'steady'},0).pose,poses[0].pose);
});
