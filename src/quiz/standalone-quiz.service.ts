import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import {
  Quiz,
  QuizQuestion,
  QuizParticipant,
  QuizAccessToken,
  QuizResponse,
  QuizParticipantStatus,
} from '../models';
import {
  CreateStandaloneQuizDto,
  InviteParticipantDto,
  InviteParticipantsBulkDto,
  StartQuizDto,
  SubmitAnswerDto,
  CreateQuizQuestionDto,
  CopyQuestionDto,
} from '../dto/assessment.dto';
import { CreationAttributes } from 'sequelize';
import * as crypto from 'crypto';

@Injectable()
export class StandaloneQuizService {
  constructor(
    @InjectModel(Quiz)
    private quizModel: typeof Quiz,
    @InjectModel(QuizQuestion)
    private quizQuestionModel: typeof QuizQuestion,
    @InjectModel(QuizParticipant)
    private quizParticipantModel: typeof QuizParticipant,
    @InjectModel(QuizAccessToken)
    private quizAccessTokenModel: typeof QuizAccessToken,
    @InjectModel(QuizResponse)
    private quizResponseModel: typeof QuizResponse,
  ) {}

  async createStandaloneQuiz(dto: CreateStandaloneQuizDto): Promise<Quiz> {
    return this.quizModel.create({
      title: dto.title,
      description: dto.description,
      assessmentId: null,
      timeAllocated: dto.timeAllocated,
      passMark: dto.passMark,
      isGroup: false,
    } as CreationAttributes<Quiz>);
  }

