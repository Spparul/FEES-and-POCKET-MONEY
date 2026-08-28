#!/bin/bash

echo "=========================================================="
echo " CANISIUS SECONDARY SCHOOL - DUAL SYSTEM LAUNCHER"
echo "=========================================================="
echo "Starting Backend Servers & Cloudflare Tunnels..."
echo ""

# Dir path
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start School Fee Backend (Port 8000)
cd "$DIR/backend"
../venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --reload > "$DIR/backend.log" 2>&1 &
PID1=$!
echo "✅ School Fee Backend started on port 8000 (PID: $PID1)"

# Start Pocket Money Backend (Port 8001)
cd "$DIR/pocket_money_system/backend"
/Library/Frameworks/Python.framework/Versions/3.11/bin/uvicorn main:app --host 127.0.0.1 --port 8001 --reload > "$DIR/pocket_backend.log" 2>&1 &
PID2=$!
echo "✅ Pocket Money Backend started on port 8001 (PID: $PID2)"

# Start Cloudflare Tunnel for Backend
cloudflared tunnel --url http://127.0.0.1:8000 > "$DIR/tunnel_8000.log" 2>&1 &
PID3=$!
echo "✅ Cloudflare Tunnel started for School Fee Backend (PID: $PID3)"

cloudflared tunnel --url http://127.0.0.1:8001 > "$DIR/tunnel_8001.log" 2>&1 &
PID4=$!
echo "✅ Cloudflare Tunnel started for Pocket Money Backend (PID: $PID4)"

echo ""
echo "=========================================================="
echo " All servers are running in the background!"
echo " SQLite Database: 100% Persistent on your local computer."
echo " Press Ctrl+C anytime to stop."
echo "=========================================================="

wait $PID1 $PID2 $PID3 $PID4
