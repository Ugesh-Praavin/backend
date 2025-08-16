import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /users/:uid → get user by UID
  @Get(':uid')
  async getUserById(@Param('uid') uid: string) {
    return this.userService.getUserById(uid);
  }

  // GET /users/username/:userName → get user by username
  @Get('username/:userName')
  async getUserByUsername(@Param('userName') userName: string) {
    return this.userService.getUserByUsername(userName);
  }
}
