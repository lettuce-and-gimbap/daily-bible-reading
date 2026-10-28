import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, rm, access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {account} from '../worker/src/account.js';
import reminderWorker from '../worker/src/index.js';

const chrome = process.env.CHROME || '/usr/bin/chromium';
const available = await access(chrome).then(()=>true,()=>false);
test('real browser: all 119 reminders save individual edits, reopen, batch upload and retry', {skip: !available, timeout:180000}, async () => {
  const [editor, art, sw] = await Promise.all(['../js/features/reminder-admin.js','../tools/notify-art/art.js','../sw.js'].map(p=>readFile(new URL(p,import.meta.url),'utf8')));
  const defaults = Function(`return ${sw.match(/const DEFAULT_MESSAGES = (\{[\s\S]*?\n\});/)[1]}`)();
  const stored = new Map();
  let failNext = false, batches = 0;
  const env = {
    DB:{prepare(){return {bind(){return {first:async()=>({user_id:'buucksoo',last:Date.now()}),run:async()=>({})};}};}},
    SUBS:{async get(k,t){const v=stored.get(k);return t==='json'&&v?JSON.parse(v):v??null;}, async put(k,v){stored.set(k,v);},async delete(k){stored.delete(k);}},
  };
  const html = `<!doctype html><meta charset="utf-8"><div id="app"></div><script>
  const app=document.querySelector('#app');
  const PUSH_SERVER='https://daily-bible-reminder.gimbap-lettuce.workers.dev';
  const defaults=${JSON.stringify(defaults)};
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const idbPut=async()=>{},idbRemove=async()=>{};
  async function accountApi(path,body,method=body?'PUT':'GET'){
    const response=await fetch('/__test/account/'+path,{method,headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    const result=await response.json();if(!response.ok)throw Error(result.error);return result;
  }
  ${`(()=>{${art}\n})();`}
  ${editor}
  reminderAdminDefaults=async()=>structuredClone(defaults);
  reminderAdminHasCurrentApi=async()=>true;
  reminderAdminLoadArt=async()=>window.ReminderArt;
  const pause=()=>new Promise(r=>setTimeout(r,5));
  const check=(value,message)=>{if(!value)throw Error(message);};
  async function ready(){for(let n=0;n<3000;n++){if(!document.querySelector('[data-reminder-say]')?.disabled)return;await pause();}throw Error('editor not ready');}
  function select(i){const s=document.querySelector('[data-reminder-entry]');s.value=i;s.dispatchEvent(new Event('change'));}
  function edit(field,value){const el=document.querySelector('[data-reminder-'+field+']');el.value=value;el.dispatchEvent(new Event('input'));}
  async function save(expectFailure=false){
    const button=document.querySelector('[data-reminder-save]');button.click();
    check(document.querySelector('[data-reminder-title]').disabled,'editing must be locked while saving');
    for(let n=0;n<6000&&button.disabled;n++)await pause();
    check(!button.disabled,'save timeout');
    const status=document.querySelector('.reminder-admin-status').textContent;
    check(status.includes(expectFailure?'저장하지 못했어요':'저장 완료'),status);
  }
  window.runTests=async()=>{
    await renderReminderAdmin('');await ready();
    const entries=Object.entries(defaults).flatMap(([tier,rows])=>rows.map((row,index)=>({tier,index,row})));
    check(entries.length===119,'119 entries expected');
    for(let i=0;i<entries.length;i++){
      const {tier,index}=entries[i];select(i);
      edit('title','수정 제목 '+i+' 🐑');await save();
      let saved=await accountApi('admin/reminder-messages');check(saved.messages[tier][index][0]==='수정 제목 '+i+' 🐑','title not persisted '+i);
      edit('body','개별 본문 {portion} '+i);await save();saved=await accountApi('admin/reminder-messages');
      check(saved.messages[tier][index][1]==='개별 본문 {portion} '+i,'body not persisted '+i);
      edit('say',i%2?'말씀 & 함께 <읽어요> '+i:'');
      select((i+1)%entries.length);select(i);
      check(document.querySelector('.reminder-admin-preview img').src.startsWith('blob:'),'pending preview lost '+i);
      await save();saved=await accountApi('admin/reminder-messages');
      check(saved.messages[tier][index][3]===(i%2?'말씀 & 함께 <읽어요> '+i:''),'bubble not persisted '+i);
      const picture=new Image();picture.src='/__test/art/'+tier+'/'+index+'.jpg';await picture.decode();
      check(picture.naturalWidth===720&&picture.naturalHeight===360,'saved JPEG does not decode '+i);
      check((saved.messages[tier][index][4]||'')===(entries[i].row[4]||''),'condition changed '+i);
      const target=entries[(i+1)%entries.length];const choice=document.querySelector('[data-reminder-image]');
      choice.value=target.tier+':'+target.index;choice.dispatchEvent(new Event('change'));await save();
      saved=await accountApi('admin/reminder-messages');check(saved.messages[tier][index][5]==='icons/notify/'+target.tier+'-'+target.index+'.jpg','art selection not persisted '+i);
    }
    for(let i=0;i<entries.length;i++){select(i);edit('body','오늘 {portion}을 읽어요. {streak}일 '+i);edit('say','모든 그림 수정 '+i);}
    await save();
    select(0);edit('title','실패 후 재시도');edit('say','말풍선 실패 후 재시도');await fetch('/__test/fail-next');await save(true);await save();
    const toBlob=HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob=function(callback){HTMLCanvasElement.prototype.toBlob=toBlob;callback(null);};
    edit('say','이미지 변환 재시도');await save(true);await save();
    await renderReminderAdmin('');await ready();select(0);
    check(document.querySelector('[data-reminder-title]').value==='실패 후 재시도','reopen lost saved title');
    check(!app.textContent.includes('알림 DB를 불러오는 중'),'loader remained');
    return {entries:119,individualSaves:476,bulkPictures:119,retry:true,reopen:true};
  };
  </script>`;
  const server = createServer(async (req,res)=>{
    try {
      if(req.url==='/__test/fail-next'){failNext=true;res.end('ok');return;}
      if(req.url.startsWith('/__test/art/')){
        const response=await reminderWorker.fetch(new Request('https://worker.test/reminder-art/'+req.url.slice('/__test/art/'.length)),env);
        res.writeHead(response.status,{'Content-Type':response.headers.get('content-type')});res.end(Buffer.from(await response.arrayBuffer()));return;
      }
      if(req.url.startsWith('/__test/account/')){
        if(failNext&&req.method==='PUT'){failNext=false;res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'테스트 일시 장애'}));return;}
        const chunks=[];for await(const chunk of req)chunks.push(chunk);
        const path=req.url.replace('/__test','');if(path.endsWith('/reminder-art'))batches++;
        const response=await account(path,new Request('https://worker.test'+path,{method:req.method,headers:req.headers,body:req.method==='GET'?undefined:Buffer.concat(chunks)}),env,(data,status=200)=>new Response(JSON.stringify(data),{status}));
        res.writeHead(response.status,{'Content-Type':'application/json'});res.end(await response.text());return;
      }
      res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);
    }catch(e){res.writeHead(500);res.end(String(e));}
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const profile=await mkdtemp(join(tmpdir(),'reminder-browser-'));
  const process=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`,`http://127.0.0.1:${server.address().port}/`]);
  let socket;
  try {
    const endpoint=await new Promise((resolve,reject)=>{let text='';process.stderr.on('data',c=>{text+=c;const m=text.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)resolve(m[1]);});process.once('error',reject);process.once('exit',()=>reject(Error('Chrome exited')));});
    const port=new URL(endpoint).port;
    const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await once(socket,'open');
    let id=0;const pending=new Map();
    socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id){pending.get(data.id)?.(data);pending.delete(data.id);}});
    const evaluate=expression=>new Promise(resolve=>{const n=++id;pending.set(n,resolve);socket.send(JSON.stringify({id:n,method:'Runtime.evaluate',params:{expression,awaitPromise:true,returnByValue:true}}));});
    for(let i=0;i<200;i++){if((await evaluate('typeof window.runTests')).result?.result?.value==='function')break;await new Promise(r=>setTimeout(r,20));}
    const result=await evaluate('window.runTests()');
    assert.equal(result.result?.exceptionDetails,undefined,JSON.stringify(result));
    assert.equal(result.result.result.value.entries,119);
    assert.ok(batches>=12,'bulk images must be uploaded in bounded batches');
    assert.equal([...stored.keys()].filter(k=>k.startsWith('admin:reminder-art:')).length,119);
  } finally {socket?.close();process.kill('SIGKILL');server.closeAllConnections();await new Promise(r=>server.close(r));await rm(profile,{recursive:true,force:true,maxRetries:5});}
});
