import {
  Controller,
  Get,
  UseGuards,
  Request as NestRequest,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { UserRole } from './models';
import type { AuthenticatedRequest } from './common/types';
import { InjectModel } from '@nestjs/sequelize';
import { User, Course, Enrollment, CourseTutor, Cohort } from './models';
import { Op } from 'sequelize';

@ApiTags('Stats')
@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StatsController {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Course)
    private courseModel: typeof Course,
    @InjectModel(Enrollment)
    private enrollmentModel: typeof Enrollment,
    @InjectModel(CourseTutor)
    private courseTutorModel: typeof CourseTutor,
    @InjectModel(Cohort)
    private cohortModel: typeof Cohort,
  ) {}

  @Get('dashboard')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved.' })
  async getDashboardStats(@NestRequest() req: AuthenticatedRequest) {
    const where: any = {};

    // Filter based on role: Admin sees everything except SuperAdmins
    if (req.user.role === UserRole.ADMIN) {
      where.role = { [Op.ne]: UserRole.SUPERADMIN };
    }

    // Get total users count
    const totalUsers = await this.userModel.count({ where });

    // Get learners count
    const totalLearners = await this.userModel.count({
      where: { ...where, role: UserRole.LEARNER },
    });

    // Get active learners count
    const activeLearners = await this.userModel.count({
      where: {
        ...where,
        role: UserRole.LEARNER,
        status: 'active',
      },
    });

    // Get total courses
    const totalCourses = await this.courseModel.count();

    // Get total enrollments
    const totalEnrollments = await this.enrollmentModel.count();

    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await this.userModel.count({
      where: {
        ...where,
        createdAt: { [Op.gte]: startOfMonth },
      },
    });

    // Get new learners this month
    const newLearnersThisMonth = await this.userModel.count({
      where: {
        ...where,
        role: UserRole.LEARNER,
        createdAt: { [Op.gte]: startOfMonth },
      },
    });

    // Calculate completion rate based on enrollment status
    const completedEnrollments = await this.enrollmentModel.count({
      where: { status: 'completed' },
    });

    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    // Get tutors count
    const totalTutors = await this.userModel.count({
      where: { ...where, role: UserRole.TUTOR },
    });

    // Get active tutors
    const activeTutors = await this.userModel.count({
      where: {
        ...where,
        role: UserRole.TUTOR,
        status: 'active',
      },
    });

    return {
      totalUsers,
      totalLearners,
      activeLearners,
      totalCourses,
      totalEnrollments,
      newUsersThisMonth,
      newLearnersThisMonth,
      completionRate,
      totalTutors,
      activeTutors,
    };
  }

  @Get('tutors')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get tutor statistics' })
  @ApiResponse({ status: 200, description: 'Tutor stats retrieved.' })
  async getTutorStats(@NestRequest() req: AuthenticatedRequest) {
    const where: any = { role: UserRole.TUTOR };

    if (req.user.role === UserRole.ADMIN) {
      where.status = { [Op.ne]: UserRole.SUPERADMIN };
    }

    const totalTutors = await this.userModel.count({ where });
    const activeTutors = await this.userModel.count({
      where: { ...where, status: 'active' },
    });

    // Get courses with tutor assignments
    const coursesWithTutors = await this.courseTutorModel.count({
      distinct: true,
      col: 'courseId',
    });

    return {
      totalTutors,
      activeTutors,
      coursesWithTutors,
    };
  }

  @Get('learners')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TUTOR)
  @ApiOperation({ summary: 'Get learner statistics' })
  @ApiResponse({ status: 200, description: 'Learner stats retrieved.' })
  async getLearnerStats(@NestRequest() req: AuthenticatedRequest) {
    const where: any = { role: UserRole.LEARNER };

    if (req.user.role === UserRole.ADMIN) {
      where.status = { [Op.ne]: UserRole.SUPERADMIN };
    }

    const totalLearners = await this.userModel.count({ where });
    const activeLearners = await this.userModel.count({
      where: { ...where, status: 'active' },
    });

    // Get new learners this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newLearnersThisMonth = await this.userModel.count({
      where: {
        ...where,
        createdAt: { [Op.gte]: startOfMonth },
      },
    });

    // Calculate completion rate
    const totalEnrollments = await this.enrollmentModel.count();
    const completedEnrollments = await this.enrollmentModel.count({
      where: { status: 'completed' },
    });

    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    return {
      totalLearners,
      activeLearners,
      newLearnersThisMonth,
      completionRate,
    };
  }

  @Get('my-students')
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: "Get tutor's assigned students" })
  @ApiResponse({ status: 200, description: 'Students retrieved.' })
  async getMyStudents(
    @NestRequest() req: Request & { user: { userId: string } },
  ) {
    // Get all courses where this tutor is assigned
    const tutorCourses = await this.courseTutorModel.findAll({
      where: { tutorId: req.user.userId },
      include: [
        {
          model: Course,
          include: [
            {
              model: Cohort,
              include: [
                {
                  model: Enrollment,
                  include: [
                    {
                      model: User,
                      attributes: [
                        'id',
                        'firstName',
                        'lastName',
                        'email',
                        'status',
                        'createdAt',
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    // Extract unique students from all courses
    const studentsMap = new Map();

    for (const tutorCourse of tutorCourses) {
      const course = tutorCourse.course;
      if (course && course.cohorts) {
        for (const cohort of course.cohorts) {
          if (cohort.enrollments) {
            for (const enrollment of cohort.enrollments) {
              const student = enrollment.learner;
              if (student && !studentsMap.has(student.id)) {
                studentsMap.set(student.id, {
                  ...student.toJSON(),
                  enrollmentStatus: enrollment.status,
                  enrolledAt: enrollment.createdAt,
                  cohortName: cohort.name,
                  courseName: course.title,
                });
              }
            }
          }
        }
      }
    }

    return {
      students: Array.from(studentsMap.values()),
      totalStudents: studentsMap.size,
    };
  }

  @Get('learner-dashboard')
  @Roles(UserRole.LEARNER)
  @ApiOperation({ summary: 'Get learner dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Learner dashboard stats retrieved.',
  })
  async getLearnerDashboard(
    @NestRequest() req: Request & { user: { userId: string } },
  ) {
    const learnerId = req.user.userId;

    // Get all enrollments for this learner
    const enrollments = await this.enrollmentModel.findAll({
      where: { userId: learnerId },
      include: [
        {
          model: Cohort,
          include: [
            {
              model: Course,
              attributes: [
                'id',
                'title',
                'description',
                'thumbnail',
                'difficultyLevel',
              ],
            },
          ],
        },
      ],
    });

    // Get all course IDs the learner is enrolled in
    const courseIds = enrollments
      .map((e) => e.cohort?.course?.id)
      .filter(Boolean);

    // Get total active enrollments count
    const activeEnrollments = enrollments.filter(
      (e) => e.status === 'active',
    ).length;
    const completedEnrollments = enrollments.filter(
      (e) => e.status === 'completed',
    ).length;

    // Get lesson progress for this learner (would need LessonProgress model)
    // For now, calculate based on enrollment status
    const totalEnrollments = enrollments.length;
    const averageProgress =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    // Get recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentEnrollments = enrollments.filter(
      (e) => new Date(e.createdAt) >= thirtyDaysAgo,
    ).length;

    // Format enrolled courses with progress info
    const enrolledCourses = enrollments
      .map((enrollment) => ({
        id: enrollment.cohort?.course?.id || '',
        title: enrollment.cohort?.course?.title || 'Unknown Course',
        description: enrollment.cohort?.course?.description || '',
        difficultyLevel:
          enrollment.cohort?.course?.difficultyLevel || 'beginner',
        progress:
          enrollment.status === 'completed'
            ? 100
            : enrollment.status === 'active'
              ? 45
              : 10,
        status: enrollment.status,
        lastAccessed: enrollment.updatedAt,
        cohortName: enrollment.cohort?.name || '',
      }))
      .filter((c) => c.id !== '');

    return {
      stats: {
        totalEnrolled: totalEnrollments,
        activeCourses: activeEnrollments,
        completedCourses: completedEnrollments,
        averageProgress,
        recentEnrollments,
      },
      enrolledCourses,
    };
  }
}
