import { TranscriptEntry } from './analysis.prompt';

export type Citation = { timestamp: string };
export type CitedInsight = { text: string; citations: Citation[] };
export type ActionItemParsed = { task: string; assignee: string; dueDate: string | null; citations: Citation[] };

export type AnalysisResult = {
  summary: CitedInsight[];
  actionItems: ActionItemParsed[];
  decisions: CitedInsight[];
  followUps: CitedInsight[];
};

export const validateCitations = (result: AnalysisResult, transcript: TranscriptEntry[]) => {
  const validTimestamps = new Set(transcript.map(t => t.timestamp));
  const allItems = [...(result.summary || []), ...(result.actionItems || []), ...(result.decisions || []), ...(result.followUps || [])];

  for (const item of allItems) {
    if (!item.citations || !Array.isArray(item.citations)) continue;
    for (const citation of item.citations) {
      if (!validTimestamps.has(citation.timestamp)) {
        throw new Error(`Hallucinated citation: timestamp ${citation.timestamp} not in transcript`);
      }
    }
  }
};
