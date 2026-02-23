import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../models/user.model';
import { UnauthorizedException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let model: typeof User;
  let jwtService: JwtService;

  const mockUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.SUPERADMIN,
    save: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
  } as any;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    model = module.get<typeof User>(getModelToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSuperAdmin', () => {
    it('should create a new super admin', async () => {
      const createUserDto = { email: 'new@example.com', password: 'password123', name: 'Admin' };
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPassword'));

      const result = await service.createSuperAdmin(createUserDto as any);

      expect(result).toEqual({ user: mockUser, token: 'mock-token' });
      expect(mockUserModel.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already exists', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      await expect(service.createSuperAdmin({ email: 'test@example.com' } as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return user and token on successful login', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      mockUserModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.login(loginDto);

      expect(result).toEqual({ user: mockUser, token: 'mock-token' });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      await expect(service.login({ email: 'wrong@example.com', password: 'pw' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user is not a super admin', async () => {
      const regularUser = { ...mockUser, role: UserRole.INSTRUCTOR };
      mockUserModel.findOne.mockResolvedValue(regularUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      await expect(service.login({ email: 'test@example.com', password: 'password123' }))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('forgotPassword', () => {
    it('should generate a reset token', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      const result = await service.forgotPassword({ email: 'test@example.com' });
      expect(result.message).toContain('Password reset token generated');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      await expect(service.forgotPassword({ email: 'notfound@example.com' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('newHashedPassword'));

      const result = await service.resetPassword({ email: 'test@example.com', token: 'valid-token', newPassword: 'newPassword123' });

      expect(result.message).toBe('Password has been reset successfully');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      await expect(service.resetPassword({ email: 'test@example.com', token: 'invalid', newPassword: 'pw' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      const updateDto = { name: 'New Name' };

      const result = await service.updateProfile('uuid-123', updateDto as any);

      expect(result).toEqual(mockUser);
      expect(mockUser.update).toHaveBeenCalledWith(updateDto);
    });

    it('should hash password if provided in update', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      const updateDto = { password: 'newPassword' };
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('newHashedPassword'));

      await service.updateProfile('uuid-123', updateDto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);
      await expect(service.updateProfile('nonexistent', {}))
        .rejects.toThrow(NotFoundException);
    });
  });
});
