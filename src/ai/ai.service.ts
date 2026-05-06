import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Flashcards } from './ai.processor';
import {
  User,
  UserRole,
  Enrollment,
  LessonProgress,
  QuizParticipantAnswer,
  Course,
  EnrollmentStatus,
} from '../models';

export type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

export interface Quiz {
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
}

export interface OllamaResponse {
  response: string;
}

export type { Flashcards };

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ollamaBaseUrl: string;
  private readonly ollamaModel: string;
  private readonly ollamaApiKey: string | undefined;

  constructor(
    private configService: ConfigService,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Enrollment)
    private enrollmentModel: typeof Enrollment,
    @InjectModel(LessonProgress)
    private lessonProgressModel: typeof LessonProgress,
    @InjectModel(QuizParticipantAnswer)
    private quizAnswerModel: typeof QuizParticipantAnswer,
    @InjectModel(Course)
    private courseModel: typeof Course,
  ) {
    this.ollamaBaseUrl = (
      this.configService.get<string>('OLLAMA_BASE_URL') ||
      'http://localhost:11434'
    ).replace(/\/$/, ''); // strip trailing slash
    this.ollamaModel =
      this.configService.get<string>('OLLAMA_MODEL') || 'llama3.2';
    this.ollamaApiKey = this.configService.get<string>('OLLAMA_API_KEY');

    this.logger.log(`AI service ready`);
    this.logger.log(`  OLLAMA_BASE_URL : ${this.ollamaBaseUrl}`);
    this.logger.log(`  OLLAMA_MODEL    : ${this.ollamaModel}`);
    this.logger.log(`  OLLAMA_API_KEY  : ${this.ollamaApiKey ? `${this.ollamaApiKey.substring(0, 8)}…` : 'NOT SET'}`);

    if (!this.ollamaApiKey) {
      this.logger.warn('OLLAMA_API_KEY is not set — requests to Ollama Cloud will be rejected (401)');
    }
  }

  private async generateText(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<string> {
    const url = `${this.ollamaBaseUrl}/api/generate`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.ollamaApiKey) {
      headers['Authorization'] = `Bearer ${this.ollamaApiKey}`;
    }

    const body = {
      model: this.ollamaModel,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 1024,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as OllamaResponse;
      return data.response;
    } catch (error) {
      clearTimeout(timeoutId);
      const err = error instanceof Error ? error : new Error('Unknown error');
      if (err.name === 'AbortError') {
        throw new Error('Ollama request timed out after 2 minutes');
      }
      if (
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('fetch failed')
      ) {
        throw new Error(
          `Cannot connect to Ollama at ${this.ollamaBaseUrl}. ` +
          `then run: ollama pull ${this.ollamaModel}`,
        );
      }
      throw new Error(`Ollama call failed: ${err.message}`);
    }
  }

  private extractJson(text: string): string {
    // Strip markdown code fences if present
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return fenced[1].trim();
    // Fall back to first {...} block
    const bare = text.match(/\{[\s\S]*\}/);
    if (bare) return bare[0];
    throw new Error('No JSON found in AI response');
  }

  transcribeAudio(_file: MulterFile): Promise<never> {
    return Promise.reject(
      new Error(
        'Audio transcription is not supported. Use a dedicated transcription service.',
      ),
    );
  }

  async generateQuiz(topic: string): Promise<Quiz> {
    const prompt = `Generate a quiz on the topic: "${topic}".
Return exactly 5 multiple-choice questions, each with 4 options and one correct answer.
Respond with valid JSON only — no markdown, no explanation.
Use this exact structure:
{
  "questions": [
    {
      "question": "...",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": "option A"
    }
  ]
}`;

    try {
      const content = await this.generateText(prompt, { maxTokens: 1024 });
      return JSON.parse(this.extractJson(content)) as Quiz;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Quiz generation failed: ${msg}`);
    }
  }

  async generateFlashcards(topic: string): Promise<Flashcards> {
    const prompt = `Generate 10 flashcards on the topic: "${topic}".
Respond with valid JSON only — no markdown, no explanation.
Use this exact structure:
{
  "flashcards": [
    { "front": "Question or term", "back": "Answer or definition" }
  ]
}`;

    try {
      const content = await this.generateText(prompt, { maxTokens: 1024 });
      return JSON.parse(this.extractJson(content)) as Flashcards;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Flashcard generation failed: ${msg}`);
    }
  }

  async analyzeStudentPerformance(): Promise<{
    summary: string;
    insights: string[];
    recommendations: string[];
    rawData: Record<string, unknown>;
  }> {
    try {
      const totalStudents = await this.userModel.count({
        where: { role: UserRole.LEARNER },
      });
      const activeEnrollments = await this.enrollmentModel.count({
        where: { status: EnrollmentStatus.ACTIVE },
      });
      const completedEnrollments = await this.enrollmentModel.count({
        where: { status: EnrollmentStatus.COMPLETED },
      });
      const totalCourses = await this.courseModel.count();
      const totalEnrollments = await this.enrollmentModel.count();
      const completionRate =
        totalEnrollments > 0
          ? (completedEnrollments / totalEnrollments) * 100
          : 0;
      const totalLessonsCompleted = await this.lessonProgressModel.count({
        where: { isCompleted: true },
      });
      const totalLessonProgressEntries = await this.lessonProgressModel.count();
      const lessonCompletionRate =
        totalLessonProgressEntries > 0
          ? (totalLessonsCompleted / totalLessonProgressEntries) * 100
          : 0;
      const quizAnswers = await this.quizAnswerModel.findAll();
      const totalQuizAttempts = quizAnswers.length;
      const correctAnswers = quizAnswers.filter((a) => a.isCorrect).length;
      const quizAccuracyRate =
        totalQuizAttempts > 0 ? (correctAnswers / totalQuizAttempts) * 100 : 0;
      const avgResponseTimeMs =
        totalQuizAttempts > 0
          ? quizAnswers.reduce((sum, a) => sum + (a.responseTimeMs || 0), 0) /
          totalQuizAttempts
          : 0;

      const rawData = {
        totalStudents,
        activeEnrollments,
        completedEnrollments,
        totalCourses,
        completionRate: Math.round(completionRate * 100) / 100,
        totalLessonsCompleted,
        lessonCompletionRate: Math.round(lessonCompletionRate * 100) / 100,
        totalQuizAttempts,
        quizAccuracyRate: Math.round(quizAccuracyRate * 100) / 100,
        avgResponseTimeSeconds:
          Math.round((avgResponseTimeMs / 1000) * 100) / 100,
      };

      const prompt = `Analyze this LMS performance data and return insights.
Respond with valid JSON only — no markdown, no explanation.

DATA:
- Total Students: ${totalStudents}
- Active Enrollments: ${activeEnrollments}
- Completed Enrollments: ${completedEnrollments}
- Course Completion Rate: ${completionRate.toFixed(2)}%
- Lesson Completion Rate: ${lessonCompletionRate.toFixed(2)}%
- Total Quiz Attempts: ${totalQuizAttempts}
- Quiz Accuracy Rate: ${quizAccuracyRate.toFixed(2)}%
- Avg Quiz Response Time: ${(avgResponseTimeMs / 1000).toFixed(2)}s

Use this exact structure:
{
  "summary": "2-3 sentence overview",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

      const content = await this.generateText(prompt, { maxTokens: 1024 });
      const analysis = JSON.parse(this.extractJson(content)) as {
        summary: string;
        insights: string[];
        recommendations: string[];
      };

      return { ...analysis, rawData };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Student performance analysis failed: ${msg}`);
    }
  }
}
