import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../../common/entities/group.entity';
import { GroupMember } from '../../common/entities/group-member.entity';
import { GroupMessage } from '../../common/entities/group-message.entity';
import { GroupType } from '../../common/enums/group-type.enum';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(GroupMessage)
    private groupMessageRepository: Repository<GroupMessage>,
  ) {}

  async createGroup(createGroupDto: CreateGroupDto): Promise<Group> {
    const expiresAt = createGroupDto.expires_in_hours
      ? new Date(Date.now() + createGroupDto.expires_in_hours * 60 * 60 * 1000)
      : null;

    const group = this.groupRepository.create({
      ...createGroupDto,
      expires_at: expiresAt ?? undefined,
    });

    return await this.groupRepository.save(group);
  }

  async getOrCreateMoodGroup(moodType: string): Promise<Group> {
    const groupName = `Feeling ${moodType.charAt(0).toUpperCase() + moodType.slice(1)}`;

    let group = await this.groupRepository.findOne({
      where: {
        name: groupName,
        type: GroupType.MOOD_BASED,
        is_active: true,
      },
    });

    if (!group) {
      group = await this.createGroup({
        name: groupName,
        description: `Support group for people feeling ${moodType}`,
        type: GroupType.MOOD_BASED,
        expires_in_hours: 24,
      });
    }

    return group;
  }

  async joinGroup(userId: number, joinGroupDto: JoinGroupDto): Promise<GroupMember> {
    const { group_id } = joinGroupDto;

    const group = await this.groupRepository.findOne({
      where: { id: group_id, is_active: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const existingMember = await this.groupMemberRepository.findOne({
      where: { group_id, user_id: userId, is_active: true },
    });

    if (existingMember) {
      return existingMember;
    }

    const memberCount = await this.groupMemberRepository.count({
      where: { group_id, is_active: true },
    });
    const anonymousName = `Anonymous ${memberCount + 1}`;

    const member = this.groupMemberRepository.create({
      group_id,
      user_id: userId,
      anonymous_name: anonymousName,
    });

    const savedMember = await this.groupMemberRepository.save(member);

    await this.groupRepository.increment({ id: group_id }, 'member_count', 1);

    return savedMember;
  }

  async autoJoinMoodGroup(userId: number, moodType: string): Promise<GroupMember> {
    const group = await this.getOrCreateMoodGroup(moodType);
    return await this.joinGroup(userId, { group_id: group.id });
  }

  async sendMessage(userId: number, sendMessageDto: SendMessageDto): Promise<GroupMessage> {
    const { group_id, message } = sendMessageDto;

    const member = await this.groupMemberRepository.findOne({
      where: { group_id, user_id: userId, is_active: true },
    });

    if (!member) {
      throw new BadRequestException('You are not a member of this group');
    }

    const groupMessage = this.groupMessageRepository.create({
      group_id,
      user_id: userId,
      anonymous_sender: member.anonymous_name,
      message,
    });

    return await this.groupMessageRepository.save(groupMessage);
  }

  async getGroupChat(userId: number, groupId: number): Promise<any> {
    const member = await this.groupMemberRepository.findOne({
      where: { group_id: groupId, user_id: userId, is_active: true },
    });

    if (!member) {
      throw new BadRequestException('You are not a member of this group');
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId, is_active: true },
    });

    const messages = await this.groupMessageRepository.find({
      where: { group_id: groupId, is_active: true },
      order: { created_at: 'DESC' },
      take: 50,
    });

    return {
      group,
      messages: messages.reverse(),
      my_anonymous_name: member.anonymous_name,
    };
  }

  async getAvailableGroups(): Promise<Group[]> {
    return await this.groupRepository.find({
      where: { is_active: true },
      order: { member_count: 'DESC' },
    });
  }

  async getUserGroups(userId: number): Promise<Group[]> {
    const memberGroups = await this.groupMemberRepository.find({
      where: { user_id: userId, is_active: true },
      relations: ['group'],
    });

    return memberGroups.map((member) => member.group);
  }

  async leaveGroup(userId: number, groupId: number): Promise<void> {
    const member = await this.groupMemberRepository.findOne({
      where: { group_id: groupId, user_id: userId, is_active: true },
    });

    if (member) {
      member.is_active = false;
      await this.groupMemberRepository.save(member);

      await this.groupRepository.decrement({ id: groupId }, 'member_count', 1);
    }
  }

  
  async listenToGroupMessages(groupId: number): Promise<GroupMessage[]> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, is_active: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found or inactive');
    }

    const messages = await this.groupMessageRepository.find({
      where: { group_id: groupId, is_active: true },
      order: { created_at: 'DESC' },
      take: 50,
    });

    return messages.reverse();
  }
}