  async getStandaloneQuiz(id: string): Promise<Quiz> {
    const quiz = await this.quizModel.findByPk(id, {
      include: [QuizQuestion],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async inviteParticipants(
    quizId: string,
    dto: InviteParticipantsBulkDto,
  ): Promise<{ tokens: QuizAccessToken[]; participantEmails: string[] }> {
    const quiz = await this.quizModel.findByPk(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const tokens: QuizAccessToken[] = [];
    const participantEmails: string[] = [];

    for (const participant of dto.participants) {
      const existingToken = await this.quizAccessTokenModel.findOne({
        where: {
          quizId,
          participantEmail: participant.email,
          used: false,
        },
      });

      if (existingToken) {
        const now = new Date();
        if (existingToken.expiresAt > now) {
          tokens.push(existingToken);
          participantEmails.push(participant.email);
          continue;
        }
        await existingToken.destroy();
      }

      const token = await this.quizAccessTokenModel.create({
        quizId,
        token: crypto.randomUUID(),
        participantName: participant.name,
        participantEmail: participant.email,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        used: false,
      } as CreationAttributes<QuizAccessToken>);

      tokens.push(token);
      participantEmails.push(participant.email);

      await this.quizParticipantModel.create({
        name: participant.name,
        email: participant.email,
        quizId,
        status: QuizParticipantStatus.INVITED,
      } as CreationAttributes<QuizParticipant>);
    }

    return { tokens, participantEmails };
  }

  async startQuiz(dto: StartQuizDto & { deviceFingerprint?: string; deviceInfo?: string }): Promise<{ quiz: Quiz; participant: QuizParticipant }> {
    const tokenRecord = await this.quizAccessTokenModel.findOne({
      where: {
        quizId: dto.quizId,
        token: dto.token,
      },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Invalid or expired access token');
    }

    const now = new Date();
    if (tokenRecord.expiresAt < now) {
      throw new BadRequestException('Access token has expired');
    }

    const quiz = await this.quizModel.findByPk(dto.quizId, {
      include: [QuizQuestion],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const participant = await this.quizParticipantModel.findOne({
      where: {
        quizId: dto.quizId,
        email: tokenRecord.participantEmail,
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.status === QuizParticipantStatus.COMPLETED) {
      throw new BadRequestException('You have already completed this quiz');
    }

    if (participant.status === QuizParticipantStatus.STARTED) {
      if (dto.deviceFingerprint && participant.deviceFingerprint) {
        if (participant.deviceFingerprint !== dto.deviceFingerprint) {
          throw new BadRequestException('You already have an active session on another device. Please use the same device to complete the quiz.');
        }
      } else if (participant.deviceInfo && dto.deviceInfo) {
        if (participant.deviceInfo !== dto.deviceInfo) {
          throw new BadRequestException('You already have an active session on another device. Please use the same device to complete the quiz.');
        }
      } else {
        throw new BadRequestException('You already have an active session. Please continue from your previous session.');
      }
      return { quiz, participant };
    }

    if (!dto.deviceFingerprint) {
      tokenRecord.used = true;
      await tokenRecord.save();
    }

    participant.status = QuizParticipantStatus.STARTED;
    participant.startedAt = new Date();
    
    if (dto.deviceFingerprint) {
      participant.deviceFingerprint = dto.deviceFingerprint;
    }
    if (dto.deviceInfo) {
      participant.deviceInfo = dto.deviceInfo;
    }
    
    await participant.save();

    return { quiz, participant };
  }

  async getQuizForTaking(
    quizId: string,
    token: string,
    deviceFingerprint?: string,
  ): Promise<{
    quiz: Quiz;
    questions: Partial<QuizQuestion>[];
    participant: QuizParticipant;
  }> {
    const tokenRecord = await this.quizAccessTokenModel.findOne({
      where: {
        quizId,
        token,
      },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Invalid access token');
    }

    if (tokenRecord.used && !deviceFingerprint) {
      throw new BadRequestException('Invalid access token');
    }

    const now = new Date();
    if (tokenRecord.expiresAt < now) {
      throw new BadRequestException('Access token has expired');
    }

    const quiz = await this.quizModel.findByPk(quizId, {
      include: [QuizQuestion],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const participant = await this.quizParticipantModel.findOne({
      where: {
        quizId,
        email: tokenRecord.participantEmail,
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.status === QuizParticipantStatus.COMPLETED) {
      throw new BadRequestException('Quiz already completed');
    }

    if (participant.status === QuizParticipantStatus.STARTED) {
      if (deviceFingerprint && participant.deviceFingerprint) {
        if (participant.deviceFingerprint !== deviceFingerprint) {
          throw new BadRequestException('You already have an active session on another device');
        }
      }
    }

    const questionsWithoutAnswers = quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      marks: q.marks,
      timeLimit: q.timeLimit,
    }));

    return {
      quiz,
      questions: questionsWithoutAnswers,
      participant,
    };
  }

  async submitAnswer(
    quizId: string,
    participantId: string,
    dto: SubmitAnswerDto,
  ): Promise<QuizResponse> {
    const question = await this.quizQuestionModel.findOne({
      where: {
        id: dto.questionId,
        quizId,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const isCorrect = JSON.stringify(question.correctAnswer) === JSON.stringify(dto.answer);

    const response = await this.quizResponseModel.create({
      quizId,
      participantId,
      questionId: dto.questionId,
      answer: dto.answer,
      isCorrect,
      marksAwarded: isCorrect ? question.marks : 0,
    } as CreationAttributes<QuizResponse>);

    return response;
  }

  async completeQuiz(participantId: string, quizId: string): Promise<QuizParticipant> {
    const participant = await this.quizParticipantModel.findByPk(participantId);

    if (!participant || participant.quizId !== quizId) {
      throw new NotFoundException('Participant not found');
    }

    const responses = await this.quizResponseModel.findAll({
      where: { participantId, quizId },
    });

    const totalMarks = await this.quizQuestionModel.findAll({
      where: { quizId },
    });

    const totalPossibleMarks = totalMarks.reduce((sum, q) => sum + (q.marks || 1), 0);
    const earnedMarks = responses.reduce((sum, r) => sum + (r.marksAwarded || 0), 0);
    const percentageScore = totalPossibleMarks > 0 ? (earnedMarks / totalPossibleMarks) * 100 : 0;

    const quiz = await this.quizModel.findByPk(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    const passed = percentageScore >= quiz.passMark;

    participant.status = QuizParticipantStatus.COMPLETED;
    participant.score = earnedMarks;
    participant.percentageScore = percentageScore;
    participant.passed = passed;

    await participant.save();

    return participant;
  }

  async getParticipantResults(participantId: string): Promise<{
    participant: QuizParticipant;
    responses: QuizResponse[];
    quiz: Quiz;
  }> {
    const participant = await this.quizParticipantModel.findByPk(participantId);

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    const quiz = await this.quizModel.findByPk(participant.quizId);

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const responses = await this.quizResponseModel.findAll({
      where: {
        participantId,
        quizId: participant.quizId,
      },
    });

    return { participant, responses, quiz };
  }

  async getParticipants(quizId: string): Promise<QuizParticipant[]> {
    return this.quizParticipantModel.findAll({
      where: { quizId },
    });
  }

  async addQuestionToQuiz(
    quizId: string,
    dto: CreateQuizQuestionDto,
  ): Promise<QuizQuestion> {
    return this.quizQuestionModel.create({
      ...dto,
      quizId,
    } as CreationAttributes<QuizQuestion>);
  }

  async addQuestionFromAnotherQuiz(
    quizId: string,
    dto: CopyQuestionDto,
  ): Promise<QuizQuestion> {
    const sourceQuestion = await this.quizQuestionModel.findByPk(
      dto.sourceQuestionId,
    );

    if (!sourceQuestion) {
      throw new NotFoundException('Source question not found');
    }

    return this.quizQuestionModel.create({
      quizId,
      type: sourceQuestion.type,
      question: sourceQuestion.question,
      options: sourceQuestion.options,
      correctAnswer: sourceQuestion.correctAnswer,
      marks: sourceQuestion.marks,
      timeLimit: sourceQuestion.timeLimit,
      sourceQuestionId: sourceQuestion.id,
    } as CreationAttributes<QuizQuestion>);
  }

  async getAllQuestions(quizId: string): Promise<QuizQuestion[]> {
    return this.quizQuestionModel.findAll({
      where: { quizId },
    });
  }

  async getAllStandaloneQuestions(): Promise<QuizQuestion[]> {
    const quizzes = await this.quizModel.findAll({
      where: {
        assessmentId: null,
      },
    });

    const quizIds = quizzes.map((q) => q.id);

    return this.quizQuestionModel.findAll({
      where: {
        quizId: {
          [Op.in]: quizIds,
        },
      },
    });
  }
}