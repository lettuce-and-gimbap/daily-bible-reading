#!/usr/bin/env python3
"""Import the three user-uploaded editions into the local scripture DB.

Original Markdown stays outside the checkout. The three known repeated labels
are corrected only in the verse index; the source files remain untouched.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil
import sqlite3

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('private_scripture', ROOT / 'tools/commentary/private-scripture.py')
scripture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scripture)
DB = Path('/workspace/private-reference/bible/scripture.sqlite3')
UPLOADS = Path('/workspace/attachments')
SOURCES = DB.parent / 'sources'
EDITIONS = {'개역한글': 'han', '현대인의성경': 'hyun', '새번역': 'saenew'}
CORRECTIONS = {('hyun', 'rut', 2, 22, 2): 23,
               ('hyun', 'lev', 20, 3, 2): None,
               ('hyun', 'jer', 49, 2, 2): None}
HEADER = scripture.HEADER
VERSE = scripture.VERSE


def parse(text, edition, code, expected_chapters):
    text = text.replace('\r\n', '\n')
    headings = list(HEADER.finditer(text))
    if [int(h[1]) for h in headings] != list(range(1, expected_chapters + 1)):
        raise ValueError(f'{edition}/{code}: chapter coverage mismatch')
    result, used_corrections = {}, set()
    for i, h in enumerate(headings):
        chapter = int(h[1])
        body = text[h.end():headings[i + 1].start() if i + 1 < len(headings) else len(text)]
        verses, occurrences = {}, {}
        for line in body.splitlines():
            match = VERSE.match(line.strip())
            if not match:
                continue
            label = int(match[1])
            occurrences[label] = occurrences.get(label, 0) + 1
            key = (edition, code, chapter, label, occurrences[label])
            verse = CORRECTIONS.get(key, label)
            if key in CORRECTIONS:
                used_corrections.add(key)
            if verse is None:
                continue
            if verse < 1 or verse in verses:
                raise ValueError(f'{edition}/{code} {chapter}:{label} duplicate or invalid')
            verses[verse] = match[2].strip()
        if not verses:
            raise ValueError(f'{edition}/{code} chapter {chapter} empty')
        result[chapter] = (body.strip(), verses)
    return result, used_corrections


def main():
    metadata = {book['code']: book for book in scripture.books()}
    collected, corrections = {}, set()
    for prefix, edition in EDITIONS.items():
        files = list(UPLOADS.glob(f'*/{prefix}_*.md'))
        by_book = {}
        for path in files:
            match = re.fullmatch(rf'{prefix}_(\d+)_([a-z0-9]+)_(.+)\.md', path.name)
            if not match or match[2] not in metadata:
                raise ValueError(f'unexpected file: {path.name}')
            code = match[2]
            if code in by_book:
                if hashlib.sha256(by_book[code].read_bytes()).digest() != hashlib.sha256(path.read_bytes()).digest():
                    raise ValueError(f'conflicting uploads: {edition}/{code}')
                continue
            by_book[code] = path
        if set(by_book) != set(metadata):
            raise ValueError(f'{edition} missing {sorted(set(metadata)-set(by_book))}')
        for code, path in by_book.items():
            raw = path.read_bytes()
            chapters, corrected = parse(raw.decode('utf-8-sig'), edition, code, metadata[code]['chapters'])
            corrections.update(corrected)
            collected[edition, code] = (path, raw, chapters)
    if corrections != set(CORRECTIONS):
        raise ValueError(f'expected label corrections changed: {set(CORRECTIONS)-corrections}')

    backup = DB.with_suffix('.before-added-editions.sqlite3')
    if not backup.exists():
        with sqlite3.connect(DB) as original, sqlite3.connect(backup) as copy:
            original.backup(copy)
        backup.chmod(0o600)
    with sqlite3.connect(DB) as db:
        existing = {row[0] for row in db.execute('SELECT DISTINCT edition FROM sources')}
        if existing & set(EDITIONS.values()):
            raise ValueError(f'editions already in DB: {existing & set(EDITIONS.values())}')
        for (edition, code), (path, raw, chapters) in collected.items():
            db.execute('INSERT INTO sources VALUES(?,?,?,?,?,?)',
                       (edition, code, metadata[code]['name'], path.name, hashlib.sha256(raw).hexdigest(), len(raw)))
            for chapter, (body, verses) in chapters.items():
                db.execute('INSERT INTO chapters VALUES(?,?,?,?)', (edition, code, chapter, body))
                for verse, value in verses.items():
                    db.execute('INSERT INTO verses VALUES(?,?,?,?,?)', (edition, code, chapter, verse, value))
                    db.execute('INSERT INTO verse_search VALUES(?,?,?,?,?)', (value, edition, code, chapter, verse))
        for edition in EDITIONS.values():
            if db.execute('SELECT COUNT(*) FROM sources WHERE edition=?', (edition,)).fetchone()[0] != 66:
                raise ValueError(f'{edition}: book count')
            if db.execute('SELECT COUNT(*) FROM chapters WHERE edition=?', (edition,)).fetchone()[0] != 1189:
                raise ValueError(f'{edition}: chapter count')
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('SQLite integrity check failed')
    DB.chmod(0o600)
    SOURCES.mkdir(mode=0o700, exist_ok=True)
    for (_, _), (path, raw, _) in collected.items():
        target = SOURCES / path.name
        if target.exists() and hashlib.sha256(target.read_bytes()).digest() != hashlib.sha256(raw).digest():
            raise ValueError(f'conflicting archive: {target.name}')
        if not target.exists():
            shutil.copyfile(path, target)
        target.chmod(0o600)
    with sqlite3.connect(DB) as db:
        print(json.dumps({'books': dict(db.execute('SELECT edition,COUNT(*) FROM sources GROUP BY edition')),
                          'chapters': dict(db.execute('SELECT edition,COUNT(*) FROM chapters GROUP BY edition')),
                          'verses': dict(db.execute('SELECT edition,COUNT(*) FROM verses GROUP BY edition')),
                          'correctedLabels': len(corrections)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
