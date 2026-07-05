#!/usr/bin/env bash
# macOS double-click launcher for the ATPL Air Law Quiz.
# Starts a local web server in this folder and opens the quiz.

# This script lives in atplwebquiz/macOS. Step up to the website folder.
cd "$(dirname "$0")/.." || exit 1

PORT=8000
URL="http://localhost:${PORT}/index.html"

echo "Starting ATPL Practice Quiz on ${URL} ..."
echo "Keep this Terminal window open while using the quiz."
echo "Close this window, or press Ctrl+C, to stop the local server."
echo

(sleep 1 && open "${URL}") &

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "${PORT}"
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server "${PORT}"
elif command -v ruby >/dev/null 2>&1; then
  exec ruby -run -e httpd . -p "${PORT}"
else
  echo "[!] Could not find Python or Ruby on this Mac."
  echo "    Install Python from https://www.python.org/downloads/"
  echo "    Then double-click this file again."
  echo
  read -r -p "Press Enter to close this window..."
fi
