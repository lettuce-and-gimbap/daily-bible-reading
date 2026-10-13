#!/bin/bash
# 사용: bash commit.sh "메시지"  — 전체 검사 오류가 0일 때만 커밋·푸시
cd "$(dirname "$0")/../.." || exit 1
if ! node tools/commentary/check.mjs > /tmp/check.out 2>&1; then grep "✗" /tmp/check.out; echo "오류가 있어 커밋하지 않음"; exit 1; fi
tail -1 /tmp/check.out
git add -A 2>/dev/null && git commit -q -m "$1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push -q origin main 2>&1 | tail -1; git log --oneline -1
