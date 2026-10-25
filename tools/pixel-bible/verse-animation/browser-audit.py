import asyncio,json,urllib.request,base64,pathlib,hashlib
import websockets
ROOT=pathlib.Path(__file__).resolve().parents[3];OUT=pathlib.Path('/tmp/pixel-review/verse-animation');OUT.mkdir(exist_ok=True,parents=True)
async def main():
 tab=json.load(urllib.request.urlopen(urllib.request.Request('http://localhost:9222/json/new?about:blank',method='PUT')))
 async with websockets.connect(tab['webSocketDebuggerUrl'],max_size=64*1024*1024) as ws:
  i=0
  async def call(method,params={}):
   nonlocal i;i+=1;ident=i;await ws.send(json.dumps({'id':i,'method':method,'params':params}))
   while True:
    m=json.loads(await ws.recv())
    if m.get('id')==ident:return m.get('result',m)
  async def ev(s):
   r=await call('Runtime.evaluate',{'expression':s,'awaitPromise':True,'returnByValue':True})
   if r.get('exceptionDetails'):raise RuntimeError(r['exceptionDetails'])
   return r.get('result',{}).get('value')
  await call('Network.enable');await call('Network.setCacheDisabled',{'cacheDisabled':True});await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',dict(width=1400,height=1200,deviceScaleFactor=1,mobile=False));await call('Page.navigate',{'url':'http://localhost:8765/tools/pixel-bible/verse-animation-review.html'})
  for _ in range(80):
   await asyncio.sleep(.1)
   if await ev("document.body?.dataset.ready==='true'"):break
  results=[]
  for ch in await ev('window.verseReview.chapters'):
   result=await ev(f'window.verseReview.render({ch})');assert not result['failures'],result;results.append(result)
   shot=await call('Page.captureScreenshot',{'format':'png'});(OUT/f'mat-{ch}.png').write_bytes(base64.b64decode(shot['data']))
   for opts in [{'time':0},{'time':8.2},{'time':4,'portrait':True},{'time':4,'reduced':True}]:
    r=await ev(f'window.verseReview.render({ch},{json.dumps(opts)})');assert not r['failures'],r
   print(ch,result['drawn'],'verse clips; errors 0',flush=True)
  samples={1:[2,16,20,24],2:[9,11,14,16],3:[6,14,16,17],4:[3,18,20,24],5:[15,24,29,45],6:[6,11,26,34],7:[7,15,25,27],8:[3,6,13,26],9:[7,10,20,25]}
  for ch,verses in samples.items():
   ids=[f'verse-mat-{ch}-{v}' for v in verses];await ev(f'window.verseReview.render({ch},'+json.dumps({'ids':ids,'time':5})+')');shot=await call('Page.captureScreenshot',{'format':'png'});(OUT/f'selected-{ch}.png').write_bytes(base64.b64decode(shot['data']))
  await call('Emulation.setDeviceMetricsOverride',dict(width=844,height=390,deviceScaleFactor=1,mobile=True));assert not (await ev('window.verseReview.render(3)'))['failures']
  payload=ROOT/'data/pixel-bible/verse-events/mat.json'
  renderer=['pixel-event.js','event-animation/timeline.js','event-animation/verse-diagrams.js','event-animation/verse-effects.js']
  report={'authored':sum(r['drawn'] for r in results),'browserVerified':sum(r['drawn'] for r in results),'payloadSha256':hashlib.sha256(payload.read_bytes()).hexdigest(),'rendererSha256':hashlib.sha256('\n'.join((ROOT/('js/features/pixel-bible/'+f)).read_text() for f in renderer).encode()).hexdigest(),'method':'Chromium 7 sampled times, start/action/end/portrait/reduced, desktop and landscape mobile. Automated exceptions check; representative frames inspected separately, not all frames watched manually.','chapters':results}
  (ROOT/'data/pixel-bible/verse-events/review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
asyncio.run(main())
