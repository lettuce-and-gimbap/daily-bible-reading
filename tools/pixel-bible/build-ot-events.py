"""Offline review builder. Inputs: public authored summaries + private local source DBs.
Only short public summary explanations and references are emitted; never source verses.
Run ot-event-candidates.mjs first. Does not create new first-person dialogue by templates.
"""
import json,sqlite3,re,pathlib,collections
ROOT=pathlib.Path(__file__).resolve().parents[2]
BIBLE=pathlib.Path('/workspace/private-reference/bible/scripture.sqlite3')
HOKMA=pathlib.Path('/workspace/private-reference/hokma/hokma.sqlite3')
chapters=json.loads(pathlib.Path('/tmp/ot-candidates.json').read_text())
b=sqlite3.connect(BIBLE.as_uri()+'?mode=ro',uri=True);h=sqlite3.connect(HOKMA.as_uri()+'?mode=ro',uri=True)
output=ROOT/'data/pixel-bible/events';output.mkdir(exist_ok=True)
reports=[];bybook=collections.defaultdict(list)
# The curated source order requested by the user.
order=['2ki','gen','exo','lev','num','deu','jos','jdg','rut','1sa','2sa','1ki','1ch','2ch','ezr','neh','est','job','psa','pro','ecc','sng','isa','jer','lam','ezk','dan','hos','jol','amo','oba','jnh','mic','nam','hab','zep','hag','zec','mal']
chapters.sort(key=lambda c:(order.index(c['code']),c['chapter']))
def verses(span):
 out=[]
 for part in str(span).replace('–','-').replace('—','-').split(','):
  m=re.fullmatch(r'\s*(\d+)(?:\s*-\s*(\d+))?\s*',part)
  if not m:return []
  lo,hi=int(m[1]),int(m[2] or m[1]);out.extend(range(lo,hi+1))
 return sorted(set(out))
def short(text):
 parts=re.split(r'(?<=[.!?。])\s+',str(text).strip());return ' '.join(parts[:2])[:280]
for c in chapters:
 code,ch=c['code'],c['chapter'];paired={}
 for ed in ['gae','easy']:
  paired[ed]=dict(b.execute('select verse,text from verses where edition=? and code=? and chapter=? order by verse',(ed,code,ch)).fetchall());assert paired[ed],(code,ch,ed)
 commentary=h.execute('select body from chapters where code=? and chapter=?',(code,ch)).fetchone();assert commentary,(code,ch)
 report=dict(code=code,chapter=ch,sourceVerses={ed:len(v) for ed,v in paired.items()},commentaryAvailable=True,eventsReviewed=len(c['events']),scenes=0,skipped=[])
 for i,event in enumerate(c['events']):
  selected=verses(event.get('verses'));text=event.get('text','');ref=f"{c['name']} {ch}:{event.get('verses','')}"
  if not selected or any(not all(v in paired[ed] for v in selected) for ed in paired):report['skipped'].append(dict(title=event['title'],reason='reference-range-needs-review'));continue
  source={ed:' '.join(paired[ed][v] for v in selected) for ed in paired}
  actors=[]
  for p in c['people']:
   name=p['name'];simple=re.sub(r'\(.*?\)','',name).strip()
   if len(simple)<2 or re.search(r'하나님|여호와|성령|주님|사탄|마귀',simple):continue
   if name not in text and name not in event.get('actors',[]):continue
   if all(simple in body for body in source.values()):actors.append(name)
  candidates=[]
  for obj in c['objects']:
   aliases=obj.get('terms') or [obj['name']]
   if any(re.search(r'(?<![가-힣])'+re.escape(alias)+r'(?:들)?(?:은|는|이|가|을|를|의|에|에서|으로|로|과|와)?(?=$|[\s.,!?;:])',text) and all(alias in s for s in source.values()) for alias in aliases):candidates.append(obj)
  if not actors or not candidates:
   report['skipped'].append(dict(title=event['title'],reason='no-source-confirmed-actor-or-object'));continue
  # No invented first-person speech; poetry and figurative prophetic passages stay explanations.
  obj=candidates[0]
  entry=dict(id=f'ot-{code}-{ch}-{i}',code=code,chapter=ch,title=event['title'],actors=actors[:2],object=obj['id'],ref=ref,verseNumbers=selected,actions={},lines=['해설: '+short(text)],study=text,actorLines={},narrationOnly=True,objectNote='본문 사건을 설명으로 살펴보는 장면이에요. 물건은 해당 구절에 언급된 대상의 공통 그림이며, 비유·시의 장면은 실제 일어난 행동으로 재현하지 않아요.')
  bybook[code].append(entry);report['scenes']+=1
 reports.append(report)
