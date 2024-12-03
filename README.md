## POC for basic medical driver call marketplace/dashboard

A real-time marketplace for medical transport drivers, built with React, TypeScript, Redis, and WebSocket.

## Prerequisites

- Node.js (v16 or higher)
- Redis (v6 or higher)
- npm or yarn

## Local Development Setup

1. Install Redis:
```bash
# On macOS using Homebrew
brew install redis
brew services start redis

# On Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

2. Clone the repository:
```bash
git clone <your-repo-url>
cd medical-transport-marketplace
```

3. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

4. Configure environment variables:
```bash
# frontend/.env
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001

# backend/.env
PORT=3001
CORS_ORIGIN=http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
```

5. Start the development servers:
```bash
# Start both servers using the provided script
./run_dev.sh

# Or start them separately:
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. Open http://localhost:5173 in your browser

## Features

- Real-time transport request updates
- Driver dashboard with live metrics
- Wheelchair accessibility tracking
- Smart request matching
- Driver performance tracking
- Auto-generated demo data

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS, Vite
- Backend: Node.js, Express, WebSocket
- Database: Redis
- Real-time: WebSocket for live updates