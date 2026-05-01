import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Quiz } from './quiz.model';

@Table({
  tableName: 'quiz_access_tokens',
  timestamps: true,
  paranoid: true,
})
export class QuizAccessToken extends Model<QuizAccessToken> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(255),
    unique: true,
  })
  declare token: string;

  @ForeignKey(() => Quiz)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  declare quizId: string;

  @BelongsTo(() => Quiz)
  quiz: Quiz;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
  })
  declare participantName: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(255),
  })
  declare participantEmail: string;

  @AllowNull(false)
  @Column({
    type: DataType.DATE,
  })
  declare expiresAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare used: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}