import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request 
} from '@nestjs/common';

import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from '@nestjs/passport';


@Controller('groups')
@UseGuards(AuthGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  // Create a new group
  @Post()
  async createGroup(@Body() createGroupDto: CreateGroupDto) {
    return await this.groupService.createGroup(createGroupDto);
  }

  // Join a group
  @Post('join')
  async joinGroup(@Request() req, @Body() joinGroupDto: JoinGroupDto) {
    const userId = req.user.uid; // Firebase UID
    return await this.groupService.joinGroup(userId, joinGroupDto);
  }

  // Send message to group
  @Post('message')
  async sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
    const userId = req.user.uid; // Firebase UID
    return await this.groupService.sendMessage(userId, sendMessageDto);
  }

  // Get group chat (group info + messages)
  @Get(':groupId/chat')
  async getGroupChat(@Request() req, @Param('groupId') groupId: string) {
    const userId = req.user.uid;
    return await this.groupService.getGroupChat(userId, Number(groupId));
  }

  // Get available groups to join
  @Get('available')
  async getAvailableGroups() {
    return await this.groupService.getAvailableGroups();
  }

  // Get user's joined groups
  @Get('my-groups')
  async getUserGroups(@Request() req) {
    const userId = req.user.uid;
    return await this.groupService.getUserGroups(userId);
  }

  // Leave a group
  @Post(':groupId/leave')
  async leaveGroup(@Request() req, @Param('groupId') groupId: string) {
    const userId = req.user.uid;
    await this.groupService.leaveGroup(userId, Number(groupId));
    return { message: 'Left group successfully' };
  }

  // Auto-join mood-based group
  @Post('auto-join/:moodType')
  async autoJoinMoodGroup(@Request() req, @Param('moodType') moodType: string) {
    const userId = req.user.uid;
    return await this.groupService.autoJoinMoodGroup(userId, moodType);
  }
}