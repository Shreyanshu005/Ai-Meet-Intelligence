import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

export class MeetingsService {
  async createMeeting(userId: string, data: { title: string; participants: string[]; meetingDate: string; transcript: any[] }) {
    return prisma.meeting.create({
      data: {
        userId,
        title: data.title,
        participants: data.participants,
        meetingDate: new Date(data.meetingDate),
        transcript: data.transcript as Prisma.InputJsonValue,
      },
    });
  }

  async getMeeting(id: string, userId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: { analysis: true, actionItems: true },
    });
    if (!meeting || meeting.userId !== userId) {
      throw new Error('Meeting not found');
    }
    return meeting;
  }

  async listMeetings(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({ where: { userId }, orderBy: { meetingDate: 'desc' }, skip, take: limit }),
      prisma.meeting.count({ where: { userId } })
    ]);
    return { data: meetings, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}

export const meetingsService = new MeetingsService();
