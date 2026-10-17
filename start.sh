#!/bin/bash
echo "==================================================="
echo "Starting Digital Governance License System"
echo "==================================================="

PROJECT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"

echo ""
echo "[1/2] Starting Backend Server..."
(cd "$PROJECT_DIR/backend" && npm run start:dev) &
BACKEND_PID=$!

echo ""
echo "Waiting for backend to initialize..."
sleep 5

echo ""
echo "[2/2] Opening Portals..."

# Detect OS for the open command
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OPEN_CMD="xdg-open"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OPEN_CMD="open"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OPEN_CMD="start"
else
    OPEN_CMD="xdg-open"
fi

$OPEN_CMD "$PROJECT_DIR/frontend/applicant_connected/connected/login/index.html"
$OPEN_CMD "$PROJECT_DIR/frontend/platform_admin/login/index.html"
$OPEN_CMD http://localhost:3000/api/docs

echo ""
echo "==================================================="
echo "✅ TradeZo System is running!"
echo "Press Ctrl+C to stop the backend server."
echo "==================================================="

wait $BACKEND_PID
