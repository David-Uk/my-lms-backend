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
  HasMany,
  AllowNull,
} from 'sequelize-typescript';
import { Course } from './course.model';
import { Lesson } from './lesson.model';

export enum ContentType {
  SECTION = 'section',
  LESSON = 'lesson',
  ASSESSMENT = 'assessment',
}

@Table({
  tableName: 'course_contents',
  timestamps: true,
  paranoid: true,
})
export class CourseContent extends Model<CourseContent> {
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
    type: DataType.STRING(255),
  })
  topic: string;

  @ForeignKey(() => CourseContent)
  @AllowNull(true)
  @Column({
    type: DataType.UUID,
  })
  parentId: string;

  @BelongsTo(() => CourseContent)
  parent: CourseContent;

  @HasMany(() => CourseContent)
  children: CourseContent[];

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...(Object.values(ContentType) as string[])),
  })
  contentType: ContentType;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  sequenceOrder: number;

  @HasOne(() => Lesson)
  lesson: Lesson;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
