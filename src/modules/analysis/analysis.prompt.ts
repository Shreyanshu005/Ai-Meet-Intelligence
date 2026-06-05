export type TranscriptEntry = {
  timestamp: string;
  speaker: string;
  text: string;
};

export const buildAnalysisPrompt = (transcript: TranscriptEntry[]) => `
You are a meeting analyst. Analyze ONLY the transcript below.
Do not invent attendees, action items, or outcomes.
Every insight MUST cite the exact timestamp(s) it was derived from.

TRANSCRIPT:
${transcript.map(t => `[${t.timestamp}] ${t.speaker}: ${t.text}`).join('\n')}

Respond with ONLY valid JSON matching this schema (no markdown, no preamble):
{
  "summary": [{ "text": "string", "citations": [{ "timestamp": "string" }] }],
  "actionItems": [{ "task": "string", "assignee": "string", "dueDate": "string (MUST be in YYYY-MM-DD format) | null", "citations": [{ "timestamp": "string" }] }],
  "decisions": [{ "text": "string", "citations": [{ "timestamp": "string" }] }],
  "followUps": [{ "text": "string", "citations": [{ "timestamp": "string" }] }]
}

Rules:
- An action item is ANY task a participant commits to doing (e.g., "I will handle that", "I can do that", "I'll do it by Friday"). If someone volunteers for a task, create an action item assigned to them.
- For dueDate, convert relative days (like "Friday" or "tomorrow") into an estimated YYYY-MM-DD date based on the meeting transcript context, or leave it null if it cannot be determined. It MUST be a valid Date string.
- Only include decisions explicitly stated in the transcript.
- If no decisions or action items were made, return an empty array for that field.
- Every item must have at least one citation timestamp that exactly matches a timestamp in the transcript.
`;
