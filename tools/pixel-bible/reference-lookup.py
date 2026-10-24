"""Retrieve locally collected external pixel-art reference notes (not model training)."""
import argparse,sqlite3,pathlib,json
p=argparse.ArgumentParser();p.add_argument('query');p.add_argument('--db',default='/workspace/pixel-art-research/references.sqlite3');a=p.parse_args()
if not pathlib.Path(a.db).exists():p.error('Reference DB is not available in this environment; restore the local research folder.')
c=sqlite3.connect(a.db);c.row_factory=sqlite3.Row
query=' OR '.join('"'+v.replace('"','""')+'"' for v in a.query.split())
print(json.dumps([dict(r) for r in c.execute('SELECT * FROM references_fts WHERE references_fts MATCH ? LIMIT 8',(query,))],ensure_ascii=False,indent=2))
