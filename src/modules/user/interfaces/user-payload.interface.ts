import { UserType } from '@user/entities/user.entity';

export interface UserPayload {
  id: string;
  email: string;
  // user_type: UserType;
}
