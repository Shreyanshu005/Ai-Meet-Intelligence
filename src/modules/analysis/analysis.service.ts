import { groq } from '../../lib/groq';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { buildAnalysisPrompt, TranscriptEntry } from './analysis.prompt';
import { validateCitations, AnalysisResult } from './analysis.validator';

export class AnalysisService {
  async analyzeMeeting(meetingId: string, userId: string) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting || meeting.userId !== userId) {
      throw new Error('Meeting not found');
    }

    if (!meeting.transcript || !Array.isArray(meeting.transcript) || meeting.transcript.length === 0) {
      throw new Error('Meeting has no transcript');
    }

    const cacheKey = `meeting:${meetingId}:analysis`;
    if (redis.isReady) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const existingAnalysis = await prisma.analysis.findUnique({ where: { meetingId } });
    if (existingAnalysis) {
      const existingActionItems = await prisma.actionItem.findMany({ where: { meetingId } });
      const finalResult = { analysis: existingAnalysis, actionItems: existingActionItems };
      if (redis.isReady) {
        await redis.setEx(cacheKey, 60 * 60 * 24, JSON.stringify(finalResult));
      }
      return finalResult;
    }

    const transcript = meeting.transcript as unknown as TranscriptEntry[];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a meeting analyst. Respond only with valid JSON. No markdown, no explanation, no preamble.',
        },
        {
          role: 'user',
          content: buildAnalysisPrompt(transcript),
        },
      ],
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content ?? '{}';
    let result: AnalysisResult;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      throw new Error('Failed to parse AI response as JSON');
    }

    validateCitations(result, transcript);

    const analysis = await prisma.analysis.create({
      data: {
        meetingId,
        summary: result.summary,
        decisions: result.decisions,
        followUps: result.followUps,
        rawResponse: raw,
      },
    });

    if (result.actionItems && result.actionItems.length > 0) {
      for (const item of result.actionItems) {
        const parsedDate = item.dueDate ? new Date(item.dueDate) : null;
        await prisma.actionItem.create({
          data: {
            meetingId,
            userId,
            task: item.task,
            assignee: item.assignee,
            dueDate: parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null,
            citations: item.citations,
          },
        });
      }
    }

    const finalResult = { analysis, actionItems: result.actionItems };
    await redis.setEx(cacheKey, 60 * 60 * 24, JSON.stringify(finalResult)); // cache for 24h

    return finalResult;
  }
}

export const analysisService = new AnalysisService();
