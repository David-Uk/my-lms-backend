import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  IsArray,
  Min,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentType, QuestionType } from '../models';

export class CreateAssessmentDto {
  @ApiProperty({
    enum: AssessmentType,
    description: 'Type of assessment',
  })
  @IsNotEmpty()
  @IsEnum(AssessmentType)
  type: AssessmentType;

  @ApiProperty({
    example: 'Final Quiz',
    description: 'Title of the assessment',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Please answer all questions carefully.',
    description: 'Instructions for the assessment',
  })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class UpdateAssessmentDto {
  @ApiPropertyOptional({
    enum: AssessmentType,
    description: 'Type of assessment',
  })
  @IsOptional()
  @IsEnum(AssessmentType)
  type?: AssessmentType;

  @ApiPropertyOptional({
    example: 'Updated Quiz Title',
    description: 'Title of the assessment',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated instructions.',
    description: 'Instructions for the assessment',
  })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreateQuizDto {
  @ApiProperty({ example: 30, description: 'Time allocated in minutes' })
  @IsInt()
  @Min(1)
  timeAllocated: number;

  @ApiProperty({ example: 70, description: 'Pass mark percentage' })
  @Min(0)
  passMark: number;

  @ApiPropertyOptional({ example: false, description: 'Is it a group quiz?' })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({
    example: '123456',
    description: 'PIN for group sessions',
  })
  @IsOptional()
  @IsString()
  groupPin?: string;
}

export class CreateCodeChallengeDto {
  @ApiProperty({ example: 'typescript', description: 'Programming language' })
  @IsNotEmpty()
  @IsString()
  language: string;

  @ApiProperty({
    example: 'Write a function that returns the sum of two numbers.',
    description: 'Problem statement',
  })
  @IsNotEmpty()
  @IsString()
  problemStatement: string;

  @ApiPropertyOptional({
    example: 'function sum(a, b) {\n  return a + b;\n}',
    description: 'Boilerplate code',
  })
  @IsOptional()
  @IsString()
  boilerplateCode?: string;

  @ApiProperty({
    example: [{ input: '1, 2', expectedOutput: '3', isHidden: false }],
    description: 'Test cases',
  })
  @IsArray()
  testCases: any[];
}

export class CreateQuizQuestionDto {
  @ApiProperty({ enum: QuestionType, description: 'Type of question' })
  @IsNotEmpty()
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ example: 'What is 2+2?', description: 'The question text' })
  @IsNotEmpty()
  @IsString()
  question: string;

  @ApiPropertyOptional({
    example: ['1', '2', '3', '4'],
    description: 'Options for multiple choice',
  })
  @IsOptional()
  options?: any;

  @ApiProperty({ example: '4', description: 'The correct answer' })
  @IsNotEmpty()
  correctAnswer: any;

  @ApiPropertyOptional({ example: 1, description: 'Marks for this question' })
  @IsOptional()
  @Min(0)
  marks?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Time limit for this question in seconds',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimit?: number;
}

export class CreateQuizSessionDto {
  @ApiProperty({ example: 'uuid-of-quiz', description: 'ID of the quiz' })
  @IsUUID()
  quizId: string;

  @ApiProperty({ example: 'uuid-of-cohort', description: 'ID of the cohort' })
  @IsUUID()
  cohortId: string;
}

export class SubmitQuizAnswerDto {
  @ApiProperty({
    example: 'uuid-of-question',
    description: 'ID of the question',
  })
  @IsUUID()
  questionId: string;

  @ApiProperty({ example: 'Option A', description: 'The chosen answer' })
  answer: any;

  @ApiProperty({
    example: 1500,
    description: 'Response time in milliseconds',
  })
  @IsInt()
  @Min(0)
  responseTimeMs: number;
}

export class SubmitCodeChallengeDto {
  @ApiProperty({
    example: 'function sum(a, b) {\n  return a + b;\n}',
    description: 'The submitted code',
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class CreateStandaloneQuizDto {
  @ApiProperty({
    example: 'JavaScript Fundamentals',
    description: 'Quiz title',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Test your JavaScript knowledge',
    description: 'Quiz description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 30, description: 'Time allocated in minutes' })
  @IsInt()
  @Min(1)
  timeAllocated: number;

  @ApiProperty({ example: 70, description: 'Pass mark percentage' })
  @IsInt()
  @Min(0)
  passMark: number;
}

export class InviteParticipantDto {
  @ApiProperty({ example: 'John Doe', description: 'Participant name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Participant email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class InviteParticipantsBulkDto {
  @ApiProperty({
    example: [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' },
    ],
    description: 'Array of participants to invite',
  })
  @IsArray()
  @IsNotEmpty()
  participants: InviteParticipantDto[];
}

export class StartQuizDto {
  @ApiProperty({
    example: 'uuid-of-quiz',
    description: 'Quiz ID from email link',
  })
  @IsUUID()
  quizId: string;

  @ApiProperty({
    example: 'uuid-of-token',
    description: 'Access token from email',
  })
  @IsUUID()
  token: string;

  @ApiPropertyOptional({
    example: 'abc123def456',
    description: 'Device fingerprint for session locking',
  })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

export class SubmitAnswerDto {
  @ApiProperty({
    example: 'uuid-of-question',
    description: 'Question ID',
  })
  @IsUUID()
  questionId: string;

  @ApiProperty({ example: 'Option A', description: 'The answer' })
  @IsNotEmpty()
  answer: any;
}

export class CopyQuestionDto {
  @ApiProperty({
    example: 'uuid-of-source-question',
    description: 'ID of the question to copy',
  })
  @IsUUID()
  sourceQuestionId: string;
}
