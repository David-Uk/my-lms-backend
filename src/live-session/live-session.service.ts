import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { LiveSession, LiveSessionStatus, User, Course, Cohort, Enrollment, CourseTutor, UserRole } from '../models';
import { CreateLiveSessionDto, UpdateLiveSessionDto } from '../dto/live-session.dto';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

@Injectable()
export class LiveSessionService {
  private readonly VIDEOSDK_API_KEY: string;
  private readonly VIDEOSDK_SECRET_KEY: string;
  private readonly VIDEOSDK_API_ENDPOINT = 'https://api.videosdk.live/v2';

  constructor(
    @InjectModel(LiveSession)
    private liveSessionModel: typeof LiveSession,
    @InjectModel(Course)
    private courseModel: typeof Course,
    @InjectModel(Cohort)
    private cohortModel: typeof Cohort,
    @InjectModel(Enrollment)
    private enrollmentModel: typeof Enrollment,
    @InjectModel(CourseTutor)
    private courseTutorModel: typeof CourseTutor,
    private configService: ConfigService,
  ) {
    this.VIDEOSDK_API_KEY = this.configService.get<string>('VIDEOSDK_API_KEY') || 'placeholder_key';
    this.VIDEOSDK_SECRET_KEY = this.configService.get<string>('VIDEOSDK_SECRET_KEY') || 'placeholder_secret';
  }

  async createSession(dto: CreateLiveSessionDto, tutorId: string): Promise<LiveSession> {
    // Verify course exists
    const course = await this.courseModel.findByPk(dto.courseId);
    if (!course) throw new NotFoundException('Course not found');

    // Create VideoSDK Room
    const token = this.generateVideoSDKToken();
    let meetingId = '';

    try {
      const response = await axios.post(
        `${this.VIDEOSDK_API_ENDPOINT}/rooms`,
        {},
        {
          headers: { Authorization: token },
        },
      );
      meetingId = response.data.roomId;
    } catch (error) {
      console.error('Error creating VideoSDK room:', error.response?.data || error.message);
      throw new BadRequestException('Failed to create streaming room');
    }

    return this.liveSessionModel.create({
      ...dto,
      tutorId,
      meetingId,
      status: LiveSessionStatus.SCHEDULED,
    } as any);
  }

  async getSessionForJoin(sessionId: string, userId: string, role: UserRole) {
    const session = await this.liveSessionModel.findByPk(sessionId, {
      include: [Course, Cohort],
    });

    if (!session) throw new NotFoundException('Session not found');

    // Validate access
    if (role === UserRole.LEARNER) {
      const isEnrolled = await this.enrollmentModel.findOne({
        where: { userId, cohortId: session.cohortId },
      });
      if (!isEnrolled && session.cohortId) {
        throw new ForbiddenException('You are not enrolled in this cohort');
      }
    } else if (role === UserRole.TUTOR) {
      if (session.tutorId !== userId) {
        const isAssigned = await this.courseTutorModel.findOne({
          where: { tutorId: userId, courseId: session.courseId },
        });
        if (!isAssigned) throw new ForbiddenException('You are not assigned to this course');
      }
    }

    const token = this.generateVideoSDKToken();

    return {
      session,
      token,
      meetingId: session.meetingId,
    };
  }

  async findAllByCourse(courseId: string) {
    return this.liveSessionModel.findAll({
      where: { courseId },
      order: [['startTime', 'DESC']],
    });
  }

  async updateSession(id: string, dto: UpdateLiveSessionDto, userId: string, role: UserRole) {
    const session = await this.liveSessionModel.findByPk(id);
    if (!session) throw new NotFoundException('Session not found');

    // Only tutor or admin can update
    if (role !== UserRole.ADMIN && role !== UserRole.SUPERADMIN && session.tutorId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updateData: any = { ...dto };
    if (dto.startTime) updateData.startTime = new Date(dto.startTime);
    if (dto.endTime) updateData.endTime = new Date(dto.endTime);

    await session.update(updateData);
    return session;
  }

  private generateVideoSDKToken(): string {
    const options: jwt.SignOptions = {
      expiresIn: '120m',
      algorithm: 'HS256',
    };

    const payload = {
      apikey: this.VIDEOSDK_API_KEY,
      permissions: ['allow_join', 'allow_mod', 'ask_join'], // Adjust permissions as needed
      version: 2,
    };

    return jwt.sign(payload, this.VIDEOSDK_SECRET_KEY as jwt.Secret, options);
  }

  async handleWebhook(payload: any) {
    // Handle recording completion etc.
    // VideoSDK sends webhooks for various events
    const { type, data } = payload;

    if (type === 'recording.stopped') {
        const sessionId = data.roomId; // You'll need to map roomId to your session
        const recordingUrl = data.recordingUrl;
        
        const session = await this.liveSessionModel.findOne({ where: { meetingId: sessionId } });
        if (session) {
            await session.update({ recordingUrl, status: LiveSessionStatus.COMPLETED });
        }
    }
  }
}
