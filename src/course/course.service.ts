import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  Course,
  CourseTutor,
  Cohort,
  Enrollment,
  User,
  UserRole,
  EnrollmentStatus,
} from '../models';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseQueryDto,
  AssignTutorDto,
  BulkAssignTutorsDto,
  EnrollLearnerDto,
  BulkEnrollLearnersDto,
} from '../dto/course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course)
    private courseModel: typeof Course,
    @InjectModel(CourseTutor)
    private courseTutorModel: typeof CourseTutor,
    @InjectModel(Cohort)
    private cohortModel: typeof Cohort,
    @InjectModel(Enrollment)
    private enrollmentModel: typeof Enrollment,
    @InjectModel(User)
    private userModel: typeof User,
    private sequelize: Sequelize,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  //  COURSE CRUD
  // ═══════════════════════════════════════════════════════════════

  async createCourse(
    createCourseDto: CreateCourseDto,
    creatorId: string,
  ): Promise<Course> {
    const course = await this.courseModel.create({
      ...createCourseDto,
      creatorId,
    } as any);
    return course;
  }

  async findAllCourses(query: CourseQueryDto) {
    const { page = 1, limit = 10, search, difficultyLevel } = query;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    if (difficultyLevel) {
      where.difficultyLevel = difficultyLevel;
    }

    // Optimised: use findAndCountAll for pagination metadata
    // Only select necessary columns from associations
    const { rows, count } = await this.courseModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      // Avoid Sequelize sub-query overhead when there is no HasMany include
      distinct: true,
    });

    return {
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findCourseById(id: string): Promise<Course> {
    const course = await this.courseModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: CourseTutor,
          include: [
            {
              model: User,
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
        {
          model: Cohort,
          attributes: ['id', 'name', 'startDate', 'endDate'],
        },
      ],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async updateCourse(
    id: string,
    updateCourseDto: UpdateCourseDto,
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<Course> {
    const course = await this.courseModel.findByPk(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Only creator, admin, or superadmin can update
    if (
      course.creatorId !== currentUserId &&
      currentUserRole !== UserRole.ADMIN &&
      currentUserRole !== UserRole.SUPERADMIN
    ) {
      throw new ForbiddenException('You do not have permission to update this course');
    }

    await course.update(updateCourseDto);
    return course;
  }

  async deleteCourse(
    id: string,
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<void> {
    const course = await this.courseModel.findByPk(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (
      course.creatorId !== currentUserId &&
      currentUserRole !== UserRole.ADMIN &&
      currentUserRole !== UserRole.SUPERADMIN
    ) {
      throw new ForbiddenException('You do not have permission to delete this course');
    }

    // Soft delete (paranoid mode)
    await course.destroy();
  }

  // ═══════════════════════════════════════════════════════════════
  //  TUTOR MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  async assignTutor(courseId: string, dto: AssignTutorDto): Promise<CourseTutor> {
    const [course, tutor] = await Promise.all([
      this.courseModel.findByPk(courseId, { attributes: ['id'] }),
      this.userModel.findByPk(dto.tutorId, { attributes: ['id', 'role'] }),
    ]);

    if (!course) throw new NotFoundException('Course not found');
    if (!tutor) throw new NotFoundException('User not found');
    if (tutor.role !== UserRole.TUTOR) {
      throw new BadRequestException('User is not a tutor');
    }

    // Check for existing assignment
    const existing = await this.courseTutorModel.findOne({
      where: { courseId, tutorId: dto.tutorId },
    });
    if (existing) {
      throw new ConflictException('Tutor is already assigned to this course');
    }

    return this.courseTutorModel.create({
      courseId,
      tutorId: dto.tutorId,
    } as any);
  }

  async bulkAssignTutors(
    courseId: string,
    dto: BulkAssignTutorsDto,
  ): Promise<{ assigned: number; skipped: number }> {
    const course = await this.courseModel.findByPk(courseId, { attributes: ['id'] });
    if (!course) throw new NotFoundException('Course not found');

    // Validate all users are tutors in a single query
    const tutors = await this.userModel.findAll({
      where: { id: { [Op.in]: dto.tutorIds }, role: UserRole.TUTOR },
      attributes: ['id'],
    });

    const validTutorIds = new Set(tutors.map((t) => t.id));
    const invalidIds = dto.tutorIds.filter((id) => !validTutorIds.has(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `The following IDs are not valid tutors: ${invalidIds.join(', ')}`,
      );
    }

    // Find existing assignments in one query
    const existingAssignments = await this.courseTutorModel.findAll({
      where: { courseId, tutorId: { [Op.in]: dto.tutorIds } },
      attributes: ['tutorId'],
    });
    const alreadyAssigned = new Set(existingAssignments.map((a) => a.tutorId));

    const newTutorIds = dto.tutorIds.filter((id) => !alreadyAssigned.has(id));

    if (newTutorIds.length > 0) {
      // Use bulkCreate for efficiency
      await this.courseTutorModel.bulkCreate(
        newTutorIds.map((tutorId) => ({ courseId, tutorId })) as any[],
      );
    }

    return {
      assigned: newTutorIds.length,
      skipped: alreadyAssigned.size,
    };
  }

  async removeTutor(courseId: string, tutorId: string): Promise<void> {
    const assignment = await this.courseTutorModel.findOne({
      where: { courseId, tutorId },
    });

    if (!assignment) {
      throw new NotFoundException('Tutor is not assigned to this course');
    }

    await assignment.destroy();
  }

  async getCourseTutors(courseId: string): Promise<User[]> {
    const course = await this.courseModel.findByPk(courseId, { attributes: ['id'] });
    if (!course) throw new NotFoundException('Course not found');

    const assignments = await this.courseTutorModel.findAll({
      where: { courseId },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'],
        },
      ],
    });

    return assignments.map((a) => a.tutor);
  }

  // ═══════════════════════════════════════════════════════════════
  //  LEARNER MANAGEMENT (via Enrollment / Cohort)
  // ═══════════════════════════════════════════════════════════════

  async enrollLearner(courseId: string, dto: EnrollLearnerDto): Promise<Enrollment> {
    // Validate course, cohort, and learner in parallel
    const [course, cohort, learner] = await Promise.all([
      this.courseModel.findByPk(courseId, { attributes: ['id'] }),
      this.cohortModel.findByPk(dto.cohortId, { attributes: ['id', 'courseId'] }),
      this.userModel.findByPk(dto.learnerId, { attributes: ['id', 'role'] }),
    ]);

    if (!course) throw new NotFoundException('Course not found');
    if (!cohort) throw new NotFoundException('Cohort not found');
    if (cohort.courseId !== courseId) {
      throw new BadRequestException('Cohort does not belong to this course');
    }
    if (!learner) throw new NotFoundException('User not found');
    if (learner.role !== UserRole.LEARNER) {
      throw new BadRequestException('User is not a learner');
    }

    // Check for existing enrollment
    const existing = await this.enrollmentModel.findOne({
      where: { userId: dto.learnerId, cohortId: dto.cohortId },
    });
    if (existing) {
      throw new ConflictException('Learner is already enrolled in this cohort');
    }

    return this.enrollmentModel.create({
      userId: dto.learnerId,
      cohortId: dto.cohortId,
      status: EnrollmentStatus.ACTIVE,
    } as any);
  }

  async bulkEnrollLearners(
    courseId: string,
    dto: BulkEnrollLearnersDto,
  ): Promise<{ enrolled: number; skipped: number }> {
    const [course, cohort] = await Promise.all([
      this.courseModel.findByPk(courseId, { attributes: ['id'] }),
      this.cohortModel.findByPk(dto.cohortId, { attributes: ['id', 'courseId'] }),
    ]);

    if (!course) throw new NotFoundException('Course not found');
    if (!cohort) throw new NotFoundException('Cohort not found');
    if (cohort.courseId !== courseId) {
      throw new BadRequestException('Cohort does not belong to this course');
    }

    // Validate all users are learners in one query
    const learners = await this.userModel.findAll({
      where: { id: { [Op.in]: dto.learnerIds }, role: UserRole.LEARNER },
      attributes: ['id'],
    });

    const validLearnerIds = new Set(learners.map((l) => l.id));
    const invalidIds = dto.learnerIds.filter((id) => !validLearnerIds.has(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `The following IDs are not valid learners: ${invalidIds.join(', ')}`,
      );
    }

    // Find existing enrollments in one query
    const existingEnrollments = await this.enrollmentModel.findAll({
      where: { userId: { [Op.in]: dto.learnerIds }, cohortId: dto.cohortId },
      attributes: ['userId'],
    });
    const alreadyEnrolled = new Set(existingEnrollments.map((e) => e.userId));

    const newLearnerIds = dto.learnerIds.filter((id) => !alreadyEnrolled.has(id));

    if (newLearnerIds.length > 0) {
      await this.enrollmentModel.bulkCreate(
        newLearnerIds.map((userId) => ({
          userId,
          cohortId: dto.cohortId,
          status: EnrollmentStatus.ACTIVE,
        })) as any[],
      );
    }

    return {
      enrolled: newLearnerIds.length,
      skipped: alreadyEnrolled.size,
    };
  }

  async removeLearner(courseId: string, cohortId: string, learnerId: string): Promise<void> {
    // Verify cohort belongs to course
    const cohort = await this.cohortModel.findByPk(cohortId, {
      attributes: ['id', 'courseId'],
    });
    if (!cohort) throw new NotFoundException('Cohort not found');
    if (cohort.courseId !== courseId) {
      throw new BadRequestException('Cohort does not belong to this course');
    }

    const enrollment = await this.enrollmentModel.findOne({
      where: { userId: learnerId, cohortId },
    });

    if (!enrollment) {
      throw new NotFoundException('Learner is not enrolled in this cohort');
    }

    // Update status to dropped and soft delete
    enrollment.status = EnrollmentStatus.DROPPED;
    await enrollment.save();
    await enrollment.destroy();
  }

  async getCourseLearners(
    courseId: string,
    cohortId?: string,
  ): Promise<{ cohortId: string; cohortName: string; learners: User[] }[]> {
    const course = await this.courseModel.findByPk(courseId, { attributes: ['id'] });
    if (!course) throw new NotFoundException('Course not found');

    const cohortWhere: any = { courseId };
    if (cohortId) {
      cohortWhere.id = cohortId;
    }

    const cohorts = await this.cohortModel.findAll({
      where: cohortWhere,
      attributes: ['id', 'name'],
      include: [
        {
          model: Enrollment,
          where: { status: EnrollmentStatus.ACTIVE },
          required: false,
          attributes: ['id', 'userId', 'status'],
          include: [
            {
              model: User,
              as: 'learner',
              attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'],
            },
          ],
        },
      ],
    });

    return cohorts.map((cohort) => ({
      cohortId: cohort.id,
      cohortName: cohort.name,
      learners: cohort.enrollments
        ? cohort.enrollments.map((e) => e.learner)
        : [],
    }));
  }
}
