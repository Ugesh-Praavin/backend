import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /users/:uid
  @Get(':uid')
  async getUserById(@Param('uid') uid: string) {
    return this.userService.getUserById(uid);
  }

  // GET /users/username/:userName
  @Get('username/:userName')
  async getUserByUsername(@Param('userName') userName: string) {
    return this.userService.getUserByUsername(userName);
  }

  // PATCH /users/:uid
  @Patch(':uid')
  async updateUser(
    @Param('uid') uid: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(uid, updateUserDto);
  }

  // DELETE /users/:uid
  @Delete(':uid')
  async deleteUser(@Param('uid') uid: string) {
    return this.userService.deleteUser(uid);
  }
}
