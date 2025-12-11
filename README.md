# Kochi Home - Simple Home Page Website

A simple Node.js website that displays linktree data by fetching from the restaurant backend API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables (optional):
```bash
PORT=3001                    # Port for this server (default: 3001)
API_BASE_URL=http://localhost:3000  # Backend API URL (default: http://localhost:3000)
```

3. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Usage

- Visit `http://localhost:3001` to see the home page
- Enter a BIS number (e.g., `BIS00001`) to view a link tree
- Or visit directly: `http://localhost:3001/?BIS=BIS00001`

## Features

- Simple, clean home page
- Search by BIS number
- Fetches and displays linktree data from the backend API
- Error handling for missing or invalid BIS numbers
