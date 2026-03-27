import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import ollama from 'ollama';
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

// export interface Flashcards {
//   flashcards: {
//     front: string;
//     back: string;
//   }[];
// }

export interface OllamaResponse {
  response: string;
}

export type { Flashcards };

@Injectable()
export class AiService {
  private isProduction: boolean;
  private ollamaHost: string;
  private ollamaModel: string;

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
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (this.isProduction) {
      // Production: Use Ollama Cloud
      this.ollamaHost =
        this.configService.get<string>('OLLAMA_CLOUD_HOST') ||
        'https://api.olama.ai';
      this.ollamaModel =
        this.configService.get<string>('OLLAMA_CLOUD_MODEL') || 'llama3.2';
    } else {
      // Development: Use local Ollama
      this.ollamaHost =
        this.configService.get<string>('OLLAMA_LOCAL_HOST') ||
        'http://localhost:11434';
      this.ollamaModel =
        this.configService.get<string>('OLLAMA_LOCAL_MODEL') || 'llama3.2';
    }
  }

  transcribeAudio(_file: MulterFile): Promise<never> {
    return Promise.reject(
      new Error(
        'Audio transcription is not supported with Ollama. Consider using a separate service for audio processing.',
      ),
    );
  }

  async generateQuiz(topic: string): Promise<Quiz> {
    try {
      const prompt = `Generate a quiz on the topic: ${topic}. Provide 5 multiple-choice questions with 4 options each, and indicate the correct answer. Format as JSON with structure: { questions: [{ question: string, options: [string], correctAnswer: string }] }`;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const response = (await ollama.generate({
        model: this.ollamaModel,
        prompt: prompt,
        options: {
          temperature: 0.7,
          num_predict: 1000,
        },
      })) as OllamaResponse;

      const content = response.response;

      // FIX 3: Destructure the match result so TypeScript knows jsonStr is a
      // string (not string | undefined) inside the truthy branch.
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const [jsonStr] = match;
        return JSON.parse(jsonStr) as Quiz;
      } else {
        throw new Error('Failed to parse JSON from Ollama response');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Quiz generation failed: ${errorMessage}`);
    }
  }

  async generateFlashcards(topic: string): Promise<Flashcards> {
    try {
      const prompt = `Generate 10 flashcards on the topic: ${topic}. Each flashcard should have a front (question) and back (answer). Format as JSON with structure: { flashcards: [{ front: string, back: string }] }`;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const response = (await ollama.generate({
        // FIX 2: Was hardcoded to 'llama3.2', now correctly uses this.ollamaModel
        // so production and development configs are both respected.
        model: this.ollamaModel,
        prompt: prompt,
        options: {
          temperature: 0.7,
          num_predict: 1000,
        },
      })) as OllamaResponse;

      const content = response.response;

      // FIX 3: Same destructuring fix as generateQuiz above.
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const [jsonStr] = match;
        return JSON.parse(jsonStr) as Flashcards;
      } else {
        throw new Error('Failed to parse JSON from Ollama response');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Flashcard generation failed: ${errorMessage}`);
    }
  }

  async analyzeStudentPerformance(): Promise<{
    summary: string;
    insights: string[];
    recommendations: string[];
    rawData: Record<string, unknown>;
  }> {
    try {
      // Gather student performance data
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

      // Calculate completion rate
      const totalEnrollments = await this.enrollmentModel.count();
      const completionRate =
        totalEnrollments > 0
          ? (completedEnrollments / totalEnrollments) * 100
          : 0;

      // Get lesson progress stats
      const totalLessonsCompleted = await this.lessonProgressModel.count({
        where: { isCompleted: true },
      });

      const totalLessonProgressEntries = await this.lessonProgressModel.count();
      const lessonCompletionRate =
        totalLessonProgressEntries > 0
          ? (totalLessonsCompleted / totalLessonProgressEntries) * 100
          : 0;

      // Get quiz performance stats
      const quizAnswers = await this.quizAnswerModel.findAll();
      const totalQuizAttempts = quizAnswers.length;
      const correctAnswers = quizAnswers.filter((a) => a.isCorrect).length;
      const quizAccuracyRate = totalQuizAttempts > 0
        ? (correctAnswers / totalQuizAttempts) * 100
        : 0;

      // Get average quiz response time
      const avgResponseTimeMs =
        totalQuizAttempts > 0
          ? quizAnswers.reduce((sum, a) => sum + (a.responseTimeMs || 0), 0) /
          totalQuizAttempts
          : 0;

      // Compile raw data
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

      // Prepare prompt for AI analysis
      const analysisPrompt = `Analyze the following student performance data from a Learning Management System and provide insights and recommendations:

PERFORMANCE DATA:
- Total Students: ${totalStudents}
- Active Enrollments: ${activeEnrollments}
- Completed Enrollments: ${completedEnrollments}
- Course Completion Rate: ${completionRate.toFixed(2)}%
- Lesson Completion Rate: ${lessonCompletionRate.toFixed(2)}%
- Total Quiz Attempts: ${totalQuizAttempts}
- Quiz Accuracy Rate: ${quizAccuracyRate.toFixed(2)}%
- Average Quiz Response Time: ${(avgResponseTimeMs / 1000).toFixed(2)} seconds

Please provide a structured analysis with:
1. A brief summary (2-3 sentences) of overall performance
2. 3-5 key insights about student engagement and performance patterns
3. 3-5 actionable recommendations for improving student outcomes

Format your response as JSON with this exact structure:
{
  "summary": "Brief summary text",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

      // Call Ollama for analysis
      const response = (await ollama.generate({
        model: this.ollamaModel,
        prompt: analysisPrompt,
        options: {
          temperature: 0.7,
          num_predict: 2000,
        },
      })) as OllamaResponse;

      const content = response.response;

      // Extract JSON from response
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error('Failed to parse AI analysis response');
      }
      const [jsonStr] = match;
      const analysis = JSON.parse(jsonStr) as {
        summary: string;
        insights: string[];
        recommendations: string[];
      };

      return {
        summary: analysis.summary,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        rawData,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Student performance analysis failed: ${errorMessage}`);
    }
  }
}
