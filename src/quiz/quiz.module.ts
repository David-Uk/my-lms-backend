import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StandaloneQuizController } from './standalone-quiz.controller';
import { StandaloneQuizService } from './standalone-quiz.service';
import {
  Quiz,
  QuizQuestion,
  QuizParticipant,
  QuizAccessToken,
  QuizResponse,
} from '../models';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Quiz,
      QuizQuestion,
      QuizParticipant,
      QuizAccessToken,
      QuizResponse,
    ]),
  ],
  controllers: [StandaloneQuizController],
  providers: [StandaloneQuizService],
  exports: [StandaloneQuizService],
})
export class QuizModule {}
