#!/usr/bin/env python3
"""Public progress counts, private source hashes. Pending verses are never called complete."""
import json,sqlite3,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[3]
source=sqlite3.connect('file:/workspace/private-reference/bible/scripture.sqlite3?mode=ro',uri=True)
hokma=sqlite3.connect('file:/workspace/private-reference/hokma/hokma.sqlite3?mode=ro',uri=True)
codes=list(json.loads((root/'tools/pixel-bible/animation/book-plans-nt.json').read_text()))
progress=[];private=[];notices=0
for code in codes:
 file=root/f'data/pixel-bible/verse-events/{code}.json'
 authored=json.loads(file.read_text())['scenes'] if file.exists() else []
 for chapter,total in source.execute('SELECT chapter,max(verse) FROM verses WHERE edition=? AND code=? GROUP BY chapter ORDER BY chapter',('gae',code)):
  clips=[s for s in authored if s['chapter']==chapter]
  numbers={v for s in clips for v in s['verseNumbers']}
  assert len(numbers)==len(clips)
  for scene in clips:
   notices+=bool(scene.get('textualNotice'));records={}
   for edition in ['gae','easy']:
    rows=source.execute('SELECT verse,text FROM verses WHERE edition=? AND code=? AND chapter=? AND verse=?',(edition,code,chapter,scene['verseNumbers'][0])).fetchall()
    assert rows,(scene['id'],edition)
    records[edition]=hashlib.sha256(json.dumps(rows,ensure_ascii=False).encode()).hexdigest()
   assert hokma.execute('SELECT 1 FROM chapters WHERE code=? AND chapter=?',(code,chapter)).fetchone()
   private.append({'id':scene['id'],'sourceHashes':records})
  progress.append({'code':code,'chapter':chapter,'expected':total,'authored':len(clips),'pending':total-len(clips)})
p=root/'data/pixel-bible/verse-events/progress.json';p.write_text(json.dumps({'scope':'신약 개역개정 절 번호 기준. 계 12:18 등 역본별 별도 절 구분은 추가 검토 대상. 작성된 절만 집계하며 브라우저 검수 완료와 구별함.','expected':sum(x['expected'] for x in progress),'authored':sum(x['authored'] for x in progress),'contentClips':sum(x['authored'] for x in progress)-notices,'textualNotices':notices,'pending':sum(x['pending'] for x in progress),'chapters':progress},ensure_ascii=False,indent=2)+'\n')
private_root=Path('/workspace/private-reference/animation-audit');p=private_root/'verse-source-hashes.json';p.write_text(json.dumps(private));p.chmod(0o600)
print('Authored:',len(private),'private text exported: 0')
