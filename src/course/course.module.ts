import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import {
  Course,
  CourseTutor,
  CourseContent,
  Cohort,
  Enrollment,
  User,
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
    ]),
  ],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
