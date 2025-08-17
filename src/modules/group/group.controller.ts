import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('groups')
@UseGuards(AuthGuard('firebase')) // Ensure you're using the correct strategy name
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  // Create a new group
  @Post()
  async createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.groupService.createGroup(createGroupDto);
  }

  // Join a group
  @Post('join')
  async joinGroup(@Request() req: any, @Body() joinGroupDto: JoinGroupDto) {
    const userId = req.user.uid;
    return this.groupService.joinGroup(userId, joinGroupDto);
  }

  // Send message to group
  @Post('message')
  async sendMessage(@Request() req: any, @Body() sendMessageDto: SendMessageDto) {
    const userId = req.user.uid;
    return this.groupService.sendMessage(userId, sendMessageDto);
  }

  // Get group chat (group info + messages)
  @Get(':groupId/chat')
  async getGroupChat(@Request() req: any, @Param('groupId') groupId: string) {
    const userId = req.user.uid;
    return this.groupService.getGroupChat(userId, groupId);
  }

  // Get available groups to join
  @Get('available')
  async getAvailableGroups() {
    return this.groupService.getAvailableGroups();
  }

  // Get user's joined groups
  @Get('my-groups')
  async getUserGroups(@Request() req: any) {
    const userId = req.user.uid;
    return this.groupService.getUserGroups(userId);
  }

  // Leave a group
  @Post(':groupId/leave')
  async leaveGroup(@Request() req: any, @Param('groupId') groupId: string) {
    const userId = req.user.uid;
    await this.groupService.leaveGroup(userId, groupId);
    return { message: 'Left group successfully' };
  }

  // Auto-join mood-based group
  @Post('auto-join/:moodType')
  async autoJoinMoodGroup(@Request() req: any, @Param('moodType') moodType: string) {
    const userId = req.user.uid;
    return this.groupService.autoJoinMoodGroup(userId, moodType);
  }
}