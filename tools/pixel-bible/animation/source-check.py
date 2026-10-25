#!/usr/bin/env python3
"""Validate local passage coverage; private text/hashes stay outside the repository.
This is an automated range check, not a claim of human verse-by-verse exegesis.
"""
import json,sqlite3,hashlib,argparse
from pathlib import Path
root=Path(__file__).resolve().parents[3]
parser=argparse.ArgumentParser();parser.add_argument('--nt',action='store_true');args=parser.parse_args();suffix='-nt' if args.nt else ''
plans=json.loads((root/('tools/pixel-bible/animation/book-plans'+suffix+'.json')).read_text())
scripture=sqlite3.connect('file:/workspace/private-reference/bible/scripture.sqlite3?mode=ro',uri=True)
hokma=sqlite3.connect('file:/workspace/private-reference/hokma/hokma.sqlite3?mode=ro',uri=True)
private=[];public=[]
for code in plans:
 scenes=json.loads((root/f'data/pixel-bible/events/{code}.json').read_text())['scenes'];missing=[]
 for scene in scenes:
  counts={};records={}
  for edition in ['gae','easy']:
   verses=scene['verseNumbers'];marks=','.join('?' for _ in verses)
   rows=scripture.execute(f'SELECT verse,text FROM verses WHERE edition=? AND code=? AND chapter=? AND verse IN ({marks}) ORDER BY verse',[edition,code,scene['chapter'],*verses]).fetchall()
   counts[edition]=len(rows);records[edition]=hashlib.sha256(json.dumps(rows,ensure_ascii=False).encode()).hexdigest()
   if not rows:missing.append(scene['id']+':'+edition)
  row=hokma.execute('SELECT body FROM chapters WHERE code=? AND chapter=?',(code,scene['chapter'])).fetchone()
  private.append(dict(id=scene['id'],ref=scene['ref'],counts=counts,hashes=records,commentaryAvailable=bool(row),commentaryHash=hashlib.sha256(row[0].encode()).hexdigest() if row else None))
 public.append(dict(code=code,scenes=len(scenes),passageRangesFound=len(scenes)-len(set(s.split(':')[0] for s in missing)),missing=missing))
 if missing:raise ValueError(missing)
private_root=Path('/workspace/private-reference/animation-audit');private_root.mkdir(exist_ok=True,parents=True)
(private_root/('source-ranges'+suffix+'.json')).write_text(json.dumps(private,ensure_ascii=False,indent=2));(private_root/('source-ranges'+suffix+'.json')).chmod(0o600)
(root/('docs/animation-source-ranges'+suffix+'.json')).write_text(json.dumps(dict(method='비공개 두 역본의 참조 범위 존재 여부와 주석 장 연결 확인. 자동 조회이며 전 구절의 수동 신학 검토를 뜻하지 않음.',books=public),ensure_ascii=False,indent=2)+'\n')
print('source ranges:',len(private),'private text exported: 0')
