#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
source_dir="/workspace/private-reference/bible/kv-books"
mapfile -t files < <(find "$source_dir" -maxdepth 1 -type f -name '*.json' | sort)
if [[ ${#files[@]} -ne 66 ]]; then
  echo "Expected 66 private scripture books, found ${#files[@]}" >&2
  exit 1
fi
if [[ ${1:-} == --check ]]; then
  echo "Ready: ${#files[@]} private book files"
  exit 0
fi
cd "$repo_root/worker"
for path in "${files[@]}"; do
  book="$(basename "$path" .json)"
  npm_config_cache=/tmp/codex-wrangler-cache npx --yes wrangler kv key put "scripture:v1:$book" --binding SUBS --path "$path" --remote
done
