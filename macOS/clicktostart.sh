#!/usr/bin/env bash
# Launches a tiny local HTTP server in this folder and opens the quiz in your default browser.
# Browsers block fetch() on file:// URLs, so a local server is required.

# This script lives in atplwebquiz/macOS. Step up to the website folder.
cd "$(dirname "$0")/.." || exit 1

PORT=8000
URL="http://localhost:${PORT}/index.html"

echo "Starting ATPL Practice Quiz on ${URL} ..."
echo "Press Ctrl+C to stop the server when you're done."
echo

# Open the browser
if command -v xdg-open >/dev/null 2>&1; then
  (sleep 1 && xdg-open "${URL}") &
elif command -v open >/dev/null 2>&1; then
  (sleep 1 && open "${URL}") &
fi

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "${PORT}"
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server "${PORT}"
elif command -v ruby >/dev/null 2>&1; then
  exec ruby -run -e httpd . -p "${PORT}"
else
  echo "[!] Could not find Python or Ruby. Install Python from https://www.python.org/" >&2
  exit 1
fi
