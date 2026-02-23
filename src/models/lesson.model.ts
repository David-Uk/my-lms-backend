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
import { CourseContent } from './course-content.model';

@Table({
  tableName: 'lessons',
  timestamps: true,
  paranoid: true,
})
export class Lesson extends Model<Lesson> {
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
    type: DataType.TEXT,
  })
  content: string;

  @Column({
    type: DataType.STRING(50),
  })
  length: string;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
  })
  completionStatus: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
