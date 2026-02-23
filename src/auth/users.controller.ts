import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Request as NestRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '../models/user.model';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin/SuperAdmin only)' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires Admin or SuperAdmin role.',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @NestRequest() req: Request & { user: { role: UserRole } },
  ) {
    return this.authService.createUser(createUserDto, req.user.role);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin/SuperAdmin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all users.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires Admin or SuperAdmin role.',
  })
  async findAll(
    @NestRequest() req: Request & { user: { userId: string; role: UserRole } },
  ) {
    return this.authService.findAllUsers(req.user.userId, req.user.role);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR, UserRole.LEARNER)
  @ApiOperation({ summary: 'Get a specific user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'The found user.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden.',
  })
  async findOne(
    @Param('id') id: string,
    @NestRequest() req: Request & { user: { userId: string; role: UserRole } },
  ) {
    return this.authService.findOneUser(id, req.user.role, req.user.userId);
  }

  @Put(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR, UserRole.LEARNER)
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @NestRequest() req: Request & { user: { userId: string; role: UserRole } },
  ) {
    return this.authService.updateOtherUser(
      id,
      updateUserDto,
      req.user.role,
      req.user.userId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR, UserRole.LEARNER)
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  async remove(
    @Param('id') id: string,
    @NestRequest() req: Request & { user: { userId: string; role: UserRole } },
  ) {
    return this.authService.deleteUser(id, req.user.role, req.user.userId);
  }
}
