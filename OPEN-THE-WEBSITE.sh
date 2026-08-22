#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Install Node.js LTS from https://nodejs.org then run this script again."
  exit 1
fi
npm run install:all
echo "Opening http://localhost:5173 — leave this terminal running."
(sleep 3 && (command -v xdg-open >/dev/null && xdg-open http://localhost:5173) || (command -v open >/dev/null && open http://localhost:5173) || true) &
npm run dev
