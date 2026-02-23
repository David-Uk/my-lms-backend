import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  AllowNull,
  Default,
} from 'sequelize-typescript';
import { Enrollment } from './enrollment.model';
import { Lesson } from './lesson.model';

@Table({
  tableName: 'lesson_progress',
  timestamps: true,
  paranoid: false, // Usually don't need soft deletes for progress logs, but can add if needed
})
export class LessonProgress extends Model<LessonProgress> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Enrollment)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  enrollmentId: string;

  @BelongsTo(() => Enrollment)
  enrollment: Enrollment;

  @ForeignKey(() => Lesson)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  lessonId: string;

  @BelongsTo(() => Lesson)
  lesson: Lesson;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
  })
  isCompleted: boolean;

  @Column({
    type: DataType.DATE,
  })
  completedAt: Date;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
