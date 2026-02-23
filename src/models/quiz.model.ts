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
import { Assessment } from './assessment.model';
import { QuizQuestion } from './quiz-question.model';

@Table({
  tableName: 'quizzes',
  timestamps: true,
  paranoid: true,
})
export class Quiz extends Model<Quiz> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Assessment)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  assessmentId: string;

  @BelongsTo(() => Assessment)
  assessment: Assessment;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    comment: 'Time allocated in minutes',
  })
  timeAllocated: number;

  @AllowNull(false)
  @Column({
    type: DataType.FLOAT,
  })
  passMark: number;

  @HasMany(() => QuizQuestion)
  questions: QuizQuestion[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
