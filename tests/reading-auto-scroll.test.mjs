import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function setup() {
 const element=()=>({textContent:'',value:'7',listeners:{},addEventListener(k,fn){this.listeners[k]=fn;},removeEventListener(k){delete this.listeners[k];},setAttribute(){},contains(){return false;}});
 const controls=Object.fromEntries(['[data-play]','input','[data-speed]','[data-eta]','[data-status]'].map(k=>[k,element()]));
 const bar={...element(),querySelector:k=>controls[k],remove(){},hidden:true};
 const body={...element(),scrollHeight:1000,clientHeight:300,scrollTop:0,isConnected:true};
 const document={...element(),createElement:()=>bar,querySelector:()=>null,hidden:false};
 let callback,now=0;
 const env={document,MutationObserver:class{observe(){}disconnect(){}},requestAnimationFrame(fn){callback=fn;return 1;},cancelAnimationFrame(){callback=null;}};
 vm.createContext(env);vm.runInContext(fs.readFileSync('js/features/reading-auto-scroll.js','utf8'),env);
 const controller=env.createReadingAutoScroll(body,{append(){},parentElement:{parentElement:{parentElement:{}}}});
 controller.setVisible(true);
 return {body,controls,controller,advance(ms){now+=ms;const fn=callback;callback=null;fn?.(now);}};
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
 s.body.listeners.touchstart();const top=s.body.scrollTop,eta=c['[data-eta]'].textContent;s.advance(1000);
 assert.equal(s.body.scrollTop,top);assert.equal(c['[data-eta]'].textContent,eta);assert.equal(c['[data-status]'].textContent,'일시정지');
});
test('끝에 도착하면 정지하고 외부 스크롤 및 숨김도 정지한다',()=>{
 const s=setup(),c=s.controls;s.body.scrollTop=700;c['[data-play]'].listeners.click();
 assert.equal(c['[data-status]'].textContent,'도착');
 s.body.scrollTop=0;c['[data-play]'].listeners.click();s.advance(0);s.body.scrollTop=100;s.body.listeners.scroll();
 assert.equal(c['[data-status]'].textContent,'일시정지');
 c['[data-play]'].listeners.click();s.controller.setVisible(false);assert.equal(c['[data-status]'].textContent,'일시정지');
 s.controller.destroy();
});
