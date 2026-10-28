#!/usr/bin/env python3
"""Convert Korean quantity words in Pixel Bible prose, leaving scripture sources untouched."""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIGITS = dict(zip("일이삼사오육칠팔구", range(1, 10)))
SINO = r"(?:(?:[일이삼사오육칠팔구]?(?:십|백|천|만|억))+(?:[일이삼사오육칠팔구])?|[일이삼사오육칠팔구])"
NATIVE = r"(?:스무|스물|서른|마흔|쉰|예순|일흔|여든|아흔)(?:한|두|세|네|다섯|여섯|일곱|여덟|아홉)?|열(?:한|두|세|네|다섯|여섯|일곱|여덟|아홉)?|첫|한|두|세|네|다섯|여섯|일곱|여덟|아홉"
NUMBER = rf"(?:{SINO}|{NATIVE})"
UNITS = set((
    "번째 개월 주일 시간 차례 군데 세대 학년 자루 그릇 끼니 걸음 주간 지파 족속 장면 사건 가지 곳 마리 명 원 번 월 년 일 개 장 절 권 편 주 달 초 세 분 회 척 대 채 잔 줄 발 병 갑 층 해 날 밤 쌍 팀 살 돌".split()
))
COUNTED_NOUNS = set("소식 제자 친구 사도 귀신 사람 병자 여인 왕 자녀 형제 천사 장로 사자 군사 아이 아들 딸 픽셀 역본 자 자들 선지자 백성 종 상징 목자 옷 시인 신 교회 용사 손 맹인 때 관".split())
UNITS = "|".join(sorted(UNITS | COUNTED_NOUNS, key=len, reverse=True))
TAIL = r"씩이나|이라도|이상|이하|에게|으로|에서|에는|이나|라도|에도|까지|부터|동안|만에|가량|마다|째|뒤|후|전|간|은|는|이|가|을|를|에|의|도|나|만|과|와|보다"
PATTERN = re.compile(rf"(?<![가-힣])(?P<number>{NUMBER}(?:\s+{NUMBER})*)\s+(?P<unit>{UNITS})(?P<tail>{TAIL})?(?![가-힣])")
NATIVE_VALUES = {"첫": 1, "한": 1, "두": 2, "세": 3, "네": 4, "다섯": 5, "여섯": 6, "일곱": 7, "여덟": 8, "아홉": 9, "열": 10, "스무": 20, "스물": 20, "서른": 30, "마흔": 40, "쉰": 50, "예순": 60, "일흔": 70, "여든": 80, "아흔": 90}
for tens, base in (("열", 10), ("스물", 20), ("서른", 30), ("마흔", 40), ("쉰", 50), ("예순", 60), ("일흔", 70), ("여든", 80), ("아흔", 90)):
    for word, value in (("한", 1), ("두", 2), ("세", 3), ("네", 4), ("다섯", 5), ("여섯", 6), ("일곱", 7), ("여덟", 8), ("아홉", 9)):
        NATIVE_VALUES[tens + word] = base + value


def sino_value(word):
    total = section = current = 0
    for char in word:
        if char in DIGITS:
            current = DIGITS[char]
        elif char in "십백천":
            section += (current or 1) * {"십": 10, "백": 100, "천": 1000}[char]
            current = 0
        elif char in "만억":
            section += current
            current = 0
            scale = {"만": 10_000, "억": 100_000_000}[char]
            total += (section or 1) * scale
            section = 0
    return total + section + current


def number_value(word):
    if word in NATIVE_VALUES:
        return NATIVE_VALUES[word]
    if re.fullmatch(SINO, word):
        return sino_value(word)
    return None


