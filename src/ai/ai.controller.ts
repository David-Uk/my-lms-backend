import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../models';
import { AiService, Quiz, Flashcards } from './ai.service';
import type { MulterFile } from './ai.service';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('transcribe')
  @Roles(UserRole.LEARNER, UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPERADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Transcribe audio file to text' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Audio file (wav, mp3, etc.)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Transcription result.' })
  @ApiResponse({ status: 400, description: 'Invalid file.' })
  async transcribe(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const transcription = await this.aiService.transcribeAudio(file);
    return { transcription };
  }

  @Post('quiz')
  @Roles(UserRole.LEARNER, UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Generate a quiz on a topic' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic for the quiz' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Generated quiz.' })
  async generateQuiz(@Body() body: { topic: string }): Promise<Quiz> {
    const quiz = await this.aiService.generateQuiz(body.topic);
    return quiz;
  }

  @Post('flashcards')
  @Roles(UserRole.LEARNER, UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Generate flashcards on a topic' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic for the flashcards' },
      },
    },
  })
  async generateFlashcards(
    @Body() body: { topic: string },
  ): Promise<Flashcards> {
    const flashcards = await this.aiService.generateFlashcards(body.topic);
    return flashcards;
  }

  @Post('analyze-performance')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Analyze student performance (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Student performance analysis with AI insights.',
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Overall performance summary' },
        insights: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key insights about student performance',
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Actionable recommendations',
        },
        rawData: {
          type: 'object',
          description: 'Raw performance metrics',
        },
      },
    },
  })
  async analyzeStudentPerformance() {
    return await this.aiService.analyzeStudentPerformance();
  }
}
