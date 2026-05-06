import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AiService } from './ai.service';
import { AiController } from './ai.controller.js';
import { AiProcessor } from './ai.processor';
import {
  User,
  Enrollment,
  LessonProgress,
  QuizSession,
  QuizParticipantAnswer,
  Course,
  Assessment,
} from '../models';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([
      User,
      Enrollment,
      LessonProgress,
      QuizSession,
      QuizParticipantAnswer,
      Course,
      Assessment,
    ]),
  ],
  providers: [AiService, AiProcessor],
  controllers: [AiController],
})
export class AiModule {}
