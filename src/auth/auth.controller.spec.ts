import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto, UpdateUserDto } from '../dto/user.dto';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    createSuperAdmin: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.createSuperAdmin', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      };
      await controller.signup(dto);
      expect(mockAuthService.createSuperAdmin).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };
      await controller.login(dto);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword', async () => {
      const dto: ForgotPasswordDto = { email: 'test@example.com' };
      await controller.forgotPassword(dto);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword', async () => {
      const dto: ResetPasswordDto = {
        email: 'test@example.com',
        token: 'token',
        newPassword: 'new',
      };
      await controller.resetPassword(dto);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateProfile', () => {
    it('should call authService.updateProfile', async () => {
      const dto: UpdateUserDto = { firstName: 'Updated' };
      const req = { user: { userId: 'uuid-123' } } as any;
      await controller.updateProfile(req, dto);
      expect(mockAuthService.updateProfile).toHaveBeenCalledWith(
        'uuid-123',
        dto,
      );
    });
  });
});
