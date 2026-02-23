import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request as NestRequest,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../models';
import { CourseService } from './course.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseQueryDto,
  AssignTutorDto,
  BulkAssignTutorsDto,
  EnrollLearnerDto,
  BulkEnrollLearnersDto,
} from '../dto/course.dto';

@ApiTags('Courses')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  // ═══════════════════════════════════════════════════════════════
  //  COURSE CRUD
  // ═══════════════════════════════════════════════════════════════

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @NestRequest() req: Request & { user: { userId: string } },
  ) {
    return this.courseService.createCourse(createCourseDto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR, UserRole.LEARNER)
  @ApiOperation({ summary: 'Get all courses (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of courses.' })
  async findAll(@Query() query: CourseQueryDto) {
    return this.courseService.findAllCourses(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR, UserRole.LEARNER)
  @ApiOperation({ summary: 'Get a course by ID' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course details.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async findOne(@Param('id') id: string) {
    return this.courseService.findCourseById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a course (Admin only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course updated.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @NestRequest() req: Request & { user: { userId: string; role: UserRole } },
  ) {
    return this.courseService.updateCourse(id, updateCourseDto, req.user.userId, req.user.role);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a course (Admin only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course deleted.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async remove(
    @Param('id') id: string,
    @NestRequest() req: Request & { user: { userId: string; role: UserRole } },
  ) {
    await this.courseService.deleteCourse(id, req.user.userId, req.user.role);
    return { message: 'Course deleted successfully' };
  }

  // ═══════════════════════════════════════════════════════════════
  //  TUTOR MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  @Get(':id/tutors')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all tutors for a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'List of tutors.' })
  async getTutors(@Param('id') id: string) {
    return this.courseService.getCourseTutors(id);
  }

  @Post(':id/tutors')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a tutor to a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Tutor assigned.' })
  @ApiResponse({ status: 404, description: 'Course or tutor not found.' })
  @ApiResponse({ status: 409, description: 'Tutor already assigned.' })
  async assignTutor(
    @Param('id') id: string,
    @Body() dto: AssignTutorDto,
  ) {
    return this.courseService.assignTutor(id, dto);
  }

  @Post(':id/tutors/bulk')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk assign tutors to a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Tutors assigned.' })
  async bulkAssignTutors(
    @Param('id') id: string,
    @Body() dto: BulkAssignTutorsDto,
  ) {
    return this.courseService.bulkAssignTutors(id, dto);
  }

  @Delete(':id/tutors/:tutorId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a tutor from a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiParam({ name: 'tutorId', description: 'Tutor ID' })
  @ApiResponse({ status: 200, description: 'Tutor removed.' })
  @ApiResponse({ status: 404, description: 'Assignment not found.' })
  async removeTutor(
    @Param('id') id: string,
    @Param('tutorId') tutorId: string,
  ) {
    await this.courseService.removeTutor(id, tutorId);
    return { message: 'Tutor removed from course successfully' };
  }

  // ═══════════════════════════════════════════════════════════════
  //  LEARNER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  @Get(':id/learners')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Get all learners for a course (optionally by cohort)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiQuery({ name: 'cohortId', required: false, description: 'Filter by cohort ID' })
  @ApiResponse({ status: 200, description: 'List of learners grouped by cohort.' })
  async getLearners(
    @Param('id') id: string,
    @Query('cohortId') cohortId?: string,
  ) {
    return this.courseService.getCourseLearners(id, cohortId);
  }

  @Post(':id/learners')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Enroll a learner in a course cohort' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Learner enrolled.' })
  @ApiResponse({ status: 404, description: 'Course, cohort, or learner not found.' })
  @ApiResponse({ status: 409, description: 'Learner already enrolled.' })
  async enrollLearner(
    @Param('id') id: string,
    @Body() dto: EnrollLearnerDto,
  ) {
    return this.courseService.enrollLearner(id, dto);
  }

  @Post(':id/learners/bulk')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk enroll learners in a course cohort' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Learners enrolled.' })
  async bulkEnrollLearners(
    @Param('id') id: string,
    @Body() dto: BulkEnrollLearnersDto,
  ) {
    return this.courseService.bulkEnrollLearners(id, dto);
  }

  @Delete(':id/learners/:cohortId/:learnerId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a learner from a course cohort' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiParam({ name: 'learnerId', description: 'Learner ID' })
  @ApiResponse({ status: 200, description: 'Learner removed.' })
  @ApiResponse({ status: 404, description: 'Enrollment not found.' })
  async removeLearner(
    @Param('id') id: string,
    @Param('cohortId') cohortId: string,
    @Param('learnerId') learnerId: string,
  ) {
    await this.courseService.removeLearner(id, cohortId, learnerId);
    return { message: 'Learner removed from cohort successfully' };
  }
}
