import { Injectable, Logger } from '@nestjs/common';
import ollama from 'ollama';

export interface Quiz {
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
}

export interface Flashcards {
  flashcards: {
    front: string;
    back: string;
  }[];
}

export interface JobData {
  id: string;
  type: 'quiz' | 'flashcards';
  topic: string;
}

export interface JobResult {
  success: boolean;
  data?: Quiz | Flashcards;
  error?: string;
}

@Injectable()
export class AiProcessor {
  private readonly logger = new Logger(AiProcessor.name);
  private jobs = new Map<string, { status: string; result?: any; promise?: Promise<any> }>();

  async processJob(jobData: JobData): Promise<string> {
    const jobId = jobData.id;
    this.jobs.set(jobId, { status: 'processing' });

    try {
      const result = await this.runInWorker(jobData);
      this.jobs.set(jobId, { status: 'completed', result });
      return jobId;
    } catch (error) {
      this.logger.error(`Job ${jobId} failed: ${error.message}`);
      this.jobs.set(jobId, {
        status: 'failed',
        result: { success: false, error: error.message }
      });
      return jobId;
    }
  }

  getJobStatus(jobId: string) {
    return this.jobs.get(jobId) || { status: 'not_found' };
  }

  private async runInWorker(jobData: JobData): Promise<Quiz | Flashcards> {
    if (jobData.type === 'quiz') {
      return await this.generateQuiz(jobData.topic);
    } else if (jobData.type === 'flashcards') {
      return await this.generateFlashcards(jobData.topic);
    }
    throw new Error(`Unknown job type: ${jobData.type}`);
  }

  private async generateQuiz(topic: string): Promise<Quiz> {
    try {
      const prompt = `Generate a quiz on the topic: ${topic}. Provide 5 multiple-choice questions with 4 options each, and indicate the correct answer. Format as JSON with structure: { questions: [{ question: string, options: [string], correctAnswer: string }] }`;

      const response = await ollama.generate({
        model: 'llama2',
        prompt: prompt,
        options: {
          temperature: 0.7,
          num_predict: 1000,
        },
      });

      const content = response.response;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as Quiz;
      } else {
        throw new Error('Failed to parse JSON from Ollama response');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Quiz generation failed: ${errorMessage}`);
    }
  }

  private async generateFlashcards(topic: string): Promise<Flashcards> {
    try {
      const prompt = `Generate 10 flashcards on the topic: ${topic}. Each flashcard should have a front (question) and back (answer). Format as JSON with structure: { flashcards: [{ front: string, back: string }] }`;

      const response = await ollama.generate({
        model: 'llama2',
        prompt: prompt,
        options: {
          temperature: 0.7,
          num_predict: 1000,
        },
      });

      const content = response.response;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as Flashcards;
      } else {
        throw new Error('Failed to parse JSON from Ollama response');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Flashcard generation failed: ${errorMessage}`);
    }
  }
}
