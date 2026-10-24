"""Local-only verse/format audit. No source text or full verse index is published."""
import pathlib,sqlite3,json,re,subprocess,collections
ROOT=pathlib.Path(__file__).resolve().parents[2]
db=sqlite3.connect('file:/workspace/private-reference/bible/scripture.sqlite3?mode=ro',uri=True)
books=json.loads(subprocess.check_output(['node','-e','console.log(JSON.stringify(require("./js/core/bible.js").BOOKS))'],cwd=ROOT))
counts=json.loads(re.search(r'const VERSE_COUNTS\s*=\s*(\[[\s\S]*?\]);',(ROOT/'js/core/versecounts.js').read_text())[1])
assert len(counts)==sum(b['chapters'] for b in books)
rows=[];idx=0;summary={}
for book in books:
 for chapter in range(1,book['chapters']+1):
  expected=counts[idx];idx+=1
  for edition in ['gae','easy']:
   raw=db.execute('select body from chapters where edition=? and code=? and chapter=?',(edition,book['code'],chapter)).fetchone();assert raw
   spans=[];flags=[]
   for line in raw[0].splitlines():
    m=re.match(r'^(\d+)(?:[-–—](\d+))?\s+(.+)$',line.strip())
    if not m:continue
    lo,hi=int(m[1]),int(m[2] or m[1]);text=m[3]
    if hi<lo or hi-lo>200:flags.append('invalid-range');continue
    spans.append((lo,hi))
    if '\ufffd' in text:flags.append('replacement-character')
    if re.search(r'<(?:script|div|span|p)\b',text,re.I):flags.append('html-in-source')
   covered={v for lo,hi in spans for v in range(lo,hi+1)}
   missing=sorted(set(range(1,expected+1))-covered)
   row=dict(code=book['code'],chapter=chapter,edition=edition,expected=expected,covered=len(covered),merged=[list(p) for p in spans if p[0]!=p[1]],missingOrNumberingDifference=missing,outsideNumbering=sorted(v for v in covered if v>expected),flags=flags)
   rows.append(row)
for edition in ['gae','easy']:
 selected=[r for r in rows if r['edition']==edition];summary[edition]=dict(chapters=len(selected),coveredVerses=sum(r['covered'] for r in selected),mergedGroups=sum(len(r['merged']) for r in selected),missingOrNumberingDifferences=sum(len(r['missingOrNumberingDifference']) for r in selected),flaggedChapters=sum(bool(r['flags']) for r in selected))
output=pathlib.Path('/workspace/private-reference/bible/coverage-review-2026-10-25.json');output.write_text(json.dumps(dict(date='2026-10-25',scope='Automated structural audit, not a manual theological review',summary=summary,chapters=rows),ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,ensure_ascii=False))
for r in rows:
 if r['missingOrNumberingDifference']:print(r['edition'],r['code'],r['chapter'],r['missingOrNumberingDifference'])
