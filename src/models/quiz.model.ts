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
import { QuizParticipant } from './quiz-participant.model';

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

  @Column({
    type: DataType.STRING(255),
    comment: 'Title for standalone quizzes',
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    comment: 'Description for standalone quizzes',
  })
  declare description: string | null;

  @ForeignKey(() => Assessment)
  @AllowNull(true)
  @Column({
    type: DataType.UUID,
  })
  assessmentId: string | null;

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

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: 'Is this a group/kahoot quiz?',
  })
  isGroup: boolean;

  @Column({
    type: DataType.STRING(6),
    comment: 'Access PIN for group quiz sessions',
  })
  groupPin: string;

  @HasMany(() => QuizQuestion)
  questions: QuizQuestion[];

  @HasMany(() => QuizParticipant)
  participants: QuizParticipant[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
