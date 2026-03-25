import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ollama from 'ollama';
import { Flashcards } from './ai.processor';

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

  constructor(private configService: ConfigService) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (this.isProduction) {
      // Production: Use Ollama Cloud
      this.ollamaHost =
        this.configService.get<string>('OLLAMA_CLOUD_HOST') ||
        'https://api.olama.ai';
      this.ollamaModel =
        this.configService.get<string>('OLLAMA_CLOUD_MODEL') || 'llama2:13b';
    } else {
      // Development: Use local Ollama
      this.ollamaHost =
        this.configService.get<string>('OLLAMA_LOCAL_HOST') ||
        'http://localhost:11434';
      this.ollamaModel =
        this.configService.get<string>('OLLAMA_LOCAL_MODEL') || 'llama2';
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
        // FIX 2: Was hardcoded to 'llama2', now correctly uses this.ollamaModel
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
}
