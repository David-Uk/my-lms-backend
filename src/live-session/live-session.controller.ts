import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request as NestRequest,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../common/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../models';
import { LiveSessionService } from './live-session.service';
import { CreateLiveSessionDto, UpdateLiveSessionDto } from '../dto/live-session.dto';

@ApiTags('Live Sessions')
@Controller('live-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LiveSessionController {
  constructor(private readonly liveSessionService: LiveSessionService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Create a new live session' })
  async create(
    @Body() dto: CreateLiveSessionDto,
    @NestRequest() req: AuthenticatedRequest,
  ) {
    return this.liveSessionService.createSession(dto, req.user.userId);
  }

  @Get('course/:courseId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR, UserRole.LEARNER)
  @ApiOperation({ summary: 'Get all live sessions for a course' })
  async findAllByCourse(@Param('courseId') courseId: string) {
    return this.liveSessionService.findAllByCourse(courseId);
  }

  @Get('join/:sessionId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR, UserRole.LEARNER)
  @ApiOperation({ summary: 'Get join details for a live session' })
  async join(
    @Param('sessionId') sessionId: string,
    @NestRequest() req: AuthenticatedRequest,
  ) {
    return this.liveSessionService.getSessionForJoin(
      sessionId,
      req.user.userId,
      req.user.role,
    );
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Update live session' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLiveSessionDto,
    @NestRequest() req: AuthenticatedRequest,
  ) {
    return this.liveSessionService.updateSession(id, dto, req.user.userId, req.user.role);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'VideoSDK Webhook' })
  async webhook(@Body() payload: any) {
    return this.liveSessionService.handleWebhook(payload);
  }
}
