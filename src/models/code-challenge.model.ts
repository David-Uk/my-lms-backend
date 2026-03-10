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
import { Assessment } from './assessment.model';

@Table({
  tableName: 'code_challenges',
  timestamps: true,
  paranoid: true,
})
export class CodeChallenge extends Model<CodeChallenge> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Assessment)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  assessmentId: string;

  @BelongsTo(() => Assessment)
  assessment: Assessment;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
  })
  language: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
  })
  problemStatement: string;

  @Column({
    type: DataType.TEXT,
  })
  boilerplateCode: string;

  @AllowNull(false)
  @Column({
    type: DataType.JSONB,
    comment: 'Array of test cases: { input: string, expectedOutput: string, isHidden: boolean }',
  })
  testCases: any;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
