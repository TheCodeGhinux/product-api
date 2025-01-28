import { HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
// import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as SYS_MSG from '@constant/SystemMessages';
import { JwtService } from '@nestjs/jwt';
import { LoginResponseDto } from '@auth/dto/login-response.dto';
import { CreateUserDTO } from '@auth/dto/create-user.dto';
import UserService from '@user/user.service';
import { LoginDto } from '@auth/dto/login.dto';
import { RequestSigninTokenDto } from '@auth/dto/request-signin-token.dto';

import { GoogleAuthService } from '@auth/google-auth.service';
import GoogleAuthPayload from '@auth/interfaces/GoogleAuthPayloadInterface';
import { GoogleVerificationPayloadInterface } from '@auth/interfaces/GoogleVerificationPayloadInterface';
import { CustomHttpException } from '@helpers/custom-http-filter';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export default class AuthenticationService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private googleAuthService: GoogleAuthService,
    private configService: ConfigService
  ) {}

  async createNewUser(createUserDto: CreateUserDTO) {
    const userExists = await this.userService.getUserRecord({
      identifier: createUserDto.email,
      identifierType: 'email',
    });

    if (userExists) {
      throw new CustomHttpException(SYS_MSG.USER_ACCOUNT_EXIST, HttpStatus.BAD_REQUEST);
    }

    await this.userService.createUser(createUserDto);

    const user = await this.userService.getUserRecord({ identifier: createUserDto.email, identifierType: 'email' });

    if (!user) {
      throw new CustomHttpException(SYS_MSG.FAILED_TO_CREATE_USER, HttpStatus.BAD_REQUEST);
    }

    const access_token = this.jwtService.sign({
      id: user.id,
      sub: user.id,
      email: user.email,
    });

    const responsePayload = {
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    };

    return {
      message: SYS_MSG.USER_CREATED_SUCCESSFULLY,
      access_token,
      data: responsePayload,
    };
  }

  async changePassword(user_id: string, oldPassword: string, newPassword: string) {
    const user = await this.userService.getUserRecord({
      identifier: user_id,
      identifierType: 'id',
    });

    if (!user) {
      throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // const isPasswordValid = bcrypt.compareSync(oldPassword, user.password);
    // if (!isPasswordValid) {
    //   throw new CustomHttpException(SYS_MSG.INVALID_PASSWORD, HttpStatus.BAD_REQUEST);
    // }

    await this.userService.updateUserRecord({
      updatePayload: { password: newPassword },
      identifierOptions: {
        identifierType: 'id',
        identifier: user.id,
      },
    });

    return {
      message: 'Password updated',
    };
  }

  async loginUser(loginDto: LoginDto, res: any) {
    const { email, password } = loginDto;

    const user = await this.userService.getUserRecord({
      identifier: email,
      identifierType: 'email',
    });

    if (!user) {
      throw new CustomHttpException(SYS_MSG.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    // const isMatch = await bcrypt.compare(password, user.password);

    // if (!isMatch) {
    //   throw new CustomHttpException(SYS_MSG.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    // }
    const payload = { id: user.id, sub: user.id };
    const access_token = await this.jwtService.signAsync(payload);
    const cookie = this.setCookie(access_token, res);
    const responsePayload = {
      access_token,
      data: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    };

    return { message: SYS_MSG.LOGIN_SUCCESSFUL, ...responsePayload };
  }

  generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 5; i++) {
      codes.push(Math.floor(10000000 + Math.random() * 90000000).toString());
    }
    return codes;
  }

  async googleAuth({ googleAuthPayload, isMobile }: { googleAuthPayload: GoogleAuthPayload; isMobile: string }) {
    const idToken = googleAuthPayload.id_token;
    let verifyTokenResponse: GoogleVerificationPayloadInterface;

    if (isMobile === 'true') {
      const request = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`);
      verifyTokenResponse = await request.json();
    } else {
      verifyTokenResponse = await this.googleAuthService.verifyToken(idToken);
    }

    const userEmail = verifyTokenResponse.email;
    const userExists = await this.userService.getUserRecord({ identifier: userEmail, identifierType: 'email' });

    if (!userExists) {
      const userCreationPayload = {
        email: userEmail,
        first_name: verifyTokenResponse.given_name || '',
        last_name: verifyTokenResponse?.family_name || '',
        password: '',
      };
      return await this.createUserGoogle(userCreationPayload);
    }

    const accessToken = this.jwtService.sign({
      sub: userExists.id,
      id: userExists.id,
      email: userExists.email,
      first_name: userExists.first_name,
      last_name: userExists.last_name,
    });
    return {
      message: SYS_MSG.LOGIN_SUCCESSFUL,
      access_token: accessToken,
      data: {
        user: {
          id: userExists.id,
          email: userExists.email,
          first_name: userExists.first_name,
          last_name: userExists.last_name,
        },
      },
    };
  }

  public async createUserGoogle(userPayload: CreateUserDTO) {
    const newUser = await this.userService.createUser(userPayload);
    const newOrganisationPaload = {
      name: `${newUser.first_name}'s Organisation`,
      description: '',
      email: newUser.email,
      industry: '',
      type: '',
      country: '',
      address: '',
      state: '',
    };
    const accessToken = await this.jwtService.sign({
      sub: newUser.id,
      id: newUser.id,
      email: userPayload.email,
      first_name: userPayload.first_name,
      last_name: userPayload.last_name,
    });

    return {
      status_code: HttpStatus.OK,
      message: SYS_MSG.USER_CREATED,
      access_token: accessToken,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
        },
      },
    };
  }

  async requestSignInToken(requestSignInTokenDto: RequestSigninTokenDto) {
    const { email } = requestSignInTokenDto;

    const user = await this.userService.getUserRecord({ identifier: email, identifierType: 'email' });

    if (!user) {
      throw new CustomHttpException(SYS_MSG.INVALID_CREDENTIALS, HttpStatus.BAD_REQUEST);
    }

    // check for otp

    return {
      message: 'SYS_MSG.SIGN_IN_OTP_SENT',
    };
  }

  async setCookie(token: string, res: Response) {
    const cookieExpiry = this.configService.get<number>('auth.cookieExpiry');

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: cookieExpiry,
    });
  }
}
