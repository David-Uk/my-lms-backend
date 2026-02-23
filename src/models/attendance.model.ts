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
  Default,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Cohort } from './cohort.model';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

@Table({
  tableName: 'attendances',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'cohortId', 'trainingDate'],
      name: 'unique_attendance_per_day',
    },
  ],
})
export class Attendance extends Model<Attendance> {
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
    comment: 'The learner whose attendance is being tracked',
  })
  userId: string;

  @BelongsTo(() => User, 'userId')
  learner: User;

  @ForeignKey(() => Cohort)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    comment: 'The cohort (course instance) this attendance belongs to',
  })
  cohortId: string;

  @BelongsTo(() => Cohort)
  cohort: Cohort;

  @AllowNull(false)
  @Column({
    type: DataType.DATEONLY,
    comment: 'The specific training day',
  })
  trainingDate: string;

  @Default(AttendanceStatus.ABSENT)
  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...(Object.values(AttendanceStatus) as string[])),
  })
  status: AttendanceStatus;

  @Column({
    type: DataType.TEXT,
    comment: 'Optional remark or reason for absence/lateness',
  })
  remark: string | null;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column({
    type: DataType.UUID,
    comment: 'The admin/tutor who marked this attendance',
  })
  markedById: string | null;

  @BelongsTo(() => User, 'markedById')
  markedBy: User;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
