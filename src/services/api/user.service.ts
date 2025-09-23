import { UserInputDto, UserOutputDto } from '../../dtos/user.dto';
import { BaseService } from './base.service';

class UserService extends BaseService<UserInputDto, UserOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new UserService('/user');