# Testing Strategy

The project utilizes **Vitest** and **Supertest** to form a highly comprehensive 40-assertion integration testing suite.

## Test Scenarios Executed

### 1. Middleware & Edge Cases
- Invalid, expired, and malformed JWTs correctly return `401 Unauthorized`.
- Missing required fields, wrong data types, and invalid enums are successfully caught by Zod and returned as `400 Bad Request`.
- Trace IDs are verified to propagate through headers and error responses.

### 2. Authentication & Security
- Passwords are encrypted before saving.
- Duplicate email registrations throw `409 Conflict`.
- Massively huge payloads are safely rejected.

### 3. Meetings & AI Analysis
- Ensure users can only view their own meetings.
- The `Groq` SDK is mocked at the top-level to prevent real API billing during tests.
- **Hallucination Test**: A mocked AI response intentionally returns a timestamp (`99:99`) not found in the transcript. The test successfully asserts that the server rejects it with a `422`.

### 4. Background Jobs & Notifications
- The reminder job is unit-tested by mocking the database queries and the `Resend` SDK. 
- Overdue items correctly trigger the reminder function, and missing users are handled gracefully.

## Limitations Discovered
During testing, we discovered that concurrent execution of test files caused Prisma Database Locking issues. We resolved this by forcing sequential file execution in `vitest.config.ts` (`fileParallelism: false`) and utilizing `prisma db push --accept-data-loss` in the global `setup.ts` file to ensure a clean slate for every test.
