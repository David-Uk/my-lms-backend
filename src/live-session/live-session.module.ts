import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LiveSessionController } from './live-session.controller';
import { LiveSessionService } from './live-session.service';
import {
  LiveSession,
  Course,
  Cohort,
  Enrollment,
  CourseTutor,
  User,
} from '../models';

@Module({
  imports: [
    SequelizeModule.forFeature([
      LiveSession,
      Course,
      Cohort,
      Enrollment,
      CourseTutor,
      User,
    ]),
  ],
  controllers: [LiveSessionController],
  providers: [LiveSessionService],
  exports: [LiveSessionService],
})
export class LiveSessionModule {}
