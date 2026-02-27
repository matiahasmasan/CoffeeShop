# CoffeeShop Backend

Simple Node.js/Express backend for the CoffeeShop application.

## Setup

1. Open a terminal in the `backend` folder:
   - `cd backend`
2. Install dependencies:
   - `npm install`

## Running the server

- Development (with auto-reload using nodemon):
  - `npm run dev`
- Production:
  - `npm start`

By default the server listens on port `5000`, or the value in the `PORT` environment variable if set.

You can verify it is running by opening:

- `http://localhost:5000/api/health`

It should return a small JSON payload confirming the backend is up.

