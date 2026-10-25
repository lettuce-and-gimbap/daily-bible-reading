#!/usr/bin/env python3
"""Build the user-authorized public, per-book scripture database assets."""
import importlib.util
import json
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('private_scripture', ROOT / 'tools/commentary/private-scripture.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
EDITIONS = ('gae', 'easy', 'niv', 'han', 'hyun', 'saenew')
OUT = ROOT / 'data/scripture'


def main():
    OUT.mkdir(exist_ok=True)
    books = module.books()
    with sqlite3.connect('/workspace/private-reference/bible/scripture.sqlite3') as db:
        for edition in EDITIONS:
            if db.execute('SELECT COUNT(*) FROM sources WHERE edition=?', (edition,)).fetchone()[0] != 66:
                raise ValueError(f'{edition}: 66 books required')
            if db.execute('SELECT COUNT(*) FROM chapters WHERE edition=?', (edition,)).fetchone()[0] != 1189:
                raise ValueError(f'{edition}: 1189 chapters required')
        for book in books:
            code = book['code']
            editions = {}
            for edition in EDITIONS:
                chapters = [None]
                for chapter in range(1, book['chapters'] + 1):
                    verses = db.execute('SELECT verse,text FROM verses WHERE edition=? AND code=? AND chapter=? ORDER BY verse',
                                        (edition, code, chapter)).fetchall()
                    if not verses:
                        raise ValueError(f'{edition}/{code}/{chapter}: empty')
                    chapters.append(verses)
                editions[edition] = chapters
            (OUT / f'{code}.json').write_text(json.dumps({'code': code, 'editions': editions}, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'Exported {len(books)} books × {len(EDITIONS)} editions')


if __name__ == '__main__':
    main()
