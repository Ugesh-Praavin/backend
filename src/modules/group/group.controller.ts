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
import { GroupCleanupService } from './group-cleanup.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../../common/guards/auth.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly groupCleanupService: GroupCleanupService,
  ) {}

  // Create a new group
  @Post()
  async createGroup(@Request() req: any, @Body() createGroupDto: CreateGroupDto) {
    const userId = req.user.uid;
    return this.groupService.createGroup(userId, createGroupDto);
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

  // Manual cleanup of expired groups (admin function)
  @Post('cleanup/expired')
  async cleanupExpiredGroups() {
    const result = await this.groupCleanupService.manualCleanup();
    return {
      message: 'Cleanup completed successfully',
      ...result
    };
  }

  // Manually trigger 12 PM cleanup (for testing)
  @Post('cleanup/noon')
  async triggerNoonCleanup() {
    const result = await this.groupCleanupService.triggerNoonCleanup();
    return {
      message: '12 PM cleanup triggered successfully',
      ...result
    };
  }

  // Check which groups will be cleaned up at 12 PM today
  @Get('cleanup/noon/check')
  async checkNoonCleanup() {
    const result = await this.groupCleanupService.checkGroupsForNoonCleanup();
    return {
      message: '12 PM cleanup check completed',
      ...result
    };
  }

  // Get cleanup statistics
  @Get('cleanup/stats')
  async getCleanupStats() {
    return this.groupCleanupService.getCleanupStats();
  }

  // Get groups that are expiring soon
  @Get('expiring-soon')
  async getGroupsExpiringSoon() {
    return this.groupService.getGroupsExpiringSoon(1); // Within 1 hour
  }

  // Check if a specific group is expired
  @Get(':groupId/expired')
  async isGroupExpired(@Param('groupId') groupId: string) {
    const isExpired = await this.groupService.isGroupExpired(groupId);
    return { 
      groupId, 
      isExpired,
      message: isExpired ? 'Group has expired' : 'Group is still active'
    };
  }

  // Change user's anonymous name in a group
  @Post(':groupId/change-name')
  async changeAnonymousName(@Request() req: any, @Param('groupId') groupId: string) {
    const userId = req.user.uid;
    return this.groupService.changeAnonymousName(userId, groupId);
  }

  // Get available anonymous names in a group
  @Get(':groupId/anonymous-names')
  async getAvailableAnonymousNames(@Param('groupId') groupId: string) {
    const names = await this.groupService.getAvailableAnonymousNames(groupId);
    return {
      groupId,
      anonymousNames: names,
      count: names.length
    };
  }

  // Get user's current anonymous name in a group
  @Get(':groupId/my-anonymous-name')
  async getUserAnonymousName(@Request() req: any, @Param('groupId') groupId: string) {
    const userId = req.user.uid;
    const anonymousName = await this.groupService.getUserAnonymousName(userId, groupId);
    return {
      groupId,
      userId,
      anonymousName,
      hasAnonymousName: !!anonymousName
    };
  }
}