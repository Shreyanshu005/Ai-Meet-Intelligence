# AI Approach

## Grounded Prompt Design
The primary focus of the prompt is strict data grounding. The transcript is injected verbatim, and the system prompt aggressively mandates that the model only outputs information exactly present in the transcript. There's no room for hallucinated attendees, action items, or decisions. 

## JSON-only Output Format
We use the native `response_format: { type: 'json_object' }` on the LLM client (Groq SDK). The prompt clearly specifies a strict JSON schema. This guarantees the structure of the output is programmatically consumable, eliminating any brittle Regex or markdown strip tasks.

## Citation Cross-Validator
Before saving AI-generated results, the pipeline uses a custom programmatic validator `validateCitations`. Every item extracted must explicitly point to the `timestamp` it was derived from. The validator cross-checks this timestamp against the original list of valid transcript timestamps. If an invalid/hallucinated timestamp is found, the system rejects it.

## Retry on Parse Failure
Because we enforce the JSON schema format strictly, unexpected malformed structures are immediately caught by `JSON.parse`. While Groq's json format mitigates this heavily, if an error happens, the request fails with a clean 500/Retryable error without silently corrupting data.

## Caching Strategy
AI analysis is slow and consumes valuable credits. Redis is used with a specific cache key formatting (`meeting:${id}:analysis`). If an analysis has already been successfully run for a meeting, the API returns the cached response instantly, avoiding any further calls to the AI model.
