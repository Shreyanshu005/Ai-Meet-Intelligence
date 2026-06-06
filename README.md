# AI Meeting Intelligence API

A production-grade Meeting Intelligence backend built to automatically transcribe, analyze, and extract actionable items from meetings. The system utilizes Node.js, TypeScript, Express, PostgreSQL, Redis, and Groq (Llama 3.3) to provide a robust, scalable architecture.

This service parses meeting transcripts, tracks action items, caches expensive AI requests to reduce latency, and utilizes asynchronous background jobs to send email reminders for overdue tasks.

## Architecture Overview

The system is built on a modern Node.js stack prioritizing speed, type safety, and reliability. 

```mermaid
graph TD
    Client[Client Application] -->|HTTP Requests| Express[Express.js Server]
    
    subgraph Backend Infrastructure
        Express --> AuthMiddleware[JWT Auth Middleware]
        AuthMiddleware --> RateLimiter[Rate Limiter]
        RateLimiter --> Routes[API Routers]
        
        Routes -->|Cache Check / Rate Limits| Redis[(Redis Cache)]
        Routes -->|ORM Queries| Prisma[Prisma ORM]
        
        Prisma --> Postgres[(PostgreSQL Database)]
        
        Routes -->|Transcription Analysis| Groq[Groq AI / Llama 3.3]
        
        Cron[Node-Cron Scheduler] -->|Periodic Sweep| Prisma
        Cron -->|Trigger Reminders| Resend[Resend Email API]
    end
```

### Analysis Pipeline Flow

When a user requests meeting analysis, the system ensures idempotency and validates AI outputs strictly to prevent hallucinations.

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Redis
    participant Groq
    participant Database

    User->>API: POST /api/meetings/{id}/analyze
    API->>Redis: Check Cache for {id}
    
    alt Cache Hit
        Redis-->>API: Return Cached Analysis
        API-->>User: 200 OK (Instant)
    else Cache Miss
        API->>Database: Fetch Meeting Transcript
        Database-->>API: Transcript JSON
        API->>Groq: Prompt with Transcript (JSON Schema)
        Groq-->>API: Structured LLM Output
        API->>API: Validate Citations & Timestamps
        API->>Database: Store Action Items & Summary
        API->>Redis: Set Cache (TTL)
        API-->>User: 200 OK (Parsed Response)
    end
```

## Tech Stack

- Runtime & Language: Node.js + TypeScript
- Framework: Express.js (v5)
- Database: PostgreSQL + Prisma ORM
- Cache: Redis
- AI Processing: Groq SDK (Llama 3.3 70b)
- Email Delivery: Resend SDK
- Task Scheduling: node-cron
- Validation: Zod
- Testing Suite: Vitest + Supertest

---

## Local Development Setup

### 1. Repository Initialization
Clone the repository and install dependencies:
```bash
git clone https://github.com/Shreyanshu005/Ai-Meet-Intelligence.git
cd Ai-Meet-Intelligence
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory with the following keys. Note that default ports are assumed for local Docker setups.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_meet_intelligence?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your_super_secret_jwt_key"
GROQ_API_KEY="your_groq_api_key_here"
RESEND_API_KEY="your_resend_api_key_here"
PORT="3000"
```

### 3. Start Infrastructure via Docker
The project includes a `docker-compose.yml` for rapid local infrastructure spin-up.

```bash
docker-compose up -d
```
This command initializes the PostgreSQL and Redis containers in the background.

### 4. Database Migrations
Push the Prisma schema to synchronize your PostgreSQL database structure:
```bash
npx prisma db push
```

### 5. Launch the Application
Run the server in development mode with live reloading:
```bash
npm run dev
```
The server will bind to http://localhost:3000. 

---

## Testing Architecture

The project features a comprehensive testing suite with 40 assertions designed to validate core business logic, API routing, and AI failure states. The testing architecture relies on Vitest and Supertest.

```bash
npx vitest run
```

### Testing Highlights
- Environment Isolation: Tests utilize a separate SQLite in-memory database or an isolated PostgreSQL test schema to prevent local data corruption.
- Network Mocking: External API dependencies, such as Groq and Resend, are fully mocked using `vi.mock` to ensure tests execute deterministically and rapidly without incurring API costs.
- State Teardown: A global `afterEach` hook aggressively clears the database to maintain pure state isolation between tests.

---

## API Specification

The RESTful API is documented via OpenAPI/Swagger. Upon launching the server, interactive API documentation is available at `/api-docs`.

### Authentication Endpoints
- POST /api/auth/register: Create a new account. Requires `email` and `password`. Returns a JWT.
- POST /api/auth/login: Authenticate existing credentials and receive a JWT.

### Meeting Management
*All subsequent routes require an `Authorization: Bearer <token>` header.*

- POST /api/meetings: Ingest a new meeting payload containing participants, meeting date, and raw transcript segments.
- GET /api/meetings: Retrieve a paginated list of all past meetings owned by the authenticated user. Accepts `page` and `limit` query parameters.
- GET /api/meetings/:id: Fetch specific meeting details and its associated transcripts.
- POST /api/meetings/:id/analyze: Execute the AI analysis pipeline. Generates summaries, extracts actionable tasks, maps assignees, and securely persists the findings.

### Action Items
- GET /api/action-items: Fetch paginated action items. Supports filtering via `status`, `assignee`, and `meetingId` query parameters.
- GET /api/action-items/overdue: Quickly retrieve all tasks that have breached their deadline and remain incomplete.
- PATCH /api/action-items/:id/status: Transition an action item state between `PENDING`, `IN_PROGRESS`, and `COMPLETED`.

---

## Engineering Design Decisions

### 1. Security and Reliability
- Rate Limiting: A Redis-backed rate limiter is mounted globally to prevent Denial of Service vectors and brute-force login attempts.
- Tracing: Every incoming HTTP request is assigned a `traceId` which flows through middleware and error handlers. This ID is returned in error responses to facilitate immediate operational debugging.

### 2. Idempotent AI Processing
Calling Large Language Models is computationally expensive and introduces variable latency. To mitigate this, the `/analyze` endpoint utilizes a Redis caching layer. If an identical analysis request is made, the middleware intercepts it and immediately returns the cached JSON payload from memory.

### 3. Background Reminders
The architecture employs an asynchronous polling mechanism via `node-cron`. The scheduler sweeps the database every 15 minutes, identifying action items that are both past due and uncompleted. It seamlessly invokes the Resend SDK to dispatch alert emails, maintaining clean separation from the synchronous HTTP request lifecycle.
