import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  IsEmail,
  Unique,
  AllowNull,
  Default,
} from 'sequelize-typescript';

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  TUTOR = 'tutor',
  LEARNER = 'learner',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface UserCreationAttributes {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
  status?: UserStatus;
  phoneNumber?: string | null;
  profilePicture?: string | null;
  bio?: string | null;
  lastLoginAt?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
}

@Table({
  tableName: 'users',
  timestamps: true,
  paranoid: true, // Enables soft deletes
})
export class User extends Model<User, UserCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
  })
  firstName: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
  })
  lastName: string;

  @Unique
  @IsEmail
  @AllowNull(false)
  @Column({
    type: DataType.STRING(255),
  })
  email: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(255),
  })
  password: string;

  @AllowNull(false)
  @Default(UserRole.LEARNER)
  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
  })
  role: UserRole;

  @Default(UserStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
  })
  status: UserStatus;

  @Column({
    type: DataType.STRING(20),
  })
  phoneNumber: string | null;

  @Column({
    type: DataType.TEXT,
  })
  profilePicture: string | null;

  @Column({
    type: DataType.TEXT,
  })
  bio: string | null;

  @Column({
    type: DataType.DATE,
  })
  lastLoginAt: Date | null;

  @Column({
    type: DataType.STRING(255),
  })
  resetPasswordToken: string | null;

  @Column({
    type: DataType.DATE,
  })
  resetPasswordExpires: Date | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  emailVerified: boolean;

  @Column({
    type: DataType.STRING(255),
  })
  emailVerificationToken: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date;

  // Virtual field to get full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Method to check if user is superadmin
  isSuperAdmin(): boolean {
    return this.role === UserRole.SUPERADMIN;
  }

  // Method to check if user is admin or superadmin
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.SUPERADMIN;
  }

  // Method to check if user is tutor
  isTutor(): boolean {
    return this.role === UserRole.TUTOR;
  }

  // Method to check if user is learner
  isLearner(): boolean {
    return this.role === UserRole.LEARNER;
  }

  // Method to check if user has specific role
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  // Method to check if user can access admin features
  canAccessAdmin(): boolean {
    return this.isAdmin() || this.isSuperAdmin();
  }
}
