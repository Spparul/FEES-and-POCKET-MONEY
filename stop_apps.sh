#!/bin/bash
echo "Stopping Dhanapal apps..."

if [ -f "/Users/selestineparul/Dhanapal/.fees_backend.pid" ]; then
    kill $(cat /Users/selestineparul/Dhanapal/.fees_backend.pid) 2>/dev/null
    rm -f /Users/selestineparul/Dhanapal/.fees_backend.pid
    echo "School Fees stopped."
fi

if [ -f "/Users/selestineparul/Dhanapal/.pocket_backend.pid" ]; then
    kill $(cat /Users/selestineparul/Dhanapal/.pocket_backend.pid) 2>/dev/null
    rm -f /Users/selestineparul/Dhanapal/.pocket_backend.pid
    echo "Pocket Money stopped."
fi

lsof -ti:8000 2>/dev/null | xargs kill 2>/dev/null
lsof -ti:8001 2>/dev/null | xargs kill 2>/dev/null

echo "All apps stopped."
