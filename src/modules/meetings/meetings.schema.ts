import { z } from 'zod';

export const transcriptEntrySchema = z.object({
  timestamp: z.string(),
  speaker: z.string(),
  text: z.string(),
});

export const createMeetingSchema = z.object({
  title: z.string().min(1),
  participants: z.array(z.string()),
  meetingDate: z.string().datetime(),
  transcript: z.array(transcriptEntrySchema),
});
