import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../models/user.model';
import { LoginDto, CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { Op } from 'sequelize';

import {
  ForgotPasswordDto as IDBForgotPasswordDto,
  ResetPasswordDto as IDBResetPasswordDto,
} from '../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private jwtService: JwtService,
  ) {}

  async createSuperAdmin(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    const existingUser = await this.userModel.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
      role: UserRole.SUPERADMIN,
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
    const user = await this.userModel.findOne({
      where: { email: loginDto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account has been suspended');
    }

    const token = this.generateToken(user);
    const { password: _, ...userResponse } = user.toJSON();
    return { user: userResponse as User, token };
  }

  async signupLearner(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    const existingUser = await this.userModel.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
      role: UserRole.LEARNER,
    });

    const token = this.generateToken(user);
    const { password: _, ...userResponse } = user.toJSON();
    return { user: userResponse as User, token };
  }

  async createUser(
    createUserDto: CreateUserDto,
    currentUserRole: UserRole,
  ): Promise<User> {
    // Role Creation Restrictions:
    // - Admin can only create Tutors and Learners.
    // - SuperAdmin can create Admins, Tutors, and Learners.
    if (currentUserRole === UserRole.ADMIN) {
      if (
        createUserDto.role === UserRole.SUPERADMIN ||
        createUserDto.role === UserRole.ADMIN
      ) {
        throw new ForbiddenException(
          'Admins can only create Tutors or Learners',
        );
      }
    } else if (currentUserRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Unauthorized to create users');
    }

    if (createUserDto.role === UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        'Cannot create more Super Admins via this endpoint',
      );
    }

    const existingUser = await this.userModel.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const { password: _, ...userResponse } = user.toJSON();
    return userResponse as User;
  }

  async findAllUsers(
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<User[]> {
    const where: any = {};

    // Filter based on role:
    // - Admin sees everything except SuperAdmins.
    // - SuperAdmin sees everything.
    if (currentUserRole === UserRole.ADMIN) {
      where.role = { [Op.ne]: UserRole.SUPERADMIN };
    }

    const users = await this.userModel.findAll({
      where,
      attributes: { exclude: ['password'] },
    });
    return users;
  }

  async findOneUser(
    id: string,
    currentUserRole: UserRole,
    currentUserId: string,
  ): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Permission check: (Self || Admin || SuperAdmin)
    const isOwner = user.id === currentUserId;
    const isSuperAdmin = currentUserRole === UserRole.SUPERADMIN;
    const isAdmin = currentUserRole === UserRole.ADMIN;

    if (!isOwner && !isSuperAdmin && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    // Admins cannot see SuperAdmins
    if (
      user.role === UserRole.SUPERADMIN &&
      currentUserRole === UserRole.ADMIN &&
      !isOwner
    ) {
      throw new ForbiddenException('Access denied');
    }

    const { password: _, ...userResponse } = user.toJSON();
    return userResponse as User;
  }

  async updateOtherUser(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserRole: UserRole,
    currentUserId: string,
  ): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Permission check: (Self || Admin || SuperAdmin)
    const isOwner = user.id === currentUserId;
    const isSuperAdmin = currentUserRole === UserRole.SUPERADMIN;
    const isAdmin = currentUserRole === UserRole.ADMIN;

    if (!isOwner && !isSuperAdmin && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    // Admins cannot edit SuperAdmins
    if (
      user.role === UserRole.SUPERADMIN &&
      currentUserRole === UserRole.ADMIN &&
      !isOwner
    ) {
      throw new ForbiddenException('Cannot edit a Super Admin');
    }

    // Prevent promoting to SuperAdmin
    if (updateUserDto.role === UserRole.SUPERADMIN && !isSuperAdmin) {
      throw new ForbiddenException('Cannot promote to Super Admin');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await user.update(updateUserDto);
    const { password: _, ...userResponse } = user.toJSON();
    return userResponse as User;
  }

  async deleteUser(
    id: string,
    currentUserRole: UserRole,
    currentUserId: string,
  ): Promise<void> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Permission check: (Self || Admin || SuperAdmin)
    const isOwner = user.id === currentUserId;
    const isSuperAdmin = currentUserRole === UserRole.SUPERADMIN;
    const isAdmin = currentUserRole === UserRole.ADMIN;

    if (!isOwner && !isSuperAdmin && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    // Restrictions on deleting SuperAdmins
    if (user.role === UserRole.SUPERADMIN && !isSuperAdmin) {
      throw new ForbiddenException('Cannot delete a Super Admin');
    }

    // Archive the user
    user.status = UserStatus.SUSPENDED;
    await user.save();

    // Perform soft delete (archive)
    await user.destroy();
  }

  async forgotPassword(
    forgotPasswordDto: IDBForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      where: { email: forgotPasswordDto.email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a random token
    const resetToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    return { message: `Password reset token generated: ${resetToken}` };
  }

  async resetPassword(
    resetPasswordDto: IDBResetPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      where: {
        email: resetPasswordDto.email,
        resetPasswordToken: resetPasswordDto.token,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return { message: 'Password has been reset successfully' };
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await user.update(updateUserDto);
    return user;
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
