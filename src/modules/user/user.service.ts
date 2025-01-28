import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from '@user/dto/update-user-dto';
import UserResponseDTO from '@user/dto/user-response.dto';
import { User, UserType } from '@user/entities/user.entity';
import { UserPayload } from '@user/interfaces/user-payload.interface';
import CreateNewUserOptions from '@user/options/CreateNewUserOptions';
import UpdateUserRecordOption from '@user/options/UpdateUserRecordOption';
import UserIdentifierOptionsType from '@user/options/UserIdentifierOptions';
import { pick } from '@helpers/pick';
import * as SYS_MSG from '@constant/SystemMessages';
import { CustomHttpException } from '@helpers/custom-http-filter';

@Injectable()
export default class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async createUser(createUserPayload: CreateNewUserOptions): Promise<any> {
    const newUser = new User();
    Object.assign(newUser, createUserPayload);
    newUser.is_active = true;
    return await this.userRepository.save(newUser);
  }

  async updateUserRecord(userUpdateOptions: UpdateUserRecordOption) {
    const { updatePayload, identifierOptions } = userUpdateOptions;
    const user = await this.getUserRecord(identifierOptions);
    Object.assign(user, updatePayload);
    await this.userRepository.save(user);
  }

  public async createUserGoogle(userPayload) {
    const newUser = new User();
    const userData = {
      email: userPayload.email,
      name: `${userPayload.given_name} ${userPayload.family_name}`,
      first_name: userPayload.given_name,
      last_name: userPayload.family_name,
    };
    Object.assign(newUser, userData);
    newUser.is_active = true;
    return this.userRepository.save(newUser);
  }

  private async getUserByEmail(email: string) {
    const user: UserResponseDTO = await this.userRepository.findOne({
      where: { email: email },
    });
    return user;
  }

  private async getUserById(identifier: string) {
    const user: UserResponseDTO = await this.userRepository.findOne({
      where: { id: identifier },
    });
    return user;
  }

  async getUserRecord(identifierOptions: UserIdentifierOptionsType) {
    const { identifier, identifierType } = identifierOptions;

    const GetRecord = {
      id: async () => this.getUserById(String(identifier)),
      email: async () => this.getUserByEmail(String(identifier)),
    };

    return await GetRecord[identifierType]();
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto, currentUser: UserPayload) {
    if (!userId) {
      throw new BadRequestException({
        error: 'Bad Request',
        message: 'UserId is required',
        status_code: HttpStatus.BAD_REQUEST,
      });
    }

    const identifierOptions: UserIdentifierOptionsType = {
      identifierType: 'id',
      identifier: userId,
    };
    const user = await this.getUserRecord(identifierOptions);
    if (!user) {
      throw new NotFoundException({
        error: 'Not Found',
        message: 'User not found',
        status_code: HttpStatus.NOT_FOUND,
      });
    }
    // TODO: CHECK IF USER IS AN ADMIN
    if (currentUser.id !== userId) {
      throw new ForbiddenException({
        error: 'Forbidden',
        message: 'You are not authorized to update this user',
        status_code: HttpStatus.FORBIDDEN,
      });
    }

    try {
      Object.assign(user, updateUserDto);
      await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException({
        error: 'Bad Request',
        message: 'Failed to update user',
        status_code: HttpStatus.BAD_REQUEST,
      });
    }

    return {
      status: 'success',
      message: 'User Updated Successfully',
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        phone_number: user.phone_number,
      },
    };
  }

  async softDeleteUser(userId: string, authenticatedUserId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new CustomHttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user.id !== authenticatedUserId) {
      throw new CustomHttpException('You are not authorized to delete this user', HttpStatus.UNAUTHORIZED);
    }

    await this.userRepository.softDelete(userId);

    return {
      status: 'success',
      message: 'Deletion in progress',
    };
  }

  // async getUserStatistics(currentUser: UserPayload): Promise<any> {
  // if (currentUser.user_type !== UserType.SUPER_ADMIN) {
  //   throw new ForbiddenException({
  //     error: 'Forbidden',
  //     message: 'You are not authorized to access user statistics',
  //   });
  // }
  async updateUserStatus(userId: string, status: string) {
    const keepColumns = ['id', 'created_at', 'updated_at', 'first_name', 'last_name', 'email', 'status'];
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException({
        error: 'Not Found',
        message: 'User not found',
        status_code: HttpStatus.NOT_FOUND,
      });
    }
    const updatedUser = Object.assign(user, { status });
    const result = await this.userRepository.save(updatedUser);

    return {
      status: 'success',
      status_code: HttpStatus.OK,
      data: pick(result, keepColumns),
    };
  }
}
