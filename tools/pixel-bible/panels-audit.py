"""Exercise real world panels on desktop and landscape touch; only localhost data."""
import asyncio, json, urllib.request, pathlib, base64
import websockets
OUT=pathlib.Path('/tmp/pixel-review/panels'); OUT.mkdir(parents=True,exist_ok=True)
async def main():
 tab=json.load(urllib.request.urlopen(urllib.request.Request('http://localhost:9222/json/new?about:blank',method='PUT')))
 async with websockets.connect(tab['webSocketDebuggerUrl'],max_size=32*1024*1024) as ws:
  seq=0; errors=[]
  async def call(method,params=None):
   nonlocal seq
   seq+=1; ident=seq; await ws.send(json.dumps(dict(id=ident,method=method,params=params or {})))
   while True:
    m=json.loads(await ws.recv())
    if m.get('method')=='Runtime.exceptionThrown': errors.append(m['params'])
    if m.get('id')==ident:
     if 'error' in m:raise RuntimeError(m['error'])
     return m.get('result',{})
  async def ev(expression):
   r=await call('Runtime.evaluate',dict(expression=expression,returnByValue=True,awaitPromise=True))
   if r.get('exceptionDetails'):raise RuntimeError(r['exceptionDetails'])
   return r.get('result',{}).get('value')
  async def click(selector):await ev(f'document.querySelector({json.dumps(selector)}).click()')
  await call('Runtime.enable'); await call('Network.enable'); await call('Network.setCacheDisabled',{'cacheDisabled':True})
  for mobile in [False,True]:
   await call('Emulation.setDeviceMetricsOverride',dict(width=844 if mobile else 1280,height=390 if mobile else 720,deviceScaleFactor=1,mobile=mobile))
   await call('Emulation.setTouchEmulationEnabled',dict(enabled=mobile,maxTouchPoints=5))
   await call('Page.navigate',dict(url='http://localhost:8765/tools/pixel-bible/animation-world-review.html?book=2ki&chapter=2'))
   for _ in range(100):
    await asyncio.sleep(.1)
    if await ev('!!window.worldReviewReady'):break
   assert await ev('!!window.worldReviewReady'),'world not ready'
   await click('[data-action="pause"]'); await click('[data-action="toggle-right"]')
   assert await ev("!document.querySelector('#pb-right-panel').hidden")
   # An action inside the panel keeps it open; the opposite toggle closes it.
   await click('[data-action="toggle-left"]')
   assert await ev("document.querySelector('#pb-right-panel').hidden&&!document.querySelector('#pb-left-panel').hidden")
   await click('[data-cast-mode="all"]')
   assert await ev("!document.querySelector('#pb-left-panel').hidden")
   root=await ev("(()=>{for(const b of document.querySelectorAll('[data-cast-person]')){b.click();if(document.querySelector('[data-add-person]'))return b.dataset.castPerson;}return null;})()")
   assert root is not None,'no related people in fixture'
   heading=await ev("document.querySelector('.pb-recommendations h4').textContent")
   target=await ev("document.querySelector('[data-add-person]').dataset.addPerson")
   on=await ev(f'document.querySelector(\'[data-add-person="{target}"]\').getAttribute("aria-pressed")==="true"')
   for _ in range(3):
    before=await ev("document.querySelector('.pb-cast-count').textContent")
    await click(f'[data-add-person="{target}"]'); on=not on
    assert await ev(f'document.querySelector(\'[data-add-person="{target}"]\').getAttribute("aria-pressed")==="{str(on).lower()}"')
    assert await ev(f'document.querySelector(\'[data-toggle-person="{target}"]\').textContent==="'+('표시 중' if on else '숨김')+'"')
    assert await ev("document.querySelector('.pb-recommendations h4').textContent")==heading,'recommendation owner changed'
    assert await ev("document.querySelector('.pb-cast-count').textContent")!=before,'cast count did not change'
   assert await ev(f'document.querySelector(\'[data-cast-person="{root}"]\').getAttribute("aria-pressed")==="true"')
   selected=await ev("document.querySelector('canvas').toDataURL()")
   await click(f'[data-cast-person="{root}"]')
   assert await ev("document.querySelector('.pb-person-details').hidden&&document.querySelector('.pb-recommendations').hidden")
   assert await ev("!document.querySelector('[data-cast-person][aria-pressed=\"true\"],[data-cast-person][aria-expanded=\"true\"]')"),'selection highlight retained'
   assert await ev("document.querySelector('canvas').toDataURL()")!=selected,'selected sprite outline retained'
   # Opening again works; a repeated toggle click closes instead of immediately reopening.
   await click(f'[data-cast-person="{root}"]'); assert await ev("!document.querySelector('.pb-person-details').hidden")
   await click('[data-action="toggle-left"]'); assert await ev("document.querySelector('#pb-left-panel').hidden")
   for side in ['left','right']:
    await click(f'[data-action="toggle-{side}"]')
    point=await ev("(()=>{const r=document.querySelector('.pb-world-head').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()")
    if mobile:
     await call('Input.dispatchTouchEvent',dict(type='touchStart',touchPoints=[dict(**point,id=1)]));await call('Input.dispatchTouchEvent',dict(type='touchEnd',touchPoints=[]))
    else:
     await call('Input.dispatchMouseEvent',dict(type='mousePressed',button='left',clickCount=1,**point));await call('Input.dispatchMouseEvent',dict(type='mouseReleased',button='left',clickCount=1,**point))
    assert await ev(f'document.querySelector("#pb-{side}-panel").hidden'),'outside pointer did not dismiss'
    assert await ev(f'document.querySelector(\'[data-action="toggle-{side}"]\').getAttribute("aria-expanded")==="false"')
   # Click-only activation (keyboard/assistive use) follows the same dismissal rule.
   await click('[data-action="toggle-left"]'); await ev("document.querySelector('.pb-world-head').click()")
   assert await ev("document.querySelector('#pb-left-panel').hidden")
   await click('[data-action="toggle-left"]')
   shot=await call('Page.captureScreenshot',{'format':'png'});(OUT/('touch.png' if mobile else 'desktop.png')).write_bytes(base64.b64decode(shot['data']))
   await ev('window.disposeReview()')
   # Aborted world listeners cannot alter a later screen.
   await ev("document.querySelector('#pb-left-panel').hidden=false;document.querySelector('.pb-world-head').click()")
   assert await ev("!document.querySelector('#pb-left-panel').hidden"),'dismiss listener leaked after cleanup'
   print(('landscape touch' if mobile else 'desktop')+': panels, related toggles, selection clearing, outside dismissal, cleanup passed',flush=True)
  assert not errors,errors
  (OUT/'results.json').write_text(json.dumps({'desktop':True,'landscapeTouch':True,'errors':errors},indent=2))
asyncio.run(main())
