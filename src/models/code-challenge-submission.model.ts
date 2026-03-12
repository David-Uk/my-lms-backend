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
import { CodeChallenge } from './code-challenge.model';
import { User } from './user.model';

@Table({
  tableName: 'code_challenge_submissions',
  timestamps: true,
  paranoid: true,
})
export class CodeChallengeSubmission extends Model<CodeChallengeSubmission> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => CodeChallenge)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  challengeId: string;

  @BelongsTo(() => CodeChallenge)
  challenge: CodeChallenge;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
  })
  code: string;

  @Column({
    type: DataType.JSONB,
    comment: 'Results for each test case: { input, expected, output, error, status }',
  })
  results: any;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isPassed: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    comment: 'Number of test cases passed',
  })
  passedCount: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    comment: 'Total number of test cases',
  })
  totalCount: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;
}
