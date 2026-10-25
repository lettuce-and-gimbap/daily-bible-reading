import asyncio,json,urllib.request,base64,pathlib,argparse
import websockets
parser=argparse.ArgumentParser();parser.add_argument('--cdp',default='http://localhost:9222');parser.add_argument('--base',default='http://127.0.0.1:8765');parser.add_argument('--output',default='/tmp/pixel-bible-animation-world-review');args=parser.parse_args();OUT=pathlib.Path(args.output);OUT.mkdir(exist_ok=True,parents=True)
async def main():
 tab=json.load(urllib.request.urlopen(urllib.request.Request(args.cdp+'/json/new?about:blank',method='PUT')))
 async with websockets.connect(tab['webSocketDebuggerUrl'],max_size=64*1024*1024) as ws:
  i=0;errors=[]
  async def call(method,params={}):
   nonlocal i;i+=1;ident=i;await ws.send(json.dumps({'id':i,'method':method,'params':params}))
   while True:
    m=json.loads(await ws.recv())
    if m.get('method')=='Runtime.exceptionThrown':errors.append(m['params'])
    if m.get('id')==ident:return m.get('result',m)
  async def ev(expression):
   r=await call('Runtime.evaluate',dict(expression=expression,awaitPromise=True,returnByValue=True))
   if r.get('exceptionDetails'):raise RuntimeError(r['exceptionDetails'])
   return r.get('result',{}).get('value')
  async def shot(name):
   r=await call('Page.captureScreenshot',{'format':'png'});(OUT/(name+'.png')).write_bytes(base64.b64decode(r['data']))
  await call('Runtime.enable');await call('Network.enable');await call('Network.setCacheDisabled',{'cacheDisabled':True});await call('Emulation.setDeviceMetricsOverride',dict(width=1280,height=720,deviceScaleFactor=1,mobile=False));await call('Page.navigate',{'url':args.base+'/tools/pixel-bible/animation-world-review.html'})
  for _ in range(80):
   await asyncio.sleep(.25)
   if await ev('!!window.worldReviewReady'):break
  assert await ev('!!window.worldReviewReady'),errors
  assert await ev("document.querySelector('.pb-event').hidden"),'event must not autoplay'
  await ev("document.querySelector('[data-action=\"toggle-right\"]').click();document.querySelector('[data-action=\"recipe-lock\"]').click();document.querySelector('[data-recipe]').click()")
  for _ in range(160):
   await asyncio.sleep(.2)
   if await ev("!document.querySelector('.pb-event-offer').hidden"):break
  assert await ev("!document.querySelector('.pb-event-offer').hidden"),'missing opt-in'
  assert await ev("document.querySelector('.pb-event').hidden"),'combination autoplayed'
  await shot('world-offer')
  await ev("document.querySelector('[data-action=\"watch-event\"]').click()")
  await asyncio.sleep(.3)
  assert await ev("!!document.querySelector('.pb-event-card canvas')"),'missing event canvas'
  await ev("document.querySelector('[data-action=\"event-pause\"]').click()")
  first=await ev("document.querySelector('.pb-event-card canvas').toDataURL()")
  await asyncio.sleep(.5)
  second=await ev("document.querySelector('.pb-event-card canvas').toDataURL()")
  assert first==second,'pause frame advanced'
  await call('Emulation.setDeviceMetricsOverride',dict(width=844,height=390,deviceScaleFactor=1,mobile=True));await asyncio.sleep(.2)
  assert await ev("(()=>{const b=document.querySelector('[data-action=\"skip\"]'),r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===b;})()"),'mobile Close button obscured'
  await shot('world-paused')
  await call('Emulation.setDeviceMetricsOverride',dict(width=1280,height=720,deviceScaleFactor=1,mobile=False));await asyncio.sleep(.2)
  await ev("window.firstCanvas=document.querySelector('.pb-event-card canvas');document.querySelector('[data-action=\"next\"]').click()")
  assert await ev("document.querySelector('.pb-event-card canvas')===window.firstCanvas"),'text step restarted/replaced animation'
  await ev("document.querySelector('[data-action=\"skip\"]').click()")
  assert await ev("document.querySelector('.pb-event').hidden&&getComputedStyle(document.querySelector('.pb-event')).display==='none'&&!document.querySelector('.pb-event-card canvas')"),'close cleanup failed'
  await asyncio.sleep(1)
  assert await ev("document.querySelector('.pb-event').hidden"),'same event replayed automatically'
  await call('Emulation.setDeviceMetricsOverride',dict(width=844,height=390,deviceScaleFactor=1,mobile=True))
  await asyncio.sleep(.2);await shot('world-mobile')
  assert not errors,errors
  (OUT/'world-smoke.json').write_text(json.dumps(dict(ready=True,optIn=True,pause=True,canvasPreserved=True,closeCleanup=True,noAutoRepeat=True,errors=errors),indent=2));print('world smoke passed')
asyncio.run(main())
