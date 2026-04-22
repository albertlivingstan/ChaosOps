# ChaosOps

![ChaosOps Banner](https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop)

## Overview
ChaosOps is a powerful, modern platform for performing Chaos Engineering, uptime monitoring, and vulnerability analysis across your infrastructure endpoints. It provides an intuitive, high-performance deep-space-themed React frontend tightly integrated with an easily deployable SQLite-backed Node.js/Express server.

This project is tailored specifically for simple deployment to modern serverless platforms like **Vercel** with absolutely zero external database dependencies.

## Features
- **Zero-Configuration Backend**: Uses a serverless-friendly SQLite database via Sequelize. No MongoDB installations required.
- **Web Analyzer**: Scan websites instantly for vulnerabilities and missing security policies.
- **Chaos Injection**: Track and orchestrate system failures and resiliency monitoring.
- **Vercel Ready**: Out-of-the-box support for Vercel's Serverless Functions layer. The `/api` routes are securely intercepted and dynamically handled alongside the React application.

## Technologies Used
- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI Primitives, Framer Motion
- **Backend API**: Serverless Node.js, Express.js
- **Database**: SQLite (via Sequelize ORM)

---

## Deploying to Vercel (Recommended)

Because this repository consolidates the frontend and backend with a zero-config SQLite layer, deploying to Vercel is as easy as an import:

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to your [Vercel Dashboard](https://vercel.com/new).
3. Import your `ChaosOps` repository.
4. **Framework Preset**: Let Vercel auto-detect **Vite**.
5. **Build Command**: Leave default (`npm run build`).
6. **Output Directory**: Leave default (`dist`).
7. **Deploy!**

The provided `vercel.json` and `/api/index.js` bridge the Express.js application dynamically, automatically hosting your endpoints safely on Vercel's Serverless Edge. *Note: Data persistence across serverless cold starts relies on Vercel's ephemeral `/tmp` cache.*

---

## Running Locally

If you'd like to develop and test ChaosOps on your own workstation:

### 1. Install Dependencies
Run this in the root directory to install all required dependencies for both frontend and backend:
```bash
npm install
```

### 2. Start the Backend API Server
In a terminal, start the Express/SQLite process:
```bash
node backend/server.js
```
The console will confirm `SQLite database connected & synced`. Make sure it stays running in the background.

### 3. Start the Frontend Application
In a new terminal, launch the Vite dev server:
```bash
npm run dev
```

Your powerful dashboard will immediately be available at `http://localhost:5173`. 

---

## Project Structure
- `/src` — Frontend source code including UI components, Pages, routing, and API client hooks.
- `/backend/server.js` — The core logic, SQLite Data models, API endpoints, and web-analysis tools.
- `/api/index.js` — Vercel Serverless Function entry point bridging Vite and Express.
- `vercel.json` — Vercel routing configuration enforcing SPA proxy rules.
