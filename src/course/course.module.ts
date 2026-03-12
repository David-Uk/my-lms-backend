import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import {
  Course,
  CourseTutor,
  CourseContent,
  Cohort,
  Enrollment,
  User,
  Assessment,
  Quiz,
  QuizQuestion,
  CodeChallenge,
  QuizSession,
  QuizParticipantAnswer,
  CodeChallengeSubmission,
} from '../models';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Course,
      CourseTutor,
      CourseContent,
      Cohort,
      Enrollment,
      User,
      Assessment,
      Quiz,
      QuizQuestion,
      CodeChallenge,
      QuizSession,
      QuizParticipantAnswer,
      CodeChallengeSubmission,
    ]),
  ],
  controllers: [CourseController, AssessmentController],
  providers: [CourseService, AssessmentService],
  exports: [CourseService, AssessmentService],
})
export class CourseModule {}
