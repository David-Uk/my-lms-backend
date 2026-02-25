import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CourseLevel, ContentType } from '../models';

// ── Course Content DTOs ──

export class CreateCourseContentDto {
  @ApiProperty({
    example: 'Module 1: Getting Started',
    description: 'Content topic',
  })
  @IsNotEmpty()
  @IsString()
  topic: string;

  @ApiProperty({ enum: ContentType, description: 'Type of content' })
  @IsNotEmpty()
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiPropertyOptional({ example: 1, description: 'Order of priority' })
  @IsInt()
  @Min(0)
  @IsOptional()
  sequenceOrder?: number;

  @ApiPropertyOptional({
    example: 'uuid-of-parent',
    description: 'Parent content ID for nested sections',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class UpdateCourseContentDto {
  @ApiPropertyOptional({
    example: 'Module 1: Updated Topic',
    description: 'Content topic',
  })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiPropertyOptional({ enum: ContentType, description: 'Type of content' })
  @IsEnum(ContentType)
  @IsOptional()
  contentType?: ContentType;

  @ApiPropertyOptional({ example: 2, description: 'Order of priority' })
  @IsInt()
  @Min(0)
  @IsOptional()
  sequenceOrder?: number;

  @ApiPropertyOptional({
    example: 'uuid-of-parent',
    description: 'Parent content ID',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}

// ── Course DTOs ──

export class CreateCourseDto {
  @ApiProperty({
    example: 'Introduction to TypeScript',
    description: 'Course title',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Learn TypeScript from scratch',
    description: 'Course description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: CourseLevel,
    example: CourseLevel.BEGINNER,
    description: 'Difficulty level',
  })
  @IsNotEmpty()
  @IsEnum(CourseLevel)
  difficultyLevel: CourseLevel;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({
    example: 'Advanced TypeScript',
    description: 'Course title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Deep dive into TypeScript',
    description: 'Course description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: CourseLevel, description: 'Difficulty level' })
  @IsEnum(CourseLevel)
  @IsOptional()
  difficultyLevel?: CourseLevel;
}

// ── Tutor Assignment DTOs ──

export class AssignTutorDto {
  @ApiProperty({
    example: 'uuid-of-tutor',
    description: 'ID of the tutor to assign',
  })
  @IsNotEmpty()
  @IsUUID()
  tutorId: string;
}

export class BulkAssignTutorsDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'Array of tutor IDs to assign',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  tutorIds: string[];
}

// ── Learner Enrollment DTOs ──

export class EnrollLearnerDto {
  @ApiProperty({
    example: 'uuid-of-learner',
    description: 'ID of the learner to enroll',
  })
  @IsNotEmpty()
  @IsUUID()
  learnerId: string;

  @ApiProperty({
    example: 'uuid-of-cohort',
    description: 'ID of the cohort to enroll into',
  })
  @IsNotEmpty()
  @IsUUID()
  cohortId: string;
}

export class BulkEnrollLearnersDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'Array of learner IDs to enroll',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  learnerIds: string[];

  @ApiProperty({
    example: 'uuid-of-cohort',
    description: 'ID of the cohort to enroll into',
  })
  @IsNotEmpty()
  @IsUUID()
  cohortId: string;
}

// ── Pagination / Query DTOs ──

export class CourseQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'typescript',
    description: 'Search by title',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: CourseLevel,
    description: 'Filter by difficulty level',
  })
  @IsOptional()
  @IsEnum(CourseLevel)
  difficultyLevel?: CourseLevel;
}
