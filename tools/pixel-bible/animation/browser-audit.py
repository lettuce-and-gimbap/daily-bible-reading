import asyncio,json,urllib.request,base64,pathlib,argparse
import websockets
parser=argparse.ArgumentParser(description='로컬 Chromium CDP와 정적 서버를 이용한 구약 픽셀 연출 검사');parser.add_argument('--cdp',default='http://localhost:9222');parser.add_argument('--base',default='http://127.0.0.1:8765');parser.add_argument('--books',help='쉼표로 구분한 권 코드. 생략하면 구약 전체');parser.add_argument('--output',default='/tmp/pixel-bible-animation-review');args=parser.parse_args();OUT=pathlib.Path(args.output);OUT.mkdir(exist_ok=True,parents=True)
ROOT=pathlib.Path(__file__).resolve().parents[3]
async def main():
 tab=json.load(urllib.request.urlopen(urllib.request.Request(args.cdp+'/json/new?about:blank',method='PUT')))
 async with websockets.connect(tab['webSocketDebuggerUrl'],max_size=64*1024*1024) as ws:
  i=0
  async def call(method,params={}):
   nonlocal i;i+=1;ident=i;await ws.send(json.dumps({'id':i,'method':method,'params':params}))
   while True:
    m=json.loads(await ws.recv())
    if m.get('id')==ident:
     if 'error' in m:raise RuntimeError(m['error'])
     return m.get('result',m)
  async def evaluate(expression):
   result=await call('Runtime.evaluate',{'expression':expression,'awaitPromise':True,'returnByValue':True})
   if result.get('exceptionDetails'):raise RuntimeError(result['exceptionDetails'])
   return result.get('result',{}).get('value')
  await call('Network.enable');await call('Network.setCacheDisabled',{'cacheDisabled':True});await call('Page.enable');await call('Runtime.enable');await call('Emulation.setDeviceMetricsOverride',dict(width=1400,height=1450,deviceScaleFactor=1,mobile=False));await call('Page.navigate',{'url':args.base+'/tools/pixel-bible/animation-review.html?revision=2'})
  for _ in range(40):
   await asyncio.sleep(.25)
   if await evaluate("document.body?.dataset.ready==='true'"):break
  books=await evaluate('window.animationReview.books');results=[]
  if args.books:
   wanted=set(args.books.split(','));books=[b for b in books if b['code'] in wanted]
   if len(books)!=len(wanted):raise ValueError('Unknown book code')
  for b in books:
   code=b['code'];r=await evaluate(f"window.animationReview.renderBook({json.dumps(code)},{{time:4.5}})");results.append(r)
   shot=await call('Page.captureScreenshot',{'format':'png'});(OUT/(code+'.png')).write_bytes(base64.b64decode(shot['data']))
   # Render start/end frames and portraits as well, without leaving hundreds of animation loops running.
   for time in [0,8.2]:
    r=await evaluate(f"window.animationReview.renderBook({json.dumps(code)},{{time:{time}}})")
    if r['failures']:results.append(r)
   r=await evaluate(f"window.animationReview.renderBook({json.dumps(code)},{{time:4,portrait:true}})")
   if r['failures']:results.append(r)
   print(code,b['scenes'],'failures',len(results[-1]['failures']),flush=True)
  static=await evaluate('window.animationReview.auditStatic()');results.append({'static':static})
  await call('Emulation.setDeviceMetricsOverride',dict(width=844,height=390,deviceScaleFactor=1,mobile=True))
  mobile=await evaluate("window.animationReview.renderBook('gen',{time:4})")
  shot=await call('Page.captureScreenshot',{'format':'png'});(OUT/'mobile.png').write_bytes(base64.b64decode(shot['data']))
  if any(r.get('failures') for r in results) or static['failures'] or mobile['failures']:raise RuntimeError('render failures')
  report=json.loads((ROOT/'data/pixel-bible/animation-review.json').read_text())
  for b in report['books']:
   if not any(r.get('code')==b['code'] for r in results):continue
   result=next(r for r in results if r.get('code')==b['code']);b['status']='browser-verified';b['browser']={'scenes':result['drawn'],'sampledStatesPerScene':7,'renderPasses':['start','action','end','portrait'],'errors':0}
  (ROOT/'data/pixel-bible/animation-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
  (OUT/'results.json').write_text(json.dumps({'books':results,'mobile':mobile},ensure_ascii=False,indent=2))
asyncio.run(main())
