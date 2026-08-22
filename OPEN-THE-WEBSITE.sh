#!/usr/bin/env bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Install Node.js LTS from https://nodejs.org"
  echo "Or open ats.html in your browser for the demo page."
  exit 1
fi
npm install --prefix client
npm install || true
node server/index.js &
echo "Open http://localhost:5173  (leave this terminal running)"
sleep 2
(command -v xdg-open >/dev/null && xdg-open http://localhost:5173) || (command -v open >/dev/null && open http://localhost:5173) || true
npm run web
