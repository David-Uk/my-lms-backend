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
import { User } from './user.model';
import { CourseContent } from './course-content.model';
import { CourseTutor } from './course-tutor.model';
import { Cohort } from './cohort.model';

export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Table({
  tableName: 'courses',
  timestamps: true,
  paranoid: true,
})
export class Course extends Model<Course> {
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
  creatorId: string;

  @BelongsTo(() => User)
  creator: User;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(255),
  })
  title: string;

  @Column({
    type: DataType.TEXT,
  })
  description: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...(Object.values(CourseLevel) as string[])),
  })
  difficultyLevel: CourseLevel;

  @HasMany(() => CourseContent)
  contents: CourseContent[];

  @HasMany(() => CourseTutor)
  courseTutors: CourseTutor[];

  @HasMany(() => Cohort)
  cohorts: Cohort[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
