#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Install Node.js LTS (22.13+) from https://nodejs.org then run this script again."
  exit 1
fi
node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a>22||(a===22&&b>=13)?0:1)" \
  || { echo "Node 22.13 or newer is required (Node 24 LTS recommended)."; exit 1; }
npm install --no-audit --no-fund
npm install --prefix client --no-audit --no-fund
npm run build
echo "Meridian ATS: http://localhost:5173  (Ctrl+C to stop)"
(sleep 2 && (command -v xdg-open >/dev/null && xdg-open http://localhost:5173 || command -v open >/dev/null && open http://localhost:5173) || true) >/dev/null 2>&1 &
PORT=5173 node server/index.js
