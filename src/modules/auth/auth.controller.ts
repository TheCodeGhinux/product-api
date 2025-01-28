import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import * as SYS_MSG from '@constant/SystemMessages';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
  Get,
  Patch,
  Query,
} from '@nestjs/common';
import { CreateUserDTO } from '@auth/dto/create-user.dto';
import { skipAuth } from '@helpers/skipAuth';
import AuthenticationService from '@auth/auth.service';
import { LoginResponseDto } from '@auth/dto/login-response.dto';
import { LoginDto } from '@auth/dto/login.dto';
import { RequestSigninTokenDto } from '@auth/dto/request-signin-token.dto';
import GoogleAuthPayload from '@auth/interfaces/GoogleAuthPayloadInterface';
import { ChangePasswordDto } from '@auth/dto/change-password.dto';
import {
  ChangePasswordDocs,
  GoogleAuthDocs,
  LoginUserDocs,
  RegisterUserDocs,
  RequestVerificationTokenDocs,
  SignInTokenDocs,
} from '@auth/docs/auth-swagger.doc';
import { Response } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export default class RegistrationController {
  constructor(private authService: AuthenticationService) {}

  @skipAuth()
  @RegisterUserDocs()
  @Post('register')
  @HttpCode(201)
  public async register(@Body() body: CreateUserDTO): Promise<any> {
    return this.authService.createNewUser(body);
  }

  @skipAuth()
  @LoginUserDocs()
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.loginUser(loginDto, res);
  }

  @skipAuth()
  @Post('google')
  @GoogleAuthDocs()
  @HttpCode(200)
  async googleAuth(@Body() body: GoogleAuthPayload, @Query('mobile') isMobile: string) {
    return this.authService.googleAuth({ googleAuthPayload: body, isMobile });
  }

  @skipAuth()
  @HttpCode(200)
  @RequestVerificationTokenDocs()
  @Post('request/token')
  async requestVerificationToken(@Body() body: { email: string }) {
    const { email } = body;
    return this.authService.requestSignInToken({ email });
  }

  @skipAuth()
  @SignInTokenDocs()
  @Post('magic-link')
  @HttpCode(200)
  public async signInToken(@Body() body: RequestSigninTokenDto) {
    return await this.authService.requestSignInToken(body);
  }

  @ChangePasswordDocs()
  @HttpCode(200)
  @Post('change-password')
  public async changePassword(@Body() body: ChangePasswordDto, @Req() request: Request): Promise<any> {
    const user = request['user'];
    const userId = user.id;
    return this.authService.changePassword(userId, body.oldPassword, body.newPassword);
  }
}
