#!/bin/bash

echo "🚀 Starting Nutrition App Backend Server..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found. Please run this script from the project root."
    exit 1
fi

# Set environment variables
export NODE_ENV=development
export PORT=3000

echo "📋 Configuration:"
echo "   Environment: $NODE_ENV"
echo "   Port: $PORT"
echo "   API Endpoint: http://localhost:$PORT/api"
echo "   tRPC Endpoint: http://localhost:$PORT/api/trpc"
echo ""

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port $PORT is already in use!"
    echo "   You can:"
    echo "   1. Kill the existing process: kill -9 \$(lsof -ti:$PORT)"
    echo "   2. Use a different port: PORT=3001 ./start-backend.sh"
    echo ""
    read -p "Do you want to kill the existing process? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Killing existing process on port $PORT..."
        kill -9 $(lsof -ti:$PORT) 2>/dev/null || true
        sleep 2
    else
        echo "❌ Exiting. Please free up port $PORT or use a different port."
        exit 1
    fi
fi

echo "🔄 Starting server..."
echo "   Press Ctrl+C to stop the server"
echo "   Server logs will appear below:"
echo "=================================="

# Start the server
node server.js