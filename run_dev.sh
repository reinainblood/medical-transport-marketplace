// run_dev.sh
#!/bin/bash

# Check if Redis is running
redis-cli ping > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Error: Redis is not running. Please start Redis first."
    exit 1
fi

# Install dependencies if needed
echo "Installing dependencies..."
cd frontend && npm install
echo "Building TypeScript..."
npm run type-check
cd ../backend && npm install
npm run type-check

# Start backend server
echo "Starting backend server..."
cd ../backend
npm run dev &
BACKEND_PID=$!

# Start frontend dev server
echo "Starting frontend dev server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Handle cleanup on script termination
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait