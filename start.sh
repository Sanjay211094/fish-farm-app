#!/bin/bash
# Starts both backend and frontend in parallel

BASE="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Fish Farm Manager..."

# Backend
(cd "$BASE/backend" && node src/server.js) &
BACK=$!

# Frontend
(cd "$BASE/frontend" && npm run dev) &
FRONT=$!

echo "Backend PID: $BACK  →  http://localhost:5000"
echo "Frontend PID: $FRONT →  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACK $FRONT 2>/dev/null; exit" INT TERM
wait
