import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  Request as NestRequest,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../models';
import { AssessmentService } from './assessment.service';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  CreateQuizDto,
  CreateCodeChallengeDto,
  CreateQuizQuestionDto,
  CreateQuizSessionDto,
  SubmitQuizAnswerDto,
} from '../dto/assessment.dto';
import { QuizSessionStatus } from '../models';

@ApiTags('Assessments')
@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('content/:contentId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Create a new assessment for a course content' })
  @ApiParam({ name: 'contentId', description: 'Course Content ID' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully.' })
  async create(
    @Param('contentId') contentId: string,
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.assessmentService.createAssessment(contentId, dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Update assessment basics' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateAssessmentDto) {
    return this.assessmentService.updateAssessment(id, dto);
  }

  @Post(':id/quiz')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Add a quiz to an assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  async createQuiz(@Param('id') id: string, @Body() dto: CreateQuizDto) {
    return this.assessmentService.createQuiz(id, dto);
  }

  @Post('quiz/:quizId/questions')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Add a question to a quiz' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  async addQuestion(
    @Param('quizId') quizId: string,
    @Body() dto: CreateQuizQuestionDto,
  ) {
    return this.assessmentService.addQuizQuestion(quizId, dto);
  }

  @Post(':id/code-challenge')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Add a code challenge to an assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  async createCodeChallenge(
    @Param('id') id: string,
    @Body() dto: CreateCodeChallengeDto,
  ) {
    return this.assessmentService.createCodeChallenge(id, dto);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR, UserRole.LEARNER)
  @ApiOperation({
    summary: 'Get assessment details including quiz or code challenge',
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  async findOne(@Param('id') id: string) {
    return this.assessmentService.getAssessmentDetails(id);
  }

  // ═══════════════════════════════════════════════════════════════
  //  GROUP QUIZ / KAHOOT SESSIONS
  // ═══════════════════════════════════════════════════════════════

  @Post('sessions')
  @Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new group quiz session' })
  async createSession(
    @Body() dto: CreateQuizSessionDto,
    @NestRequest() req: Request & { user: { userId: string } },
  ) {
    return this.assessmentService.createQuizSession(req.user.userId, dto);
  }

  @Patch('sessions/:sessionId/status')
  @Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update status of a quiz session' })
  @ApiParam({ name: 'sessionId', description: 'Quiz Session ID' })
  async updateStatus(
    @Param('sessionId') sessionId: string,
    @Body('status') status: QuizSessionStatus,
  ) {
    return this.assessmentService.updateSessionStatus(sessionId, status);
  }

  @Post('sessions/:sessionId/submit')
  @Roles(UserRole.LEARNER)
  @ApiOperation({ summary: 'Submit an answer to an active quiz session' })
  async submitAnswer(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitQuizAnswerDto,
    @NestRequest() req: Request & { user: { userId: string } },
  ) {
    return this.assessmentService.submitQuizAnswer(
      sessionId,
      req.user.userId,
      dto,
    );
  }

  @Get('sessions/:sessionId/leaderboard')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR, UserRole.LEARNER)
  @ApiOperation({ summary: 'Get current leaderboard for a quiz session' })
  async getLeaderboard(@Param('sessionId') sessionId: string) {
    return this.assessmentService.getLeaderboard(sessionId);
  }
}
