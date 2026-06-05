# Meeting Intelligence API

A production-grade Meeting Intelligence backend built to automatically transcribe, analyze, and extract actionable items from meetings using Node.js, TypeScript, Express, PostgreSQL, Redis, and Groq (Llama 3.3). 

This service intelligently parses meeting transcripts, tracks action items, caches expensive AI requests to save latency, and utilizes an asynchronous background job to send email reminders for overdue tasks.

## Tech Stack

- Runtime & Language: Node.js + TypeScript
- Framework: Express.js
- Database: PostgreSQL + Prisma ORM
- Cache: Redis
- AI Processing: Groq SDK (Llama 3.3 70b)
- Email Delivery: Resend SDK
- Task Scheduling: node-cron
- Validation: Zod
- Testing Suite: Vitest + Supertest

---

## Prerequisites

Make sure you have the following installed on your machine:
- Node.js (v18+)
- Docker (for Postgres and Redis instances)
- Git

---

## Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/Shreyanshu005/Ai-Meet-Intelligence.git
cd Ai-Meet-Intelligence
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_meet_intelligence?schema=public"

# Cache
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="your_super_secret_jwt_key"

# External APIs
GROQ_API_KEY="your_groq_api_key_here"
RESEND_API_KEY="your_resend_api_key_here"
```

### 3. Start Infrastructure
Start the required PostgreSQL and Redis databases using Docker:
```bash
docker run --name ai-meet-postgres -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 postgres
docker run --name ai-meet-redis -d -p 6379:6379 redis
```

### 4. Database Schema
Push the Prisma schema to set up your PostgreSQL tables:
```bash
npx prisma db push
```

### 5. Start the Server
Run the application in development mode:
```bash
npm run dev
```
The server will start at http://localhost:3000.

---

## Testing

This project features a comprehensive 40-assertion testing suite powered by Vitest and Supertest. 

### 1. Set up Test Environment
Ensure your test environment has the necessary mock variables in your environment. You can set them in your terminal session or rely on a local test runner configuration that doesn't check in real secrets.

### 2. Run the Suite
```bash
npx vitest run
```
Note: The test suite runs in isolation, uses an independent test database, safely mocks external network calls (Groq, Resend), and clears the DB after each run.

---

## Core API Endpoints

### Auth
- POST /api/auth/register - Register a new user and receive a JWT.
- POST /api/auth/login - Authenticate an existing user.

### Meetings & Analysis (Protected via Bearer Token)
- POST /api/meetings - Upload a new meeting with a transcript.
- GET /api/meetings/:id - Fetch a specific meeting details.
- POST /api/meetings/:id/analyze - Runs the transcript through the Groq AI, identifies decisions, and maps action items. Repeated calls are instantly fetched from the Redis cache.

### Action Items (Protected via Bearer Token)
- GET /api/action-items - View all your assigned action items.
- GET /api/action-items/overdue - View incomplete action items past their due date.
- PATCH /api/action-items/:id/status - Mark an action item as COMPLETED.

### Utility
- GET /health - Check API operational status.

---

## Architecture Highlights

- Idempotent AI Caching: If a user hits /analyze twice, Redis instantly intercepts the request, preventing duplicate LLM billing and latency.
- Fail-safe Parsing: Groq's JSON responses are strongly validated, and action items with AI-hallucinated dates safely default to null instead of crashing the database.
- Traceability: Every request is injected with a UUID traceId which travels through middleware, logs, and HTTP error responses for rapid debugging.
- Background Jobs: A cron job runs every 15 minutes, sweeping the ActionItem table for overdue tasks and firing off email reminders via the Resend SDK.
