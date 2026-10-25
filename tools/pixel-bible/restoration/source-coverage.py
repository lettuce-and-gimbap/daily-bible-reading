#!/usr/bin/env python3
"""Check restored unit ranges against both private editions; export counts only."""
import json,sqlite3,hashlib,re
from pathlib import Path
root=Path(__file__).resolve().parents[3]
manifest=json.loads((root/'data/pixel-bible/events/coverage-nt.json').read_text())
scripture=sqlite3.connect('file:/workspace/private-reference/bible/scripture.sqlite3?mode=ro',uri=True)
hokma=sqlite3.connect('file:/workspace/private-reference/hokma/hokma.sqlite3?mode=ro',uri=True)
chapters={};private=[];failures=[]
for unit in manifest['units']:
 key=(unit['code'],unit['chapter']);chapters.setdefault(key,set())
 for part in unit['verses'].split(','):
  nums=[int(n) for n in re.split('[-–—]',part)]
  chapters[key].update(range(nums[0],nums[-1]+1))
public=[]
for (code,ch),covered in chapters.items():
 editions={}
 for edition in ['gae','easy']:
  rows=scripture.execute('SELECT verse,text FROM verses WHERE edition=? AND code=? AND chapter=?',(edition,code,ch)).fetchall()
  # Merged verse labels belong to their start verse in the verses table.
  present={v for v,text in rows if text.strip() and not re.fullmatch(r'\(?없음\)?[.]?',text.strip())}
  missing=sorted(present-covered)
  if missing:failures.append([code,ch,edition,missing])
  editions[edition]={'sourceRows':len(present),'coveredRows':len(present&covered),'missing':missing}
  private.append({'code':code,'chapter':ch,'edition':edition,'sourceHash':hashlib.sha256(json.dumps(rows,ensure_ascii=False).encode()).hexdigest()})
 commentary=bool(hokma.execute('SELECT 1 FROM chapters WHERE code=? AND chapter=?',(code,ch)).fetchone())
 public.append({'code':code,'chapter':ch,'editions':editions,'commentaryAvailable':commentary})
assert len(chapters)==260,len(chapters)
if failures:raise ValueError(failures)
private_root=Path('/workspace/private-reference/animation-audit');private_root.mkdir(exist_ok=True)
p=private_root/'restoration-source-nt.json';p.write_text(json.dumps(private));p.chmod(0o600)
(root/'docs/nt-restoration-source-coverage.json').write_text(json.dumps({'method':'두 비공개 역본의 비어 있지 않은 절 행이 공개 요약 단위의 범위에 포함되는지 자동 검사. 모든 절의 개별 작화 또는 수동 신학 검토를 뜻하지 않음. 원문은 내보내지 않음.','units':len(manifest['units']),'chapters':public},ensure_ascii=False,indent=2)+'\n')
print(len(manifest['units']),'units',len(chapters),'chapters; missing source verse rows: 0; private text exported: 0')
