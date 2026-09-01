#!/bin/bash
set -e
DEPLOY_ID="dpl_Ci5o4uw6oMeDaEK9Y9Y6YoqggdUx"
SCOPE="team_euXSRSzGJ8oYFT4y1124hubq"
OUT_DIR="/tmp/prod-source-recovered"
mkdir -p "$OUT_DIR"

node --eval "
const fs = require('fs');
const files = JSON.parse(fs.readFileSync('/tmp/file-list.json','utf8'));
fs.writeFileSync('/tmp/file-list.tsv', files.map(f => f.path + '\t' + f.uid).join('\n'));
"

count=0
total=$(wc -l < /tmp/file-list.tsv)
while IFS=$'\t' read -r path uid; do
  count=$((count+1))
  dest="$OUT_DIR$path"
  mkdir -p "$(dirname "$dest")"
  vercel api "/v7/deployments/$DEPLOY_ID/files/$uid" --scope "$SCOPE" --raw 2>/dev/null | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
process.stdout.write(Buffer.from(data.data, 'base64'));
" > "$dest"
  echo "[$count/$total] $path"
done < /tmp/file-list.tsv

echo "DONE"
