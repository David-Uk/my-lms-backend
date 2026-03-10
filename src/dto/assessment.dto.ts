import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentType } from '../models/assessment.model';

export class CreateAssessmentDto {
  @ApiProperty({ enum: AssessmentType, description: 'Type of assessment' })
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
  @ApiPropertyOptional({ enum: AssessmentType, description: 'Type of assessment' })
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
