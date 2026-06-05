# Testing Scenarios

## 1. Valid Meeting Creation
- Create a user.
- Request `POST /api/meetings` with valid JSON transcript and dates.
- Expected: Returns 201 with meeting data including ID.

## 2. Analyze with No Transcript
- Send an analysis request for a meeting that was saved with an empty array or missing transcript.
- Expected: Request throws a `Meeting has no transcript` error (400 Bad Request).

## 3. Analyze with Rich Transcript
- Perform `POST /api/meetings/:id/analyze` with a rich transcript.
- Check citation timestamps.
- Expected: Response succeeds and every returned timestamp strictly exists in the inputted transcript array.
- Run again to assert cached fast response.

## 4. Action Item Status Update
- Mark action item as `COMPLETED`.
- Expected: Responds with updated entity.

## 5. Overdue Detection with Past DueDate
- Have an action item with status `PENDING` and a `dueDate` in the past.
- Request `GET /api/action-items/overdue`.
- Expected: Action item is included in the list.

## 6. Overdue with COMPLETED Status
- Update an overdue action item's status to `COMPLETED`.
- Request `GET /api/action-items/overdue`.
- Expected: Action item does NOT appear in the overdue query.

## 7. Reminder Job Idempotency
- Trigger `runReminderJob` manually or let the cron run.
- Expected: Email is sent (if configured) and `Reminder` record is created. 
- Ensure that subsequent job runs process outstanding tasks correctly based on existing reminders state (if extended).
