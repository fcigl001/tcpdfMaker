#!/bin/bash

# Start the PHP server for the PDF generator API
echo "Starting PHP server on http://localhost:8000"
echo "API endpoint: http://localhost:8000/api.php"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd frontend
php -S localhost:8000
