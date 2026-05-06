import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  Unique,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Quiz } from './quiz.model';

export enum QuizParticipantStatus {
  INVITED = 'invited',
  STARTED = 'started',
  COMPLETED = 'completed',
}

@Table({
  tableName: 'quiz_participants',
  timestamps: true,
  paranoid: true,
})
export class QuizParticipant extends Model<QuizParticipant> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
  })
  declare name: string;

  @Unique
  @AllowNull(false)
  @Column({
    type: DataType.STRING(255),
  })
  declare email: string;

  @ForeignKey(() => Quiz)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  declare quizId: string;

  @BelongsTo(() => Quiz)
  quiz: Quiz;

  @Column({
    type: DataType.ENUM(...Object.values(QuizParticipantStatus)),
    defaultValue: QuizParticipantStatus.INVITED,
  })
  declare status: QuizParticipantStatus;

  @Column({
    type: DataType.DATE,
    comment: 'When the participant started the quiz',
  })
  declare startedAt: Date | null;

  @Column({
    type: DataType.STRING(255),
    comment: 'Fingerprint of the device that started the quiz',
  })
  declare deviceFingerprint: string | null;

  @Column({
    type: DataType.STRING(500),
    comment: 'User agent when quiz was started',
  })
  declare deviceInfo: string | null;

  @Column({
    type: DataType.INTEGER,
    comment: 'Score achieved in the quiz',
  })
  declare score: number | null;

  @Column({
    type: DataType.FLOAT,
    comment: 'Percentage score',
  })
  declare percentageScore: number | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare passed: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    comment: 'Number of times the participant switched tabs during the quiz',
  })
  declare tabSwitchCount: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the quiz was auto-terminated due to a tab switch',
  })
  declare terminatedByTabSwitch: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
