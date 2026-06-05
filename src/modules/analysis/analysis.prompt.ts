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
  "actionItems": [{ "task": "string", "assignee": "string", "dueDate": "string|null", "citations": [{ "timestamp": "string" }] }],
  "decisions": [{ "text": "string", "citations": [{ "timestamp": "string" }] }],
  "followUps": [{ "text": "string", "citations": [{ "timestamp": "string" }] }]
}

Rules:
- Only include action items explicitly assigned to someone in the transcript.
- Only include decisions explicitly stated in the transcript.
- If no decisions were made, return an empty array for decisions.
- Every item must have at least one citation timestamp that exists in the transcript.
`;
