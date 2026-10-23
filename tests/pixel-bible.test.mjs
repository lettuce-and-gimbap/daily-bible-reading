import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorldModel, findPath } from '../js/features/pixel-bible/world.js';

test('인물을 함께 모아도 본문 출처를 보존하고 하나님은 인간 NPC로 만들지 않는다', () => {
  const base = { name: '창세기', code: 'gen' };
  const model = buildWorldModel([
    { ...base, chap: 1, data: { people: [{ name: '하나님', weight: 3 }, { name: '아담', weight: 1 }] } },
    { ...base, chap: 2, data: { people: [{ name: '아담', weight: 3 }], rels: [{ from: '하나님', to: '아담', verses: '7', label: '지으심' }] } },
  ]);
  assert.equal(model.cast.length, 1);
  assert.deepEqual(model.cast[0].refs, ['창세기 1장', '창세기 2장']);
  assert.equal(model.relations[0].ref, '창세기 2:7');
  assert.equal(model.scenes.length, 0);
});

test('본문에 없는 룻기 사건을 다른 장의 사건으로 재생하지 않는다', () => {
  const chapter = { name: '룻기', code: 'rut', data: { people: [{ name: '룻' }, { name: '보아스' }] } };
  assert.equal(buildWorldModel([{ ...chapter, chap: 1 }]).scenes.length, 0);
  const model = buildWorldModel([{ ...chapter, chap: 2 }]);
  assert.equal(model.scenes.length, 3);
  assert.ok(model.cast.some((p) => p.name === '일꾼'));
});

test('배치된 오브제를 우회하고 갈 수 없는 목적지는 거절한다', () => {
  const bounds = (x, y) => x < 0 || x > 4 || y < 0 || y > 4;
  const blocked = (x, y) => bounds(x, y) || (x === 2 && y < 4);
  const path = findPath({ x: 0, y: 0 }, { x: 4, y: 0 }, blocked);
  assert.ok(path.some((p) => p.y === 4));
  assert.deepEqual(path.at(-1), { x: 4, y: 0 });
  assert.ok(path.every((p) => !blocked(p.x, p.y)));
  assert.equal(findPath({ x: 0, y: 0 }, { x: 4, y: 0 }, (x, y) => bounds(x, y) || x === 2), null);
});

test('가로 화면 비율을 늘려도 월드는 균일 배율로 빈 여백 없이 채운다', async () => {
  const {worldViewport}=await import('../js/features/pixel-bible/world.js');
  for(const [w,h] of [[1280,591],[844,390],[1100,700]]) {
    const v=worldViewport(w,h);
    assert.ok(960*v.scale>=w&&480*v.scale>=h);
    const p={x:240,y:312};
    const projected={x:p.x*v.scale+v.x,y:p.y*v.scale+v.y};
    assert.ok(Math.abs((projected.x-v.x)/v.scale-p.x)<.00001);
    assert.ok(Math.abs((projected.y-v.y)/v.scale-p.y)<.00001);
  }
});

test('등장 순서와 무관한 인물 외형과 본문·창작 근거를 제공한다', async () => {
  const {appearanceFor}=await import('../js/features/pixel-bible/appearance.js');
  const names=['엘리야','엘리사','이세벨','아합','벤하닷','나봇','미가야','여호사밧','아하시야(아합의 아들)','천사'];
  const styles=names.map((n,i)=>appearanceFor(n,i));
  assert.equal(new Set(styles.map(s=>s.key)).size,names.length);
  assert.equal(styles[0].fur,true);assert.equal(styles[1].bald,true);
  assert.equal(styles[2].eyeliner,true);assert.equal(styles[5].grapes,true);
  for(const [i,name] of names.entries()){
    assert.deepEqual(appearanceFor(name,1),appearanceFor(name,9));
    assert.ok(styles[i].evidence&&styles[i].design);
  }
});

test('로뎀나무 장면은 엘리야의 해당 본문에서만 열린다',()=>{
  const c={name:'열왕기상',code:'1ki',data:{people:[{name:'엘리야'},{name:'천사'}]}};
  assert.equal(buildWorldModel([{...c,chap:20}]).scenes.length,0);
  assert.equal(buildWorldModel([{...c,chap:19}]).scenes[0].id,'rest-elijah');
});

