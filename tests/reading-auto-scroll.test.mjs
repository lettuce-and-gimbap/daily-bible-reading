import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function setup() {
 const element=()=>({textContent:'',value:'7',listeners:{},addEventListener(k,fn){this.listeners[k]=fn;},removeEventListener(k){delete this.listeners[k];},setAttribute(k,v){this[k]=v;},contains(){return false;}});
 const controls=Object.fromEntries(['[data-play]','input','[data-speed]','[data-eta]','[data-status]'].map(k=>[k,element()]));
 const bar={...element(),querySelector:k=>controls[k],remove(){},hidden:true};
 const body={...element(),scrollHeight:1000,clientHeight:300,scrollTop:0,isConnected:true};
 const document={...element(),createElement:()=>bar,querySelector:()=>null,hidden:false};
 let callback,mutation,now=0;
 const env={document,MutationObserver:class{constructor(fn){mutation??=fn;}observe(){}disconnect(){}},requestAnimationFrame(fn){callback=fn;return 1;},cancelAnimationFrame(){callback=null;}};
 vm.createContext(env);vm.runInContext(fs.readFileSync('js/features/scripture-auto-scroll.js','utf8'),env);
 const trigger=element();
 const controller=env.createScriptureAutoScroll(body,{append(){},parentElement:{parentElement:{}}},trigger);
 controller.setVisible(true);trigger.listeners.click();
 return {body,controls,controller,trigger,bar,mutate(){mutation();},advance(ms){now+=ms;const fn=callback;callback=null;fn?.(now);}};
}
test('속도를 실시간 반영하고 소수 픽셀을 누적하며 ETA를 계산한다',()=>{
 const s=setup(),c=s.controls;
 assert.equal(c['[data-eta]'].textContent,'01:40');
 c['[data-play]'].listeners.click();s.advance(0);
 for(let i=0;i<60;i++)s.advance(1000/60);
 assert.ok(Math.abs(s.body.scrollTop-7)<0.001);
 c.input.value='30';c.input.listeners.input();
 assert.equal(c['[data-eta]'].textContent,'00:24');
 for(let i=0;i<60;i++)s.advance(1000/60);
 assert.ok(Math.abs(s.body.scrollTop-37)<0.001);
 s.body.scrollTop=200;s.body.listeners.scroll();
 assert.equal(c['[data-eta]'].textContent,'00:17');
 assert.equal(s.trigger.textContent,'자동 ON');
 s.advance(1000);
 assert.ok(s.body.scrollTop>200);
 assert.equal(c['[data-status]'].textContent,'재생 중');
});
test('끝에 도착하거나 다른 탭으로 이동하면 정지한다',()=>{
 const s=setup(),c=s.controls;s.body.scrollTop=700;c['[data-play]'].listeners.click();
 assert.equal(c['[data-status]'].textContent,'도착');
 s.body.scrollTop=0;c['[data-play]'].listeners.click();s.advance(0);s.body.scrollTop=100;s.body.listeners.scroll();
 assert.equal(c['[data-status]'].textContent,'재생 중');
 assert.equal(s.trigger.textContent,'자동 ON');
 s.controller.setVisible(false);assert.equal(c['[data-status]'].textContent,'일시정지');
 s.controller.destroy();
});

test('상단 버튼은 패널만 열고 닫으며 ON/OFF는 실제 재생 상태를 따른다',()=>{
 const s=setup(),c=s.controls;
 assert.equal(s.trigger.textContent,'자동 OFF');
 assert.equal(s.bar.hidden,false);
 c['[data-play]'].listeners.click();s.advance(0);s.advance(100);
 assert.ok(s.body.scrollTop>0);
 assert.equal(s.trigger.textContent,'자동 ON');
 assert.equal(s.trigger['aria-pressed'],'true');
 s.trigger.listeners.click();
 assert.equal(s.bar.hidden,true);
 assert.equal(s.trigger['aria-expanded'],'false');
 assert.equal(s.trigger.textContent,'자동 ON');
 const top=s.body.scrollTop;s.advance(100);
 assert.ok(s.body.scrollTop>top);
 s.trigger.listeners.click();
 assert.equal(s.bar.hidden,false);
 assert.equal(s.trigger.textContent,'자동 ON');
 c['[data-play]'].listeners.click();
 assert.equal(s.trigger.textContent,'자동 OFF');
 assert.equal(s.trigger['aria-pressed'],'false');
});

test('본문이 비동기로 바뀌거나 손으로 스크롤해도 재생과 ETA가 유지된다',()=>{
 const s=setup(),c=s.controls;
 c['[data-play]'].listeners.click();s.advance(0);
 s.bar.hidden=true;
 s.body.scrollTop=350;s.body.listeners.scroll();
 assert.equal(c['[data-eta]'].textContent,'00:50');
 s.mutate();
 assert.equal(s.trigger.textContent,'자동 ON');
 s.advance(100);
 assert.ok(s.body.scrollTop>350);
 assert.equal(c['[data-status]'].textContent,'재생 중');
});
