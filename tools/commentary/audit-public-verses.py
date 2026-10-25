#!/usr/bin/env python3
"""Compare every published verse label with canonical chapter metadata."""
import csv
from collections import defaultdict
import importlib.util
import json
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('private_scripture', ROOT / 'tools/commentary/private-scripture.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
EDITION_NAMES = {'gae': '개역개정4판', 'easy': '쉬운성경', 'niv': 'NIV',
                 'han': '개역한글', 'hyun': '현대인의성경', 'saenew': '새번역'}
OUT = ROOT / 'docs/scripture-verse-audit.csv'


def counts():
    source = (ROOT / 'js/core/versecounts.js').read_text()
    block = re.search(r'const VERSE_COUNTS = \[([^]]+)\]', source, re.S)
    result = [int(x) for x in re.findall(r'\d+', block[1])]
    books = module.books()
    chapters = [(b['code'], c) for b in books for c in range(1, b['chapters'] + 1)]
    if len(chapters) != len(result):
        raise ValueError('chapter metadata mismatch')
    return dict(zip(chapters, result))


def classify(body, verse, present):
    for line in body.splitlines():
        match = re.match(r'^\s*(\d+)\s*[-–~]\s*(\d+)\s+', line)
        if match and int(match[1]) <= verse <= int(match[2]):
            return '명시적 범위 병합', f'{match[1]}–{match[2]}', line[:100]
    for host in (verse - 1, verse + 1):
        if host not in present:
            continue
        for line in body.splitlines():
            if not re.match(rf'^\s*{host}\s+', line):
                continue
            if re.search(rf'(?<!\d){verse}(?=[(A-Za-z가-힣])', line[1:]):
                return '행 안 절표기 후보', str(host), line[:100]
    return '번호 누락·병합 미확인', '', ''


def main():
    limits = counts()
    rows = []
    summary = {}
    published_books = {}
    with sqlite3.connect('/workspace/private-reference/bible/scripture.sqlite3') as db:
        for edition, name in EDITION_NAMES.items():
            missing = duplicate = extra = 0
            classes = {}
            for (book, chapter), limit in limits.items():
                body = db.execute('SELECT body FROM chapters WHERE edition=? AND code=? AND chapter=?',
                                  (edition, book, chapter)).fetchone()[0]
                if book not in published_books:
                    published_books[book] = json.loads((ROOT / f'data/scripture/{book}.json').read_text())['editions']
                published = published_books[book][edition][chapter]
                numbers = [n for n, _ in published if isinstance(n, int)]
                present = set(numbers)
                duplicate += len(numbers) - len(present)
                for verse in sorted(present - set(range(1, limit + 1))):
                    extra += 1
                    rows.append([name, book, chapter, verse, '기준 범위 밖 번호', '', ''])
                for verse in sorted(set(range(1, limit + 1)) - present):
                    missing += 1
                    kind, host, evidence = classify(body, verse, present)
                    classes[kind] = classes.get(kind, 0) + 1
                    rows.append([name, book, chapter, verse, kind, host, evidence])
            summary[name] = {'missingLabels': missing, 'duplicateLabels': duplicate,
                             'extraLabels': extra, 'categories': classes}
    with OUT.open('w', newline='') as stream:
        writer = csv.writer(stream)
        writer.writerow(['역본', '권 코드', '장', '절', '판정', '합쳐진 행', '원본 확인 단서'])
        writer.writerows(rows)
    (ROOT / 'docs/scripture-verse-audit-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    book_names = {b['code']: b['name'] for b in module.books()}
    lines = ['# 여섯 역본 절 번호 전수 대조', '',
             '기준: 앱의 66권·1,189장 절 수 목록. 아래는 원문과 공개 DB를 대조한 **절 번호** 결과다. 한 행에 병합된 원문을 임의로 절단하지 않았다.', '',
             '| 역본 | 명시적 범위 병합 절 | 행 안 절표기 후보 | 병합 여부 미확인 | 기준 밖 번호 | DB 중복 번호 |',
             '|---|---:|---:|---:|---:|---:|']
    for name, info in summary.items():
        classes = info['categories']
        lines.append(f"| {name} | {classes.get('명시적 범위 병합',0)} | {classes.get('행 안 절표기 후보',0)} | {classes.get('번호 누락·병합 미확인',0)} | {info['extraLabels']} | {info['duplicateLabels']} |")
    lines += ['', '절별 원본 단서는 [전체 대조 CSV](scripture-verse-audit.csv)에 있다. `→` 오른쪽은 빠진 절의 내용이 들어 있을 **가능성이 있는 행**이다. 행 안 후보는 숫자가 실제 절 표기인지 검토가 필요하다.', '']
    for kind in ('명시적 범위 병합', '행 안 절표기 후보', '번호 누락·병합 미확인', '기준 범위 밖 번호'):
        lines += [f'## {kind}', '']
        by_chapter = defaultdict(list)
        for name, book, chapter, verse, category, host, evidence in rows:
            if category == kind:
                by_chapter[(name, book, chapter)].append(f'{verse}절' + (f'→{host}' if host else ''))
        if not by_chapter:
            lines += ['해당 없음.', '']
        else:
            for (name, book, chapter), verses in by_chapter.items():
                lines.append(f"- {name} {book_names[book]} {chapter}장: {', '.join(verses)}")
            lines.append('')
    (ROOT / 'docs/merged-verse-review.md').write_text('\n'.join(lines))
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__':
    main()
