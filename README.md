# ChaosOps

## Description
ChaosOps is a comprehensive, enterprise-grade web platform for orchestrating chaos engineering experiments, monitoring infrastructure health, and managing continuous deployment pipelines. It provides a highly intuitive, modern, dark-themed ("deep space navy") user interface built with React. The robust Node.js backend manages test metrics, analytics, scheduled tasks, and real-time microservice statuses. 

This tool empowers Site Reliability Engineers (SREs) and DevOps teams to preemptively discover system vulnerabilities by safely injecting failures into their infrastructure.

## Technologies Used
- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI Primitives, Recharts, Framer Motion
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB (Mongoose ORM)
- **Deployment & Orchestration**: Docker, Kubernetes (Manifests included)

## Prerequisites
To run this project locally, you will need:
- Node.js (v18 or higher recommended)
- MongoDB running locally on port `27017`
- Docker (optional, for containerized deployments)

## Local Development Setup

Follow these commands to get your local environment up and running:

### 1. Start MongoDB
Ensure MongoDB is running locally on the default port (`27017`).
If you have Docker installed, you can easily spin up a local MongoDB instance with:
```bash
docker run -d -p 27017:27017 --name chaosops-mongo mongo
```

### 2. Start the Backend API Server
Open a terminal, navigate to the `backend` directory, install dependencies, and start the server:
```bash
cd backend
npm install
node server.js
```
The Node.js backend server will launch on `http://localhost:3001` and connect to the local MongoDB instance (`mongodb://localhost:27017/ChaosOpsStats`).

### 3. Start the Frontend Application
Open a new terminal window, navigate to the project root directory, install frontend dependencies, and start the Vite development server:
```bash
npm install
npm run dev
```
The React frontend user interface will be available at `http://localhost:5173` (or another port depending on Vite's allocation). 

## Project Structure
- `/src` — Frontend source code including UI components, Pages, routing, and API client hooks.
- `/backend` — Backend source code, primarily `server.js` containing the Express server, API endpoints, and MongoDB schemas.
- `docker-compose.yml` — Compose file to orchestrate building the frontend and backend Docker containers.
- `Dockerfile` & `/backend/Dockerfile` — Definitions for building the Docker images.
- `chaosops-deployment.yaml` & `chaosops-service.yaml` — Kubernetes manifests to deploy and expose the ChaosOps service inside a cluster.
- `setup_backend.js` — Script to seed the MongoDB database with initial sample data for experiments and templates.

## Database Seeding
If you are starting fresh and want some sample microservice data, experiment templates, and run histories, there is a seed script included.
Make sure your MongoDB is running and execute:
```bash
node setup_backend.js
```

## Production Deployment

### Docker Compose
You can run both the frontend and backend behind a unified stack using Docker Compose. Note: If you want MongoDB included inside the stack, uncomment the `mongo` block in `docker-compose.yml`.
```bash
docker compose up --build -d
```

### Kubernetes
To deploy the application to your Kubernetes cluster:
```bash
kubectl apply -f chaosops-deployment.yaml
kubectl apply -f chaosops-service.yaml
```