voice_review=[]
for n,line in enumerate((ROOT/'tools/pixel-bible/ot-voiced-seeds.tsv').read_text().splitlines(),1):
 code,ch,span,requested,obj,voice,detail=line.split('|');ch=int(ch);numbers=verses(span);c=next(c for c in chapters if c['code']==code and c['chapter']==ch)
 actors=[p['name'] for p in c['people'] if p['name']==requested or re.sub(r'\(.*?\)','',p['name']).strip()==requested]
 chapter_text={ed:b.execute('select body from chapters where edition=? and code=? and chapter=?',(ed,code,ch)).fetchone()[0] for ed in ['gae','easy']}
 name_context=all(requested in text for text in chapter_text.values())
 if (code,requested) in [('ezr','에스라'),('neh','느헤미야'),('isa','이사야'),('jer','예레미야'),('ezk','에스겔'),('hos','호세아')]:name_context=all(re.search(r'내가|나를|내게|나는|나에게',text) for text in chapter_text.values())
 present=all(b.execute('select count(*) from verses where edition=? and code=? and chapter=? and verse in ('+','.join('?' for _ in numbers)+')',[ed,code,ch,*numbers]).fetchone()[0]==len(numbers) for ed in chapter_text)
 if len(actors)!=1 or not present or not name_context:
  voice_review.append(dict(code=code,chapter=ch,actor=requested,status='held-for-context-review'));continue
 actor=actors[0]
 bybook[code].append(dict(id=f'ot-voice-{n}',code=code,chapter=ch,title=detail.split('。')[0].split('요.')[0][:45],actors=[actor],object=obj,ref=f"{c['name']} {ch}:{span}",verseNumbers=numbers,actions={},lines=[actor+'(창작·본문 기반): '+voice,'해설: '+detail],study=detail,actorLines={actor:[voice]},narrationOnly=False,objectNote='본문을 근거로 직접 쓴 창작 발화예요. 도구는 장면의 상징 배치일 수 있으며, 모든 동작을 전용 애니메이션으로 재현한 것은 아니에요.'))
 voice_review.append(dict(code=code,chapter=ch,actor=actor,status='range-and-chapter-name-checked'))
print('voiced scenes',sum(r['status']=='range-and-chapter-name-checked' for r in voice_review))
catalog=json.loads((ROOT/'data/pixel-bible/people-catalog.json').read_text())
ambiguous={'사울','요셉','마리아','요한','빌립','야고보','유다','스가랴','아하시야','요나단','바로','다리오','벤하닷','요아스','여호람','살룸','요하난','아사랴','스라야','힐기야','여호아하스'}
known=[p for p in catalog['entries'] if p['name'] not in ambiguous and len(p['name'])>=2 and any(i['kind']=='person' for i in p['identities'])]
additional=collections.defaultdict(dict)
for c in chapters:
 existing={p['name'] for p in c['people']};ch=c['chapter'];code=c['code']
 source={ed:dict(b.execute('select verse,text from verses where edition=? and code=? and chapter=?',(ed,code,ch))) for ed in ['gae','easy']}
 for person in known:
  name=person['name']
  if name in existing:continue
  # Explicit name mentions with grammatical endings, never substring-only guesses.
  pattern=re.compile(r'(?<![가-힣])'+re.escape(name)+r'(?=$|[\s,.:;]|은|는|이|가|의|을|를|에게|에게서|과|와|아|야)')
  hits=[v for v,t in source['gae'].items() if pattern.search(t) and pattern.search(source['easy'].get(v,''))]
  if hits:additional[code].setdefault(str(ch),[]).append(dict(name=name,weight=1,role='본문에 이름이 언급되는 인물 · 실제 현장 동석 여부는 구절에서 확인해요.',mentionVerses=hits))
for code in order:(output/(code+'.json')).write_text(json.dumps(dict(book=code,scenes=bybook[code],additionalPeople=additional[code]),ensure_ascii=False,separators=(',',':'))+'\n')
print('additional chapter/person mentions',sum(len(p) for chapters_ in additional.values() for p in chapters_.values()))
manifest=dict(date='2026-10-25',method='Automated local verse-range and literal actor/object cross-check against two supplied editions. Existing authored summaries supply public explanations. Commentary availability is checked, not a claim of manual exegesis of every chapter.',books=[dict(code=code,chapters=sum(r['code']==code for r in reports),scenes=len(bybook[code])) for code in order],chapters=reports,voicedReview=voice_review)
(output/'review.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('books',len(order),'chapters',len(reports),'events',sum(r['eventsReviewed'] for r in reports),'scenes',sum(map(len,bybook.values())))
