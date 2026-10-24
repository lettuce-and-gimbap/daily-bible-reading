#!/usr/bin/env python3
"""Offline, private scripture lookup. Never import this module into the public app."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess

REPO = Path(__file__).resolve().parents[2]
DEFAULT_DB = Path('/workspace/private-reference/bible/scripture.sqlite3')
EDITIONS = {'gae': '개역개정 4판', 'easy': '쉬운성경'}
HEADER = re.compile(r'^##\s+(\d+)(?:장|편)\s*$', re.M)
VERSE = re.compile(r'^(\d+)\s+(.+)$')


def parse_book(text, expected_chapters=None):
    """Only numbered passages are data; document text is never executed."""
    headers = list(HEADER.finditer(text.replace('\r\n', '\n')))
    text = text.replace('\r\n', '\n')
    chapters = {}
    for i, h in enumerate(headers):
        chapter = int(h[1])
        if chapter in chapters:
            raise ValueError(f'duplicate chapter {chapter}')
        body = text[h.end():headers[i+1].start() if i+1 < len(headers) else len(text)]
        verses = {}
        for line in body.splitlines():
            match = VERSE.match(line.strip())
            if not match:
                continue
            verse, value = int(match[1]), match[2].strip()
            if verse < 1 or verse in verses:
                raise ValueError(f'duplicate/invalid verse {chapter}:{verse}')
            verses[verse] = value
        if not verses:
            raise ValueError(f'empty chapter {chapter}')
        chapters[chapter] = (body.strip(), verses)
    if expected_chapters and sorted(chapters) != list(range(1, expected_chapters+1)):
        raise ValueError('missing or unexpected chapter headings')
    if not chapters:
        raise ValueError('no chapter headings')
    return chapters


def merged_passages(body, start, end):
    """Preserve combined labels rather than pretending to split their wording."""
    result=[]
    for line in body.splitlines():
        m=re.match(r'^(\d+)[–—-](\d+)\s+(.+)$',line.strip())
        if m and int(m[1])<=end and int(m[2])>=start:
            result.append((f'{m[1]}-{m[2]}',m[3],set(range(int(m[1]),int(m[2])+1))))
    return result


def private_path(path):
    path = Path(path).expanduser().resolve()
    if path == REPO or REPO in path.parents:
        raise ValueError('Private sources and databases must stay outside the checkout')
    return path


def books():
    output = subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./js/core/bible.js").BOOKS))'], cwd=REPO)
    return json.loads(output)


def import_files(manifest, destination):
    destination = private_path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(destination.parent, 0o700)
    sources = destination.parent / 'sources'
    sources.mkdir(exist_ok=True, mode=0o700)
    os.chmod(sources, 0o700)
    metadata = {b['code']: b for b in books()}
    rows = json.loads(Path(manifest).read_text())
    if len(rows) != 132:
        raise ValueError(f'Expected 132 uploads, found {len(rows)}')
    pending = destination.with_suffix('.pending.sqlite3')
    if pending.exists():
        raise ValueError('An unfinished private import already exists')
    db = sqlite3.connect(pending)
    os.chmod(pending, 0o600)
    try:
        db.executescript('''
        CREATE TABLE sources(edition TEXT, code TEXT, name TEXT, filename TEXT, sha256 TEXT, bytes INTEGER, PRIMARY KEY(edition,code));
        CREATE TABLE chapters(edition TEXT, code TEXT, chapter INTEGER, body TEXT, PRIMARY KEY(edition,code,chapter));
        CREATE TABLE verses(edition TEXT, code TEXT, chapter INTEGER, verse INTEGER, text TEXT, PRIMARY KEY(edition,code,chapter,verse));
        CREATE VIRTUAL TABLE verse_search USING fts5(text,edition UNINDEXED,code UNINDEXED,chapter UNINDEXED,verse UNINDEXED,tokenize='unicode61');
        ''')
        for entry in rows:
            source = private_path(entry['result']['path'])
            match = re.fullmatch(r'(개역개정|쉬운성경)_([a-z0-9]+)_(.+)\.md', source.name)
            if not match or match[2] not in metadata:
                raise ValueError(f'Unexpected source name: {source.name}')
            edition, code = ('gae' if match[1] == '개역개정' else 'easy'), match[2]
            raw = source.read_bytes()
            parsed = parse_book(raw.decode('utf-8-sig'), metadata[code]['chapters'])
            db.execute('INSERT INTO sources VALUES(?,?,?,?,?,?)', (edition, code, metadata[code]['name'], source.name, hashlib.sha256(raw).hexdigest(), len(raw)))
            for chapter, (body, verses) in parsed.items():
                db.execute('INSERT INTO chapters VALUES(?,?,?,?)', (edition, code, chapter, body))
                for verse, value in verses.items():
                    db.execute('INSERT INTO verses VALUES(?,?,?,?,?)', (edition, code, chapter, verse, value))
                    db.execute('INSERT INTO verse_search VALUES(?,?,?,?,?)', (value, edition, code, chapter, verse))
            os.chmod(source, 0o600)
            target = sources / source.name
            shutil.copyfile(source, target)
            os.chmod(target, 0o600)
        counts = dict(db.execute('SELECT edition,COUNT(*) FROM chapters GROUP BY edition'))
        if counts != {'easy': 1189, 'gae': 1189}:
            raise ValueError(f'Incomplete chapter coverage: {counts}')
        # Neither edition's verse omissions are silently manufactured or padded.
        mismatches = db.execute('''SELECT code,chapter,verse FROM verses GROUP BY code,chapter,verse HAVING COUNT(*)!=2''').fetchall()
        db.commit()
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Private database integrity failure')
        result = {'files': 132, 'chapters': counts, 'verses': dict(db.execute('SELECT edition,COUNT(*) FROM verses GROUP BY edition')), 'editionNumberingDifferences': len(mismatches), 'numberingGaps': sum(maximum-count for maximum,count in db.execute('SELECT MAX(verse),COUNT(*) FROM verses GROUP BY edition,code,chapter'))}
        db.close()
        if destination.exists():
            destination.replace(destination.with_suffix('.previous.sqlite3'))
        pending.replace(destination)
        report = destination.parent / 'import-report.json'
        report.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
        os.chmod(report, 0o600)
        print(json.dumps(result, ensure_ascii=False))
    except Exception:
        db.close()
        pending.unlink(missing_ok=True)
        raise


def commentary(code, chapter, start, end, max_chars, path):
    path = private_path(path)
    if not path.exists():
        return '[비공개 호크마 DB 없음]'
    with sqlite3.connect(path.as_uri()+'?mode=ro', uri=True) as db:
        row = db.execute('SELECT body FROM chapters WHERE code=? AND chapter=?', (code, chapter)).fetchone()
    if not row:
        return '[해당 장 주석 없음]'
    sections = re.split(r'(?=^###\s)', row[0], flags=re.M)
    selected = []
    for section in sections:
        title = section.split('\n', 1)[0]
        match = re.search(r'(?:\d+:)?(\d+)\s*[~–\-]\s*(\d+)|(?:\d+:)?(\d+)\s*(?:절|\()', title)
        if match:
            a, b = (int(match[1]), int(match[2])) if match[1] else (int(match[3]), int(match[3]))
            if b >= start and a <= end:
                selected.append(section.strip())
    text = '\n\n'.join(selected) if selected else sections[0].strip()
    return text[:max_chars]+('\n[주석 발췌 길이 제한: 범위를 나누어 추가 조회]' if len(text)>max_chars else '')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', default=os.environ.get('PRIVATE_BIBLE_DB', str(DEFAULT_DB)))
    sub = parser.add_subparsers(dest='command', required=True)
    load = sub.add_parser('import')
    load.add_argument('manifest')
    sub.add_parser('status')
    passage = sub.add_parser('passage')
    passage.add_argument('code')
    passage.add_argument('chapter', type=int)
    passage.add_argument('start', type=int)
    passage.add_argument('end', nargs='?', type=int)
    passage.add_argument('--edition', choices=['both', 'gae', 'easy'], default='both')
    passage.add_argument('--commentary', action='store_true')
    passage.add_argument('--commentary-chars', type=int, default=1000)
    search = sub.add_parser('search')
    search.add_argument('term')
    search.add_argument('--code')
    search.add_argument('--edition', choices=['both', 'gae', 'easy'], default='gae')
    search.add_argument('--limit', type=int, default=8)
    args = parser.parse_args()
    if args.command == 'import':
        import_files(args.manifest, args.db)
        return
    path = private_path(args.db)
    if not path.exists():
        parser.error('Private DB unavailable; import the uploads in this environment first')
    with sqlite3.connect(path.as_uri()+'?mode=ro', uri=True) as db:
        if args.command == 'status':
            for edition in EDITIONS:
                print(EDITIONS[edition], dict(zip(['books', 'chapters', 'verses'], [db.execute('SELECT COUNT(*) FROM sources WHERE edition=?', (edition,)).fetchone()[0], db.execute('SELECT COUNT(*) FROM chapters WHERE edition=?', (edition,)).fetchone()[0], db.execute('SELECT COUNT(*) FROM verses WHERE edition=?', (edition,)).fetchone()[0]])))
            print('integrity:', db.execute('PRAGMA integrity_check').fetchone()[0])
        elif args.command == 'passage':
            end = args.end or args.start
            if args.start < 1 or end < args.start or end-args.start > 99:
                parser.error('Query 1–100 verses at a time')
            for edition in (EDITIONS if args.edition == 'both' else [args.edition]):
                rows = db.execute('SELECT verse,text FROM verses WHERE edition=? AND code=? AND chapter=? AND verse BETWEEN ? AND ? ORDER BY verse', (edition, args.code, args.chapter, args.start, end)).fetchall()
                body=db.execute('SELECT body FROM chapters WHERE edition=? AND code=? AND chapter=?',(edition,args.code,args.chapter)).fetchone()
                combined=merged_passages(body[0] if body else '',args.start,end)
                covered={r[0] for r in rows}|{v for _,_,vs in combined for v in vs}
                rows=sorted([*rows,*[(label,text) for label,text,_ in combined]],key=lambda r:int(str(r[0]).split('-')[0]))
                missing = sorted(set(range(args.start, end+1)) - covered)
                if missing:
                    print(f'[{EDITIONS[edition]} 원자료에 해당 절 번호 없음: '+', '.join(map(str, missing))+']')
                print(f'[{EDITIONS[edition]}] {args.code} {args.chapter}:{args.start}–{end}')
                for verse, text in rows:
                    print(verse, text)
            if args.commentary:
                print('[호크마 업로드 참고 정리 · 직접 출판 원문이 아님]')
                print(commentary(args.code, args.chapter, args.start, end, max(100, min(args.commentary_chars, 4000)), os.environ.get('HOKMA_DB', '/workspace/private-reference/hokma/hokma.sqlite3')))
        elif args.command == 'search':
            if not args.term.strip() or len(args.term)>100:
                parser.error('A nonempty search term up to 100 characters is required')
            term = args.term.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
            clauses, params = ["text LIKE ? ESCAPE '\\'"], ['%'+term+'%']
            if args.edition != 'both':
                clauses.append('edition=?'); params.append(args.edition)
            if args.code:
                clauses.append('code=?'); params.append(args.code)
            params.append(max(1, min(args.limit, 30)))
            shown=0
            for edition, code, chapter, verse, text in db.execute('SELECT edition,code,chapter,verse,text FROM verses WHERE '+' AND '.join(clauses)+' ORDER BY code,chapter,verse LIMIT ?', params):
                print(f'[{EDITIONS[edition]}] {code} {chapter}:{verse} {text}');shown+=1
            if shown<params[-1]:
                source_clauses=[clauses[0].replace('text LIKE','body LIKE')];source_params=['%'+term+'%']
                if args.edition!='both':source_clauses.append('edition=?');source_params.append(args.edition)
                if args.code:source_clauses.append('code=?');source_params.append(args.code)
                for edition,code,chapter,body in db.execute('SELECT edition,code,chapter,body FROM chapters WHERE '+' AND '.join(source_clauses),source_params):
                    for label,text,_ in merged_passages(body,1,200):
                        if args.term in text and shown<params[-1]:print(f'[{EDITIONS[edition]}] {code} {chapter}:{label} {text}');shown+=1


if __name__ == '__main__':
    main()
