#!/usr/bin/env python3
"""Create deterministic, reviewable batches for the full summary-relation audit.

Usage:
  python3 tools/pixel-bible/audit-relations.py
  python3 tools/pixel-bible/audit-relations.py --batch 1

The generated TSV is an audit worksheet, not source data. It keeps every
relation's book/chapter, endpoints, direction, label, verse range and note.
"""
import argparse
import csv
import glob
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "relation-audit"
BATCH_SIZE = 250
FIELDS = ("id", "book", "chapter", "from", "label", "to", "kind",
          "directed", "verses", "note")


def collect():
    rows = []
    for filename in sorted(glob.glob(str(ROOT / "data/summary/*.json"))):
        path = Path(filename)
        data = json.loads(path.read_text(encoding="utf-8"))
        book = data.get("book", path.stem)
        for chapter, body in sorted(data.get("chapters", {}).items(),
                                    key=lambda item: int(item[0])):
            for index, relation in enumerate(body.get("rels", [])):
                row = {key: relation.get(key, "") for key in FIELDS[3:]}
                row.update(id=f"{book}.{chapter}.{index}", book=book,
                           chapter=chapter)
                rows.append(row)
    return rows


def write_tsv(path, rows):
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=FIELDS, delimiter="\t",
                                lineterminator="\n", quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int, help="write only this 1-based batch")
    args = parser.parse_args()
    rows = collect()
    OUT.mkdir(parents=True, exist_ok=True)
    batches = [rows[i:i + BATCH_SIZE] for i in range(0, len(rows), BATCH_SIZE)]
    if args.batch:
        if not 1 <= args.batch <= len(batches):
            parser.error(f"batch must be 1..{len(batches)}")
        selected = [(args.batch, batches[args.batch - 1])]
    else:
        selected = list(enumerate(batches, 1))
    for number, batch in selected:
        write_tsv(OUT / f"batch-{number:02}.tsv", batch)
    summary = {
        "relations": len(rows), "distinct_labels": len({r["label"] for r in rows}),
        "batches": len(batches), "batch_size": BATCH_SIZE,
        "missing_fields": [r["id"] for r in rows if not all(r[k] for k in ("from", "to", "label"))],
        "self_links": [r["id"] for r in rows if r["from"] == r["to"]],
        "undirected_by_kind": {},
    }
    for row in rows:
        if row["directed"] is not True:
            key = row["kind"] or "other"
            summary["undirected_by_kind"][key] = summary["undirected_by_kind"].get(key, 0) + 1
    (OUT / "manifest.json").write_text(json.dumps(summary, ensure_ascii=False,
                                                   indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
