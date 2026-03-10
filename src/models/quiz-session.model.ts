import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
  AllowNull,
} from 'sequelize-typescript';
import { Quiz } from './quiz.model';
import { User } from './user.model';
import { Cohort } from './cohort.model';

export enum QuizSessionStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

@Table({
  tableName: 'quiz_sessions',
  timestamps: true,
  paranoid: true,
})
export class QuizSession extends Model<QuizSession> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Quiz)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  quizId: string;

  @BelongsTo(() => Quiz)
  quiz: Quiz;

  @ForeignKey(() => Cohort)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  cohortId: string;

  @BelongsTo(() => Cohort)
  cohort: Cohort;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  hostId: string;

  @BelongsTo(() => User)
  host: User;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(6),
  })
  pin: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...(Object.values(QuizSessionStatus) as string[])),
    defaultValue: QuizSessionStatus.WAITING,
  })
  status: QuizSessionStatus;

  @HasMany(() => QuizParticipantAnswer)
  answers: QuizParticipantAnswer[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}

@Table({
  tableName: 'quiz_participant_answers',
  timestamps: true,
})
export class QuizParticipantAnswer extends Model<QuizParticipantAnswer> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => QuizSession)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  quizSessionId: string;

  @BelongsTo(() => QuizSession)
  quizSession: QuizSession;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.UUID,
  })
  questionId: string;

  @Column({
    type: DataType.JSONB,
  })
  answer: any;

  @Column({
    type: DataType.BOOLEAN,
  })
  isCorrect: boolean;

  @Column({
    type: DataType.INTEGER,
    comment: 'Time taken to answer in milliseconds',
  })
  responseTimeMs: number;

  @Column({
    type: DataType.INTEGER,
    comment: 'Calculated points based on correctness and speed',
  })
  points: number;

  @CreatedAt
  declare createdAt: Date;
}
