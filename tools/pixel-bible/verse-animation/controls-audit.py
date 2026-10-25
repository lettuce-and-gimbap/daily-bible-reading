import asyncio,json,urllib.request
import websockets
async def main():
 tab=json.load(urllib.request.urlopen(urllib.request.Request('http://localhost:9222/json/new?about:blank',method='PUT')))
 async with websockets.connect(tab['webSocketDebuggerUrl'],max_size=64*1024*1024) as ws:
  ident=0;errors=[]
  async def call(method,params={}):
   nonlocal ident;ident+=1;n=ident;await ws.send(json.dumps(dict(id=n,method=method,params=params)))
   while True:
    m=json.loads(await ws.recv())
    if m.get('method')=='Runtime.exceptionThrown':errors.append(m['params'])
    if m.get('id')==n:return m.get('result',{})
  async def ev(expression):
   r=await call('Runtime.evaluate',dict(expression=expression,awaitPromise=True,returnByValue=True))
   assert not r.get('exceptionDetails'),r
   return r.get('result',{}).get('value')
  await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Network.setCacheDisabled',{'cacheDisabled':True});await call('Emulation.setDeviceMetricsOverride',dict(width=844,height=390,deviceScaleFactor=1,mobile=True));await call('Page.navigate',{'url':'http://localhost:8765/tools/pixel-bible/verse-animation-controls.html'})
  for _ in range(100):
   await asyncio.sleep(.1)
   if await ev('!!window.controlsReview'):break
  assert await ev("document.querySelector('select').options.length===6")
  assert await ev('window.controlsChanges.at(-1).isVerse===false')
  await ev("window.oldCanvas=document.querySelector('canvas');document.querySelector('select').value='4';document.querySelector('select').dispatchEvent(new Event('change'))")
  assert await ev("!window.oldCanvas.isConnected&&document.querySelectorAll('canvas').length===1&&window.controlsChanges.at(-1).scene.verseNumbers[0]===16")
  await ev('window.controlsReview.dispose.setPaused(true)');await asyncio.sleep(.2);first=await ev("document.querySelector('canvas').toDataURL()")
  await asyncio.sleep(.3);assert first==await ev("document.querySelector('canvas').toDataURL()")
  await ev("document.querySelector('button[aria-label=\"다음 절 연출\"]').click()")
  assert await ev("window.controlsChanges.at(-1).scene.verseNumbers[0]===17&&document.querySelector('button[aria-label=\"다음 절 연출\"]').disabled")
  await asyncio.sleep(.2);first=await ev("document.querySelector('canvas').toDataURL()");await asyncio.sleep(.3);assert first==await ev("document.querySelector('canvas').toDataURL()"),'paused selection advanced'
  await ev('window.controlsReview.dispose.setPaused(false)');await asyncio.sleep(9)
  first=await ev("document.querySelector('canvas').toDataURL()");await asyncio.sleep(.3);assert first==await ev("document.querySelector('canvas').toDataURL()"),'finished verse replayed'
  assert await ev("(()=>{const s=document.querySelector('select'),r=s.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height>=44;})()")
  await ev('window.controlsReview.dispose()');assert await ev("!document.querySelector('.pb-event-playback')&&!document.querySelector('canvas')")
  assert not errors,errors;print('Verse selection, pause, change while paused, final hold, mobile controls and cleanup passed')
asyncio.run(main())
