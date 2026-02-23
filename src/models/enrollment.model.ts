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
  HasMany,
  Default,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Cohort } from './cohort.model';
import { CourseContent } from './course-content.model';
import { LessonProgress } from './lesson-progress.model';
// import { LessonProgress } from './lesson-progress.model';

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

@Table({
  tableName: 'enrollments',
  timestamps: true,
  paranoid: true,
})
export class Enrollment extends Model<Enrollment> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  userId: string;

  @BelongsTo(() => User)
  learner: User;

  @ForeignKey(() => Cohort)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  cohortId: string;

  @BelongsTo(() => Cohort)
  cohort: Cohort;

  @ForeignKey(() => CourseContent)
  @AllowNull(true)
  @Column({
    type: DataType.UUID,
    comment: 'Pointer to where the learner stopped',
  })
  lastAccessedContentId: string;

  @BelongsTo(() => CourseContent)
  lastAccessedContent: CourseContent;

  @Default(EnrollmentStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...(Object.values(EnrollmentStatus) as string[])),
  })
  status: EnrollmentStatus;

  @HasMany(() => LessonProgress)
  lessonProgress: LessonProgress[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
