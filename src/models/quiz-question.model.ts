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
  AllowNull,
} from 'sequelize-typescript';
import { Quiz } from './quiz.model';

export enum QuestionType {
  SINGLE_OPTION = 'single_option',
  MULTIPLE_OPTION = 'multiple_option',
  TRUE_FALSE = 'true_false',
  IMAGE_MATCHING = 'image_matching',
  FILL_IN_THE_BLANK = 'fill_in_the_blank',
  SHORT_ANSWER = 'short_answer',
}

@Table({
  tableName: 'quiz_questions',
  timestamps: true,
  paranoid: true,
})
export class QuizQuestion extends Model<QuizQuestion> {
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

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...(Object.values(QuestionType) as string[])),
  })
  type: QuestionType;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
  })
  question: string;

  @Column({
    type: DataType.JSONB,
    comment: 'Stores options for multiple choice, matching pairs, etc.',
  })
  options: any;

  @AllowNull(false)
  @Column({
    type: DataType.JSONB,
    comment:
      'Stores the correct answer(s). Format depends on question type (string, array of strings, object mapping, etc.)',
  })
  correctAnswer: any;

  @AllowNull(false)
  @Column({
    type: DataType.FLOAT,
    defaultValue: 1,
  })
  marks: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
