# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - Initial Release
### Added
- Express + TypeScript backend foundation.
- Centralized error handling and standardized `{ success, traceId }` response format.
- JWT Authentication (`/register`, `/login`).
- Prisma + PostgreSQL database integration.
- Meeting ingestion API (`POST /api/meetings`).
- Groq AI SDK integration for meeting analysis.
- Hallucination prevention through strict validation of citation timestamps.
- Action Item extraction, caching, and state management.
- Overdue action item detection API.
- Node-cron background job executing every 15 minutes.
- Resend SDK integration for email reminders.
- Vitest + Supertest integration suite with 40 isolated tests.
- Docker + CI/CD support.
- Rate limiting and caching via Redis.
- Pagination and Filtering implementation on list endpoints.
- `/api/evaluation` and Swagger API Docs `/api-docs`.
