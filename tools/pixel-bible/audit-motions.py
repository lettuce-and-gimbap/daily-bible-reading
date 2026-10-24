"""Audit all object actions in Chromium. Serve the repository before running."""
import argparse,json,pathlib,math
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',default='http://127.0.0.1:8002');p.add_argument('--output',default='/tmp/pixel-motion-audit.json');a=p.parse_args()
results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page()
 i=0;pages=1
 while i<pages:
  page.goto(a.url.rstrip('/')+'/tools/pixel-bible/motion-review.html?page='+str(i));page.wait_for_function('window.reviewReady===true',timeout=120000);results.append(page.evaluate('window.review'));pages=math.ceil(results[-1]['total']/12);i+=1
 browser.close()
pathlib.Path(a.output).write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(json.dumps({'objects':sum(len(r['objects'])for r in results),'actions':sum(len(o['actions'])for r in results for o in r['audit']),'frames':sum(r['frames']for r in results),'errors':[e for r in results for e in r['errors']]},ensure_ascii=False))
