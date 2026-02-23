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
import { User } from './user.model';
import { Course } from './course.model';

@Table({
  tableName: 'course_tutors',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['tutorId', 'courseId'],
      name: 'unique_tutor_per_course',
    },
  ],
})
export class CourseTutor extends Model<CourseTutor> {
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
  tutorId: string;

  @BelongsTo(() => User)
  tutor: User;

  @ForeignKey(() => Course)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  courseId: string;

  @BelongsTo(() => Course)
  course: Course;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
