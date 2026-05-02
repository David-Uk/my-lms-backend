import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CourseModule } from './course/course.module';
import { AiModule } from './ai/ai.module';
import { QuizModule } from './quiz/quiz.module';
import { LiveSessionModule } from './live-session/live-session.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StatsController } from './stats.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  User,
  Course,
  CourseContent,
  Lesson,
  Cohort,
  Enrollment,
  LessonProgress,
  Assessment,
  Quiz,
  QuizQuestion,
  Attendance,
  CourseTutor,
  CodeChallenge,
  QuizSession,
  QuizParticipantAnswer,
  CodeChallengeSubmission,
  QuizParticipant,
  QuizAccessToken,
  QuizResponse,
  LiveSession,
} from './models';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    CourseModule,
    AiModule,
    QuizModule,
    LiveSessionModule,
    SequelizeModule.forFeature([User, Course, Enrollment, CourseTutor, Cohort]),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        autoLoadModels: true,
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
        models: [
          User,
          Course,
          CourseContent,
          Lesson,
          Cohort,
          Enrollment,
          LessonProgress,
          Assessment,
          Quiz,
          QuizQuestion,
          Attendance,
          CourseTutor,
          CodeChallenge,
          QuizSession,
          QuizParticipantAnswer,
          CodeChallengeSubmission,
          QuizParticipant,
          QuizAccessToken,
          QuizResponse,
          LiveSession,
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController, StatsController],
  providers: [AppService],
})
export class AppModule { }