def convert_text(text):
    changes = 0

    def replace(match):
        nonlocal changes
        words = match["number"].split()
        unit = match["unit"]
        tail = match["tail"] or ""
        following = text[match.end():]
        temporal = tail in {"동안", "만에", "까지", "부터", "쯤", "째", "뒤", "후", "전", "간", "씩"} or bool(re.match(r"\s*(?:동안|간|째|뒤|후|전)\b", following))

        # Preserve lexical/deictic readings that are easily mistaken for counts.
        if unit == "일" and words == ["한"]:
            return match.group(0)  # "한 일" usually means an act/work; Korean uses "하루" for one day.
        if words == ["이"] and (unit in {"일", "장", "절", "권", "편", "주", "달", "년", "월", "곳", "세대", "사건", "장면", "가지", "지파", "족속"} or unit in COUNTED_NOUNS) and not temporal:
            return match.group(0)  # e.g. "이 일은", "이 장의 중심".
        if unit == "분" and words == ["한"] and not temporal:
            return match.group(0)  # honorific person counter, not one minute.
        if unit == "주" and (tail == "의" and re.match(r"\s*만찬", following) or re.match(r"의\s*만찬", following)):
            return match.group(0)  # "주의 만찬" means the Lord's Supper.
        if words == ["네"] and unit in COUNTED_NOUNS:
            return match.group(0)  # ambiguous possessive "your"; do not turn it into four.
        if unit == "일" and not temporal and tail:
            return match.group(0)

        values = [number_value(word) for word in words]
        if not values or any(value is None for value in values):
            return match.group(0)
        changes += 1
        separator = " " if unit in COUNTED_NOUNS else ""
        normalized_unit = "일" if unit == "날" else unit
        return f"{sum(values)}{separator}{normalized_unit}{tail}"

    return PATTERN.sub(replace, text), lambda: changes


def rewrite_json_strings(raw):
    replacements = []
    changes = 0
    i = 0
    while i < len(raw):
        if raw[i] != '"':
            i += 1
            continue
        start = i
        i += 1
        escaped = False
        while i < len(raw):
            char = raw[i]
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                break
            i += 1
        end = i + 1
        look = end
        while look < len(raw) and raw[look].isspace():
            look += 1
        if look < len(raw) and raw[look] == ":":  # JSON object key
            i = end
            continue
        value = json.loads(raw[start:end])
        if isinstance(value, str):
            converted, count = convert_text(value)
            n = count()
            if n:
                replacements.append((start, end, json.dumps(converted, ensure_ascii=False)))
                changes += n
        i = end
    for start, end, value in reversed(replacements):
        raw = raw[:start] + value + raw[end:]
    return raw, changes


def rewrite_source_strings(raw):
    replacements = []
    changes = 0
    i = 0
    while i < len(raw):
        if raw.startswith("//", i):
            newline = raw.find("\n", i + 2)
            i = len(raw) if newline < 0 else newline + 1
            continue
        if raw.startswith("/*", i):
            close = raw.find("*/", i + 2)
            i = len(raw) if close < 0 else close + 2
            continue
        if raw[i] not in "'\"`":
            i += 1
            continue
        quote = raw[i]
        start = i + 1
        i = start
        escaped = False
        while i < len(raw):
            char = raw[i]
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                break
            i += 1
        if i >= len(raw):
            break
        content = raw[start:i]
        converted, count = convert_text(content)
        n = count()
        if n:
            replacements.append((start, i, converted))
            changes += n
        i += 1
    for start, end, value in reversed(replacements):
        raw = raw[:start] + value + raw[end:]
    return raw, changes


def paths():
    for base in (ROOT / "data" / "summary", ROOT / "data" / "pixel-bible"):
        for path in sorted(base.rglob("*.json")):
            # Scripture source databases are private and never included in this sweep.
            if "scripture" not in path.parts:
                yield path
    # Person indexes and mention-only catalogs also repeat display labels from
    # event data; keep those labels in sync when a count is normalized.
    for path in sorted((ROOT / "js" / "features" / "pixel-bible").rglob("*.js")):
        yield path
    yield from sorted((ROOT / "tools" / "pixel-bible" / "verse-animation").glob("*.mjs"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="write the changes; otherwise print a dry-run summary")
    args = parser.parse_args()
    files = total = 0
    for path in paths():
        raw = path.read_text(encoding="utf-8")
        rewritten, count = rewrite_json_strings(raw) if path.suffix == ".json" else rewrite_source_strings(raw)
        if count:
            files += 1
            total += count
            print(f"{path.relative_to(ROOT)}: {count} numeral conversion(s)")
            if args.apply:
                path.write_text(rewritten, encoding="utf-8")
    print(f"{'Applied' if args.apply else 'Would apply'} {total} conversion(s) in {files} files")


if __name__ == "__main__":
    main()
