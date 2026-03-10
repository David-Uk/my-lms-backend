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
  HasOne,
  AllowNull,
} from 'sequelize-typescript';
import { CourseContent } from './course-content.model';
import { Quiz } from './quiz.model';
import { CodeChallenge } from './code-challenge.model';

export enum AssessmentType {
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  GROUP_ASSIGNMENT = 'group_assignment',
  CODE_CHALLENGE = 'code_challenge',
  KAHOOT_QUIZ = 'kahoot_quiz',
}

@Table({
  tableName: 'assessments',
  timestamps: true,
  paranoid: true,
})
export class Assessment extends Model<Assessment> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => CourseContent)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  contentId: string;

  @BelongsTo(() => CourseContent)
  courseContent: CourseContent;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...(Object.values(AssessmentType) as string[])),
  })
  type: AssessmentType;

  @Column({
    type: DataType.STRING,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
  })
  instructions: string;

  @HasOne(() => Quiz)
  quiz: Quiz;

  @HasOne(() => CodeChallenge)
  codeChallenge: CodeChallenge;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
