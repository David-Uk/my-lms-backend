import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Quiz } from './quiz.model';
import { QuizParticipant } from './quiz-participant.model';

@Table({
  tableName: 'quiz_responses',
  timestamps: true,
  paranoid: true,
})
export class QuizResponse extends Model<QuizResponse> {
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
  declare quizId: string;

  @BelongsTo(() => Quiz)
  quiz: Quiz;

  @ForeignKey(() => QuizParticipant)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  declare participantId: string;

  @BelongsTo(() => QuizParticipant)
  participant: QuizParticipant;

  @Column({
    type: DataType.UUID,
  })
  declare questionId: string;

  @AllowNull(false)
  @Column({
    type: DataType.JSONB,
  })
  declare answer: any;

  @AllowNull(true)
  @Column({
    type: DataType.BOOLEAN,
  })
  declare isCorrect: boolean | null;

  @AllowNull(true)
  @Column({
    type: DataType.FLOAT,
  })
  declare marksAwarded: number | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}