test('확장 외형은 근거와 창작 설명이 있고 이름별 미세 차이가 안정적이다',async()=>{
  const {APPEARANCES,appearanceFor}=await import('../js/features/pixel-bible/appearance.js');
  assert.equal(Object.keys(APPEARANCES).length,100);
  for(const p of Object.values(APPEARANCES)){
    const a=appearanceFor(p.name);assert.ok(a.evidence&&a.design);assert.deepEqual(a,appearanceFor(p.name,99));
  }
  assert.equal(appearanceFor('미리암').tambourine,true);
  assert.equal(appearanceFor('삼손').longHair,true);
  const signatures=new Set(Array.from({length:100},(_,i)=>{const {coat,hair,fringe,collar,hem,accent}=appearanceFor(`미등록 인물 ${i}`);return JSON.stringify([coat,hair,fringe,collar,hem,accent]);}));
  assert.ok(signatures.size>80);
});

test('신약 요셉에게 족장 요셉의 무늬 옷을 자동 적용하지 않는다',async()=>{
 const {appearanceFor}=await import('../js/features/pixel-bible/appearance.js');
 assert.equal(appearanceFor('요셉',0,'', ['창세기 37장']).pattern,true);
 assert.equal(appearanceFor('요셉',0,'마리아의 남편',['마태복음 1장']).pattern,undefined);
});


test('집단과 신적 존재를 분류하고 사울·요셉·빌립의 신원을 문맥으로 구분한다',async()=>{
 const {resolveIdentity:r}=await import('../js/features/pixel-bible/identity.js');
 assert.equal(r('이스라엘 자손').kind,'group');assert.equal(r('하나님').kind,'spiritual');
 assert.equal(r('사울',{code:'act'}).id,r('바울').id);
 assert.notEqual(r('사울',{code:'1sa'}).id,r('바울').id);
 assert.notEqual(r('요셉',{code:'gen'}).id,r('요셉',{code:'mat',role:'마리아의 남편'}).id);
 assert.equal(r('바로',{code:'exo'}).kind,'unresolved');assert.equal(r('마리아').kind,'unresolved');assert.equal(r('요한').status,'ambiguous');
 assert.notEqual(r('빌립',{code:'act',chapter:8}).id,r('빌립',{code:'jhn'}).id);
});

test('같은 이름의 다른 신원을 한 월드 인물로 합치지 않는다',()=>{
 const model=buildWorldModel([{code:'gen',name:'창세기',chap:37,data:{people:[{name:'요셉',role:'야곱의 아들'}]}},{code:'mat',name:'마태복음',chap:1,data:{people:[{name:'요셉',role:'마리아의 남편'}]}}]);
 assert.equal(model.cast.length,2);assert.notEqual(model.cast[0].identity.id,model.cast[1].identity.id);
});

test('배경 6종에 공통 이동 영역과 유효한 팔레트가 있다',async()=>{
 const {BACKGROUNDS,backgroundFor}=await import('../js/features/pixel-bible/backgrounds.js');
 assert.equal(Object.keys(BACKGROUNDS).length,6);assert.equal(backgroundFor('invalid'),BACKGROUNDS.meadow);assert.equal(backgroundFor('__proto__'),BACKGROUNDS.meadow);
 for(const p of Object.values(BACKGROUNDS)){assert.ok(p.name);assert.equal(p.tile.length,2);for(const k of ['ground','water','path','hill'])assert.match(p[k],/^#[0-9a-f]{6}$/);}
});

test('픽셀월드 목적격 조사는 받침과 괄호 설명을 구분한다',async()=>{
 const {objectPhrase}=await import('../js/features/pixel-bible/language.js');
 for(const [name,expected] of [['천사','천사를'],['엘리야','엘리야를'],['룻','룻을'],['엘리사','엘리사를'],['보아스','보아스를'],['물항아리','물항아리를'],['보리밭','보리밭을'],['아하시야(아합의 아들)','아하시야(아합의 아들)를']])assert.equal(objectPhrase(name),expected);
});

test('수평·수직 이동 방향과 정지 방향을 보존한다',async()=>{
 const {movementDirection:d}=await import('../js/features/pixel-bible/language.js');
 assert.equal(d(0,-1),'up');assert.equal(d(0,1),'down');assert.equal(d(-1,0),'left');assert.equal(d(1,0),'right');assert.equal(d(0,0,'up'),'up');
});
