import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  Assessment,
  Quiz,
  QuizQuestion,
  CodeChallenge,
  CourseContent,
  AssessmentType,
  QuizSession,
  QuizParticipantAnswer,
  QuizSessionStatus,
  User,
} from '../models';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  CreateQuizDto,
  CreateCodeChallengeDto,
  CreateQuizQuestionDto,
  CreateQuizSessionDto,
  SubmitQuizAnswerDto,
} from '../dto/assessment.dto';
import { CreationAttributes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectModel(Assessment)
    private assessmentModel: typeof Assessment,
    @InjectModel(Quiz)
    private quizModel: typeof Quiz,
    @InjectModel(QuizQuestion)
    private quizQuestionModel: typeof QuizQuestion,
    @InjectModel(CodeChallenge)
    private codeChallengeModel: typeof CodeChallenge,
    @InjectModel(CourseContent)
    private courseContentModel: typeof CourseContent,
    @InjectModel(QuizSession)
    private quizSessionModel: typeof QuizSession,
    @InjectModel(QuizParticipantAnswer)
    private quizParticipantAnswerModel: typeof QuizParticipantAnswer,
  ) {}

  async createAssessment(
    contentId: string,
    dto: CreateAssessmentDto,
  ): Promise<Assessment> {
    const content = await this.courseContentModel.findByPk(contentId);
    if (!content) {
      throw new NotFoundException('Course content not found');
    }

    const existing = await this.assessmentModel.findOne({
      where: { contentId },
    });
    if (existing) {
      throw new BadRequestException(
        'Assessment already exists for this content',
      );
    }

    return this.assessmentModel.create({
      ...dto,
      contentId,
    } as CreationAttributes<Assessment>);
  }

  async updateAssessment(
    id: string,
    dto: UpdateAssessmentDto,
  ): Promise<Assessment> {
    const assessment = await this.assessmentModel.findByPk(id);
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }
    await assessment.update(dto);
    return assessment;
  }

  async createQuiz(assessmentId: string, dto: CreateQuizDto): Promise<Quiz> {
    const assessment = await this.assessmentModel.findByPk(assessmentId);
    if (
      !assessment ||
      (assessment.type !== AssessmentType.QUIZ &&
        assessment.type !== AssessmentType.KAHOOT_QUIZ)
    ) {
      throw new BadRequestException('Invalid assessment for quiz');
    }

    return this.quizModel.create({
      ...dto,
      assessmentId,
    } as CreationAttributes<Quiz>);
  }

  async addQuizQuestion(
    quizId: string,
    dto: CreateQuizQuestionDto,
  ): Promise<QuizQuestion> {
    const quiz = await this.quizModel.findByPk(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return this.quizQuestionModel.create({
      ...dto,
      quizId,
    } as CreationAttributes<QuizQuestion>);
  }

  async createCodeChallenge(
    assessmentId: string,
    dto: CreateCodeChallengeDto,
  ): Promise<CodeChallenge> {
    const assessment = await this.assessmentModel.findByPk(assessmentId);
    if (!assessment || assessment.type !== AssessmentType.CODE_CHALLENGE) {
      throw new BadRequestException('Invalid assessment for code challenge');
    }

    return this.codeChallengeModel.create({
      ...dto,
      assessmentId,
    } as CreationAttributes<CodeChallenge>);
  }

  async getAssessmentDetails(id: string): Promise<Assessment> {
    const assessment = await this.assessmentModel.findByPk(id, {
      include: [
        {
          model: Quiz,
          include: [QuizQuestion],
        },
        {
          model: CodeChallenge,
        },
      ],
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    return assessment;
  }

  // ═══════════════════════════════════════════════════════════════
  //  GROUP QUIZ / KAHOOT LOGIC
  // ═══════════════════════════════════════════════════════════════

  async createQuizSession(
    hostId: string,
    dto: CreateQuizSessionDto,
  ): Promise<QuizSession> {
    const quiz = await this.quizModel.findByPk(dto.quizId);
    if (!quiz || !quiz.isGroup) {
      throw new BadRequestException('Quiz is not configured for group play');
    }

    const pin =
      quiz.groupPin ||
      Math.floor(100000 + Math.random() * 900000).toString();

    return this.quizSessionModel.create({
      ...dto,
      hostId,
      pin,
      status: QuizSessionStatus.WAITING,
    } as CreationAttributes<QuizSession>);
  }

  async submitQuizAnswer(
    sessionId: string,
    userId: string,
    dto: SubmitQuizAnswerDto,
  ): Promise<QuizParticipantAnswer> {
    const session = await this.quizSessionModel.findByPk(sessionId, {
      include: [{ model: Quiz, include: [QuizQuestion] }],
    });

    if (!session || session.status !== QuizSessionStatus.ACTIVE) {
      throw new BadRequestException('Quiz session is not active');
    }

    const question = session.quiz.questions.find(
      (q) => q.id === dto.questionId,
    );
    if (!question) {
      throw new NotFoundException('Question not found in this quiz');
    }

    const isCorrect =
      JSON.stringify(question.correctAnswer) === JSON.stringify(dto.answer);

    let points = 0;
    if (isCorrect) {
      const maxPoints = question.marks || 1000;
      const timeLimitMs = (question.timeLimit || 30) * 1000;

      const speedFactor = Math.max(
        0,
        1 - (dto.responseTimeMs / timeLimitMs) * 0.5,
      );
      points = Math.round(maxPoints * speedFactor);
    }

    return this.quizParticipantAnswerModel.create({
      quizSessionId: sessionId,
      userId,
      questionId: dto.questionId,
      answer: dto.answer,
      isCorrect,
      responseTimeMs: dto.responseTimeMs,
      points,
    } as CreationAttributes<QuizParticipantAnswer>);
  }

  async getLeaderboard(sessionId: string) {
    const session = await this.quizSessionModel.findByPk(sessionId);
    if (!session) throw new NotFoundException('Session not found');

    const leaderboard = await this.quizParticipantAnswerModel.findAll({
      where: { quizSessionId: sessionId },
      attributes: [
        'userId',
        [Sequelize.fn('SUM', Sequelize.col('points')), 'totalPoints'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'questionsAnswered'],
        [
          Sequelize.fn(
            'COUNT',
            Sequelize.literal('CASE WHEN "isCorrect" = true THEN 1 END'),
          ),
          'correctAnswers',
        ],
      ],
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      group: ['userId', 'User.id'],
      order: [[Sequelize.literal('"totalPoints"'), 'DESC']],
    });

    return leaderboard;
  }

  async updateSessionStatus(sessionId: string, status: QuizSessionStatus) {
    const session = await this.quizSessionModel.findByPk(sessionId);
    if (!session) throw new NotFoundException('Session not found');

    session.status = status;
    await session.save();
    return session;
  }
}
