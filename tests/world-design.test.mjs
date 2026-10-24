import test from 'node:test';
import assert from 'node:assert/strict';
import {physiqueFor} from '../js/features/pixel-bible/physique.js';
import {sceneDecorations} from '../js/features/pixel-bible/landscape.js';
import {BACKGROUNDS} from '../js/features/pixel-bible/backgrounds.js';
import {OBJECT_CATALOG} from '../js/features/pixel-bible/object-catalog.js';
test('본문의 체격 기록을 구분하고 가나안 주민 전체나 바울에게 잘못 적용하지 않는다',()=>{
 assert.ok(physiqueFor('골리앗').height>physiqueFor('다윗').height);
 assert.ok(physiqueFor('삭개오').height<physiqueFor('다윗').height);
 assert.ok(physiqueFor('사울','왕',['사무엘상 9장']).height>1.1);
 assert.ok(physiqueFor('사울','바울',['사도행전 9장']).height<1.1);
 assert.ok(physiqueFor('가나안 사람','주민',['민수기 13장']).height<1.1);
 assert.ok(physiqueFor('아낙 자손','',['민수기 13장']).height>1.1);
});
test('20개 배경의 기본 경관은 등록된 물건으로 구성되고 배치가 서로 다르다',()=>{
 const signatures=[];for(const key of Object.keys(BACKGROUNDS)){
  const props=sceneDecorations(key);assert.ok(props.length>10);
  for(const p of props){assert.ok(OBJECT_CATALOG[p.kind],p.kind);assert.ok(p.x>=0&&p.x<80&&p.y>=0&&p.y<45);}
  signatures.push(JSON.stringify(props.map(({kind,x,y})=>[kind,x,y])));
 }
 assert.equal(new Set(signatures).size,Object.keys(BACKGROUNDS).length);
});
