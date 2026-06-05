# Changelog

## [1.0.0] - Initial Release

- scaffold: Initialized Node.js project, configured TypeScript, Zod, and Prettier/ESLint basics.
- auth: Implemented JWT-based authentication with bcrypt password hashing.
- meetings CRUD: Added POST and GET endpoints for uploading and retrieving meeting transcripts.
- AI pipeline: Integrated Groq SDK (Llama 3.3 70b) to analyze meetings for summaries, decisions, and action items.
- action items: Designed API logic for managing pending/in-progress/completed states of generated tasks.
- scheduler: Added Node-cron job running every 15 minutes to find overdue items.
- integration: Integrated Resend SDK for external email alerts.
- docs: Produced architectural, testing, and AI workflow documents.
- deploy: Prepared configuration suitable for Railway deployment.
