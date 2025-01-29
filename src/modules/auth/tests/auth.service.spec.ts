import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
// import { GoogleAuthService } from '../google-auth.service';
import { ConfigService } from '@nestjs/config';
import { CustomHttpException } from '../../../helpers/custom-http-filter';
import { Response } from 'express';
import * as SYS_MSG from '../../../constant/SystemMessages';
import AuthenticationService from '../auth.service';
import UserService from '../../user/user.service';
import { CreateUserDTO } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let userService: UserService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: UserService,
          useValue: {
            getUserRecord: jest.fn(),
            createUser: jest.fn(),
            updateUserRecord: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked-jwt-token'),
            signAsync: jest.fn().mockResolvedValue('mocked-jwt-token'),
          },
        },
        // {
        //   provide: GoogleAuthService,
        //   useValue: {},
        // },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(3600000),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthenticationService>(AuthenticationService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('createNewUser', () => {
    it('should create a new user and return a JWT token', async () => {
      const createUserDto: CreateUserDTO = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        password: 'password123',
      };

      userService.getUserRecord = jest
        .fn()
        .mockResolvedValueOnce(null) // User does not exist
        .mockResolvedValueOnce({ id: '123', email: 'test@example.com', first_name: 'John', last_name: 'Doe' });

      userService.createUser = jest.fn().mockResolvedValue(undefined);

      const result = await authService.createNewUser(createUserDto);

      expect(userService.getUserRecord).toHaveBeenCalledTimes(2);
      expect(userService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(jwtService.sign).toHaveBeenCalledWith({ id: '123', sub: '123', email: 'test@example.com' });
      expect(result).toEqual({
        message: SYS_MSG.USER_CREATED_SUCCESSFULLY,
        access_token: 'mocked-jwt-token',
        data: {
          user: {
            id: '123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'test@example.com',
          },
        },
      });
    });

    it('should throw an error if user already exists', async () => {
      userService.getUserRecord = jest.fn().mockResolvedValue({ id: '123', email: 'test@example.com' });

      await expect(
        authService.createNewUser({
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          password: 'password123',
        })
      ).rejects.toThrow(new CustomHttpException(SYS_MSG.USER_ACCOUNT_EXIST, 400));
    });
  });

  describe('changePassword', () => {
    it('should update the user password', async () => {
      userService.getUserRecord = jest.fn().mockResolvedValue({ id: '123', password: 'oldHashedPassword' });
      userService.updateUserRecord = jest.fn().mockResolvedValue(undefined);

      const result = await authService.changePassword('123', 'oldPassword', 'newPassword');

      expect(userService.getUserRecord).toHaveBeenCalledWith({ identifier: '123', identifierType: 'id' });
      expect(userService.updateUserRecord).toHaveBeenCalledWith({
        updatePayload: { password: 'newPassword' },
        identifierOptions: { identifierType: 'id', identifier: '123' },
      });

      expect(result).toEqual({ message: 'Password updated' });
    });

    it('should throw an error if user is not found', async () => {
      userService.getUserRecord = jest.fn().mockResolvedValue(null);

      await expect(authService.changePassword('123', 'oldPassword', 'newPassword')).rejects.toThrow(
        new CustomHttpException(SYS_MSG.USER_NOT_FOUND, 404)
      );
    });
  });

  describe('loginUser', () => {
    it('should return an access token on successful login', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const user = { id: '123', email: 'test@example.com', first_name: 'John', last_name: 'Doe' };

      userService.getUserRecord = jest.fn().mockResolvedValue(user);
      jwtService.signAsync = jest.fn().mockResolvedValue('mocked-jwt-token');

      const mockResponse = { cookie: jest.fn() } as unknown as Response;
      const result = await authService.loginUser(loginDto, mockResponse);

      expect(userService.getUserRecord).toHaveBeenCalledWith({ identifier: loginDto.email, identifierType: 'email' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({ id: '123', sub: '123' });
      expect(mockResponse.cookie).toHaveBeenCalledWith('access_token', 'mocked-jwt-token', expect.any(Object));

      expect(result).toEqual({
        message: SYS_MSG.LOGIN_SUCCESSFUL,
        access_token: 'mocked-jwt-token',
        data: {
          id: '123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'test@example.com',
        },
      });
    });

    it('should throw an error if user is not found', async () => {
      userService.getUserRecord = jest.fn().mockResolvedValue(null);
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };

      await expect(authService.loginUser(loginDto, {} as Response)).rejects.toThrow(
        new CustomHttpException(SYS_MSG.INVALID_CREDENTIALS, 401)
      );
    });
  });
});
