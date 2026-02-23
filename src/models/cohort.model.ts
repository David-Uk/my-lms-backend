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
import { Course } from './course.model';
import { Enrollment } from './enrollment.model';
import { Attendance } from './attendance.model';
// import { Enrollment } from './enrollment.model';

@Table({
  tableName: 'cohorts',
  timestamps: true,
  paranoid: true,
})
export class Cohort extends Model<Cohort> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Course)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  courseId: string;

  @BelongsTo(() => Course)
  course: Course;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
  })
  name: string;

  @AllowNull(false)
  @Column({
    type: DataType.DATE,
  })
  startDate: Date;

  @AllowNull(false)
  @Column({
    type: DataType.DATE,
  })
  endDate: Date;

  @HasMany(() => Enrollment)
  enrollments: Enrollment[];

  @HasMany(() => Attendance)
  attendances: Attendance[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
