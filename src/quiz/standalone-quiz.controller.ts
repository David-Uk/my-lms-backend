import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../models';
import { StandaloneQuizService } from './standalone-quiz.service';
import {
  CreateStandaloneQuizDto,
  InviteParticipantsBulkDto,
  StartQuizDto,
  SubmitAnswerDto,
  CreateQuizQuestionDto,
  CopyQuestionDto,
} from '../dto/assessment.dto';

@ApiTags('Standalone Quizzes')
@Controller('quizzes')
export class StandaloneQuizController {
  constructor(private readonly standaloneQuizService: StandaloneQuizService) { }

  @Post('standalone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Create a standalone quiz' })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  async createStandaloneQuiz(@Body() dto: CreateStandaloneQuizDto) {
    return this.standaloneQuizService.createStandaloneQuiz(dto);
  }

  @Get('standalone/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Get a standalone quiz' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  async getStandaloneQuiz(@Param('id') id: string) {
    return this.standaloneQuizService.getStandaloneQuiz(id);
  }

  @Post('standalone/:id/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Invite participants to a quiz' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  async inviteParticipants(
    @Param('id') id: string,
    @Body() dto: InviteParticipantsBulkDto,
  ) {
    return this.standaloneQuizService.inviteParticipants(id, dto);
  }

  @Get('standalone/:id/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Get quiz participants' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  async getParticipants(@Param('id') id: string) {
    return this.standaloneQuizService.getParticipants(id);
  }

  @Post('standalone/:id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Add a question to a standalone quiz' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  async addQuestion(
    @Param('id') id: string,
    @Body() dto: CreateQuizQuestionDto,
  ) {
    return this.standaloneQuizService.addQuestionToQuiz(id, dto);
  }

  @Post('standalone/:id/questions/copy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Copy a question from another quiz' })
  @ApiParam({ name: 'id', description: 'Target Quiz ID' })
  async copyQuestion(
    @Param('id') id: string,
    @Body() dto: CopyQuestionDto,
  ) {
    return this.standaloneQuizService.addQuestionFromAnotherQuiz(id, dto);
  }

  @Get('standalone/:id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Get all questions for a quiz' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  async getQuestions(@Param('id') id: string) {
    return this.standaloneQuizService.getAllQuestions(id);
  }

  @Get('questions/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Get all questions from standalone quizzes' })
  async getAllStandaloneQuestions() {
    return this.standaloneQuizService.getAllStandaloneQuestions();
  }

  @Post('start')
  @ApiOperation({ summary: 'Start taking a quiz (public endpoint)' })
  @ApiHeader({
    name: 'x-device-fingerprint',
    required: false,
    description: 'Device fingerprint to lock session',
  })
  @ApiHeader({
    name: 'user-agent',
    required: false,
    description: 'Browser user agent',
  })
  @ApiResponse({ status: 200, description: 'Quiz started successfully' })
  async startQuiz(
    @Body() dto: StartQuizDto,
    @Headers('x-device-fingerprint') deviceFingerprint?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.standaloneQuizService.startQuiz({
      ...dto,
      deviceFingerprint,
      deviceInfo: userAgent,
    });
  }

  @Get('take/:quizId/:token')
  @ApiOperation({ summary: 'Get quiz for taking (public endpoint)' })
  @ApiHeader({
    name: 'x-device-fingerprint',
    required: false,
    description: 'Device fingerprint to verify session',
  })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiParam({ name: 'token', description: 'Access token' })
  async getQuizForTaking(
    @Param('quizId') quizId: string,
    @Param('token') token: string,
    @Headers('x-device-fingerprint') deviceFingerprint?: string,
  ) {
    return this.standaloneQuizService.getQuizForTaking(quizId, token, deviceFingerprint);
  }

  @Post('take/:quizId/:participantId/answer')
  @ApiOperation({ summary: 'Submit an answer to a quiz' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiParam({ name: 'participantId', description: 'Participant ID' })
  async submitAnswer(
    @Param('quizId') quizId: string,
    @Param('participantId') participantId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.standaloneQuizService.submitAnswer(quizId, participantId, dto);
  }

  @Post('take/:quizId/:participantId/complete')
  @ApiOperation({ summary: 'Complete a quiz and get results' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiParam({ name: 'participantId', description: 'Participant ID' })
  async completeQuiz(
    @Param('quizId') quizId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.standaloneQuizService.completeQuiz(participantId, quizId);
  }

  @Post('take/:quizId/:participantId/tab-switch')
  @ApiOperation({
    summary:
      'Report a tab switch — auto-terminates the quiz and scores only answered questions',
  })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiParam({ name: 'participantId', description: 'Participant ID' })
  @ApiResponse({
    status: 200,
    description:
      'Tab switch recorded. Quiz is terminated and partial score is calculated.',
  })
  async reportTabSwitch(
    @Param('quizId') quizId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.standaloneQuizService.reportTabSwitch(quizId, participantId);
  }

  @Get('results/:participantId')
  @ApiOperation({ summary: 'Get participant quiz results' })
  @ApiParam({ name: 'participantId', description: 'Participant ID' })
  async getResults(@Param('participantId') participantId: string) {
    return this.standaloneQuizService.getParticipantResults(participantId);
  }
}