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
import { Cohort } from './cohort.model';

export enum LiveSessionStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Table({
  tableName: 'live_sessions',
  timestamps: true,
  paranoid: true,
})
export class LiveSession extends Model<LiveSession> {
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

  @ForeignKey(() => Cohort)
  @AllowNull(true)
  @Column({
    type: DataType.UUID,
  })
  cohortId: string;

  @BelongsTo(() => Cohort)
  cohort: Cohort;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  tutorId: string;

  @BelongsTo(() => User)
  tutor: User;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(255),
  })
  title: string;

  @Column({
    type: DataType.TEXT,
  })
  description: string;

  @Column({
    type: DataType.STRING(100),
  })
  meetingId: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...(Object.values(LiveSessionStatus) as string[])),
    defaultValue: LiveSessionStatus.SCHEDULED,
  })
  status: LiveSessionStatus;

  @Column({
    type: DataType.STRING(500),
  })
  recordingUrl: string;

  @Column({
    type: DataType.JSONB,
  })
  storageConfig: any;

  @AllowNull(false)
  @Column({
    type: DataType.DATE,
  })
  startTime: Date;

  @Column({
    type: DataType.DATE,
  })
  endTime: Date;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
