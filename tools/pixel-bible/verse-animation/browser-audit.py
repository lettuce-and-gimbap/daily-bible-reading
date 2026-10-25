import asyncio,json,urllib.request,base64,pathlib,hashlib,argparse
import websockets
parser=argparse.ArgumentParser();parser.add_argument('--book',choices=['mat','mrk'],default='mat');CODE=parser.parse_args().book
ROOT=pathlib.Path(__file__).resolve().parents[3];OUT=pathlib.Path('/tmp/pixel-review/verse-animation'+('' if CODE=='mat' else '-'+CODE));OUT.mkdir(exist_ok=True,parents=True)
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
  await call('Network.enable');await call('Network.setCacheDisabled',{'cacheDisabled':True});await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',dict(width=1400,height=1200,deviceScaleFactor=1,mobile=False));await call('Page.navigate',{'url':'http://localhost:8765/tools/pixel-bible/verse-animation-review.html?book='+CODE})
  for _ in range(80):
   await asyncio.sleep(.1)
   if await ev("document.body?.dataset.ready==='true'"):break
  results=[]
  for ch in await ev('window.verseReview.chapters'):
   result=await ev(f'window.verseReview.render({ch})');assert not result['failures'],result;results.append(result)
   shot=await call('Page.captureScreenshot',{'format':'png'});(OUT/f'{CODE}-{ch}.png').write_bytes(base64.b64decode(shot['data']))
   for opts in [{'time':0},{'time':8.2},{'time':4,'portrait':True},{'time':4,'reduced':True}]:
    r=await ev(f'window.verseReview.render({ch},{json.dumps(opts)})');assert not r['failures'],r
   print(ch,result['drawn'],'verse clips; errors 0',flush=True)
  samples={1:[2,16,20,24],2:[9,11,14,16],3:[6,14,16,17],4:[3,18,20,24],5:[15,24,29,45],6:[6,11,26,34],7:[7,15,25,27],8:[3,6,13,26],9:[7,10,20,25],10:[14,29,34,42],11:[7,12,14,29],12:[15,20,40,50],13:[4,7,33,48],14:[11,20,29,31],15:[14,26,28,37],16:[3,6,18,24],17:[2,12,21,27],18:[11,12,23,34],19:[6,14,24,29],20:[8,16,22,34],21:[7,9,12,29],22:[2,11,21,44],23:[14,24,26,37],24:[2,29,31,41],25:[1,10,15,35],26:[7,26,39,74],27:[24,38,51,60],28:[2,6,9,20]}
  if CODE=='mrk':samples={1:[9,16,31,41],2:[3,4,12,14],3:[3,5,11,34],4:[3,35,38,41],5:[3,13,27,42],6:[8,14,40,52],7:[10,16,29,33]}
  for ch,verses in samples.items():
   ids=[f'verse-{CODE}-{ch}-{v}' for v in verses];await ev(f'window.verseReview.render({ch},'+json.dumps({'ids':ids,'time':5})+')');shot=await call('Page.captureScreenshot',{'format':'png'});(OUT/f'selected-{ch}.png').write_bytes(base64.b64decode(shot['data']))
  await call('Emulation.setDeviceMetricsOverride',dict(width=844,height=390,deviceScaleFactor=1,mobile=True));assert not (await ev('window.verseReview.render(3)'))['failures']
  payload=ROOT/f'data/pixel-bible/verse-events/{CODE}.json'
  renderer=['pixel-event.js','event-animation/timeline.js','event-animation/verse-diagrams.js','event-animation/verse-effects.js','event-animation/verse-symbols.js','event-animation/verse-parables.js','event-animation/verse-paths.js','event-animation/verse-teaching.js']
  report={'authored':sum(r['drawn'] for r in results),'browserVerified':sum(r['drawn'] for r in results),'payloadSha256':hashlib.sha256(payload.read_bytes()).hexdigest(),'rendererSha256':hashlib.sha256('\n'.join((ROOT/('js/features/pixel-bible/'+f)).read_text() for f in renderer).encode()).hexdigest(),'method':'Chromium 7 sampled times, start/action/end/portrait/reduced, desktop and landscape mobile. Automated exceptions check; representative frames inspected separately, not all frames watched manually.','chapters':results}
  (ROOT/('data/pixel-bible/verse-events/review'+('' if CODE=='mat' else '-'+CODE)+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
asyncio.run(main())
