import {
  Controller,
  Post,
  Body,
  UseGuards,
  Put,
  Request as NestRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto, UpdateUserDto } from '../dto/user.dto';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/auth.dto';
import { UserRole } from '../models/user.model';
import { JwtAuthGuard } from './jwt-auth.guard';

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('super-admin/signup')
  @ApiOperation({ summary: 'Create a super admin account' })
  @ApiResponse({ status: 201, description: 'The super admin has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.createSuperAdmin(createUserDto);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Create a learner account' })
  @ApiResponse({ status: 201, description: 'The learner has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async learnerSignup(@Body() createUserDto: CreateUserDto) {
    return this.authService.signupLearner(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login to the application' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if user exists.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successful.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateProfile(
    @NestRequest() req: Request & { user: { userId: string; role: UserRole } },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (req.user.role !== UserRole.SUPERADMIN) {
      updateUserDto.role = undefined;
      updateUserDto.status = undefined;
    }
    return this.authService.updateProfile(req.user.userId, updateUserDto);
  }
}
