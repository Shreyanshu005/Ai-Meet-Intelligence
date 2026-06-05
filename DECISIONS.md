# Technical Decisions

This document outlines the core technical decisions made during the development of the Ai Meet Intelligence API.

## 1. Authentication Strategy: JWT
**Decision:** JSON Web Tokens (JWT) for stateless authentication.
**Why:** JWTs are stateless, highly scalable, and allow us to verify authentication directly via middleware without needing a database lookup for every request.
**Alternatives Considered:** Session-based auth (Redis/Postgres).
**Trade-offs:** We cannot instantly revoke a single token without building a blacklist strategy in Redis. However, for a stateless meeting service, short-lived tokens + refresh mechanisms (or simply re-authenticating) provide a better DX and lower latency.

## 2. Database Choice: PostgreSQL + Prisma
**Decision:** PostgreSQL as the primary data store, manipulated via Prisma ORM.
**Why:** Meeting transcripts, action items, and users are highly relational. PostgreSQL guarantees ACID compliance. Prisma provides strict type-safety directly aligned with our TypeScript codebase, eliminating a large class of runtime errors.
**Alternatives Considered:** MongoDB.
**Trade-offs:** Relational databases require strict migrations. However, given the strict 1-to-1 relationship between a `Meeting` and `Analysis`, and 1-to-many with `ActionItem`, SQL is significantly better suited for data integrity.

## 3. Caching & Rate Limiting: Redis
**Decision:** Redis for idempotent API caching and rate-limiting.
**Why:** The Groq LLM API is expensive and time-consuming. Redis caches the `/analyze` route so rapid repeated calls do not re-trigger the LLM. It also backs our `express-rate-limit` middleware across distributed instances.
**Trade-offs:** Requires an extra infrastructure component.

## 4. Third-Party Integration: Resend (Email Provider)
**Decision:** Resend API for overdue task reminders.
**Why:** Resend provides an extremely fast, developer-friendly REST API for transactional emails compared to older providers like SendGrid. It is highly reliable for cron-job triggered reminders.

## 5. Background Jobs: node-cron
**Decision:** In-memory `node-cron` scheduler.
**Why:** Simple, effective, and zero-dependency way to run our 15-minute sweep for overdue action items. 
**Alternatives Considered:** BullMQ.
**Trade-offs:** `node-cron` does not distribute across multiple horizontally scaled instances well (could cause duplicate emails). In a massive enterprise environment, a dedicated worker queue like BullMQ backed by Redis would be preferable.
