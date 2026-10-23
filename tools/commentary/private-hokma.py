#!/usr/bin/env python3
"""Read private uploaded reference notes; never used by the public application."""
import argparse, os, sqlite3
from pathlib import Path
p = argparse.ArgumentParser()
p.add_argument('command', choices=['status', 'chapter'])
p.add_argument('code', nargs='?')
p.add_argument('chapter', nargs='?', type=int)
a = p.parse_args()
path = Path(os.environ.get('HOKMA_DB', '/workspace/private-reference/hokma/hokma.sqlite3'))
if not path.is_file():
    p.error('Private reference database is unavailable in this environment.')
with sqlite3.connect(path.as_uri() + '?mode=ro', uri=True) as db:
    if a.command == 'status':
        print(dict(zip(['books', 'files', 'bytes'], db.execute('SELECT COUNT(DISTINCT code), COUNT(*), SUM(byte_count) FROM sources').fetchone())))
        print('chapters:', db.execute('SELECT COUNT(*) FROM chapters').fetchone()[0])
    else:
        if not a.code or not a.chapter:
            p.error('chapter requires book code and chapter number')
        row = db.execute('SELECT body FROM chapters WHERE code=? AND chapter=?', (a.code, a.chapter)).fetchone()
        if not row: p.error('Chapter not found')
        print(row[0])
