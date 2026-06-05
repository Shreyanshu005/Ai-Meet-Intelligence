# AI Approach & Hallucination Prevention

## Prompt Design
The prompt is engineered for strict output constraint.
1. **System Prompt**: Forces the model into a rigid JSON-only mode.
2. **User Prompt**: Supplies the transcript and explicitly defines the exact JSON schema expected.
3. **Explicit Rules**: Defines what qualifies as an action item (e.g. "ANY task a participant commits to doing") to prevent literal under-generation, and enforces ISO 8601 formatting for dates.

## Citation & Grounding Strategy
Every extracted piece of information (Action Items, Decisions, Summaries) *must* be accompanied by an array of `citations` containing the exact timestamps from the transcript.

## Hallucination Prevention
To prevent the model from inventing things:
1. **The Validation Layer**: We implemented a strict custom validator (`validateCitations` in `analysis.validator.ts`).
2. **The Mechanism**: The validator extracts every single `timestamp` the AI generates. It then cross-references them against a `Set` of all valid timestamps in the original transcript payload.
3. **The Result**: If the AI hallucinates a timestamp that never existed (e.g. `99:99`), the validator throws a `Hallucinated citation` error, instantly rejecting the payload and returning a `422 Unprocessable Entity` to the client.

## Output Validation Strategy
We use `try-catch` JSON parsing. If the LLM generates malformed JSON, we throw an error. Furthermore, our ActionItem ingestion explicitly checks the validity of `new Date(item.dueDate)`. If the LLM hallucinates an invalid date string, we default it to `null` to gracefully prevent database crashes.

## Known Limitations
1. **Context Window**: Extremely long meetings (e.g. 4 hours) might exceed the token limits of the LLM. Chunking or Map-Reduce summarization would be needed for scale.
2. **Speaker Identification**: The AI relies entirely on the provided `speaker` label. If the transcript is poorly diarized, the action item assignments will be incorrect.
