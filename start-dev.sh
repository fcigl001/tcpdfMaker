#!/bin/bash

echo "================================================"
echo "  PDF Layout Editor - Starting Development Env"
echo "================================================"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $PHP_PID 2>/dev/null
    kill $VITE_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start PHP server in background
echo "Starting PHP API server on http://localhost:8000"
cd frontend
php -S localhost:8000 > /dev/null 2>&1 &
PHP_PID=$!

# Wait a moment for PHP to start
sleep 1

# Check if PHP started successfully
if ! ps -p $PHP_PID > /dev/null; then
    echo "Error: Failed to start PHP server"
    exit 1
fi

echo "✓ PHP API running at http://localhost:8000/api.php"
echo ""
echo "Starting React frontend..."
echo ""

# Start Vite dev server (this runs in foreground)
npm run dev

# This shouldn't be reached unless Vite exits
cleanup
