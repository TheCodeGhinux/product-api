import { UpdateRecordGeneric } from '@helpers/UpdateRecordGeneric';
import UserIdentifierOptionsType from '@user/options/UserIdentifierOptions';
import UserInterface from '@user/interfaces/UserInterface';

type UserUpdateRecord = Partial<UserInterface>;

type UpdateUserRecordOption = UpdateRecordGeneric<UserIdentifierOptionsType, UserUpdateRecord>;

export default UpdateUserRecordOption;
