import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ollama from 'ollama';

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

export interface Flashcards {
  flashcards: {
    front: string;
    back: string;
  }[];
}

@Injectable()
export class AiService {
  private ollamaHost: string;

  constructor(private configService: ConfigService) {
    this.ollamaHost =
      this.configService.get<string>('OLLAMA_HOST') || 'http://localhost:11434';
  }

  async transcribeAudio(_file: MulterFile): Promise<string> {
    // Ollama doesn't support audio transcription natively
    // For now, return a placeholder message
    throw new Error(
      'Audio transcription is not supported with Ollama. Consider using a separate service for audio processing.',
    );
  }

  async generateQuiz(topic: string): Promise<Quiz> {
    try {
      const prompt = `Generate a quiz on the topic: ${topic}. Provide 5 multiple-choice questions with 4 options each, and indicate the correct answer. Format as JSON with structure: { questions: [{ question: string, options: [string], correctAnswer: string }] }`;

      const response = await ollama.generate({
        model: 'llama2', // or any model you have installed
        prompt: prompt,
        options: {
          temperature: 0.7,
          num_predict: 1000,
        },
      });

      const content = response.response;
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as Quiz;
      } else {
        throw new Error('Failed to parse JSON from Ollama response');
      }
    } catch (error) {
      throw new Error(`Quiz generation failed: ${error.message}`);
    }
  }

  async generateFlashcards(topic: string): Promise<Flashcards> {
    try {
      const prompt = `Generate 10 flashcards on the topic: ${topic}. Each flashcard should have a front (question) and back (answer). Format as JSON with structure: { flashcards: [{ front: string, back: string }] }`;

      const response = await ollama.generate({
        model: 'llama2', // or any model you have installed
        prompt: prompt,
        options: {
          temperature: 0.7,
          num_predict: 1000,
        },
      });

      const content = response.response;
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as Flashcards;
      } else {
        throw new Error('Failed to parse JSON from Ollama response');
      }
    } catch (error) {
      throw new Error(`Flashcard generation failed: ${error.message}`);
    }
  }
}
