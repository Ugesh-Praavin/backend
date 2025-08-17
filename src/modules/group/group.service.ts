import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GroupType } from '../../common/enums/group-type.enum';
import { db } from 'src/config/firebase.config';

@Injectable()
export class GroupService {
  private groupCollection = db.collection('groups');
  private memberCollection = db.collection('group_members');
  private messageCollection = db.collection('group_messages');

  async createGroup(createGroupDto: CreateGroupDto): Promise<any> {
    const expiresAt = createGroupDto.expires_in_hours
      ? new Date(Date.now() + createGroupDto.expires_in_hours * 3600000)
      : null;

    const groupData = {
      ...createGroupDto,
      expires_at: expiresAt ?? null,
      is_active: true,
      member_count: 0,
      created_at: new Date(),
    };

    const docRef = await this.groupCollection.add(groupData);
    const snapshot = await docRef.get();
    return { id: docRef.id, ...snapshot.data() };
  }

  async getOrCreateMoodGroup(moodType: string): Promise<any> {
    const groupName = `Feeling ${moodType.charAt(0).toUpperCase() + moodType.slice(1)}`;

    const query = await this.groupCollection
      .where('name', '==', groupName)
      .where('type', '==', GroupType.MOOD_BASED)
      .where('is_active', '==', true)
      .limit(1)
      .get();

    if (!query.empty) {
      const doc = query.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    return this.createGroup({
      name: groupName,
      description: `Support group for people feeling ${moodType}`,
      type: GroupType.MOOD_BASED,
      expires_in_hours: 24,
    });
  }

  async joinGroup(userId: string, joinGroupDto: JoinGroupDto): Promise<any> {
    const groupId = joinGroupDto.group_id;

    const groupSnap = await this.groupCollection.doc(String(groupId)).get();
    if (!groupSnap.exists || !groupSnap.data()?.is_active) {
      throw new NotFoundException('Group not found');
    }

    const existingQuery = await this.memberCollection
      .where('group_id', '==', groupId)
      .where('user_id', '==', userId)
      .where('is_active', '==', true)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      const doc = existingQuery.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    const memberCountQuery = await this.memberCollection
      .where('group_id', '==', groupId)
      .where('is_active', '==', true)
      .get();

    const anonymousName = `Anonymous ${memberCountQuery.size + 1}`;

    const memberData = {
      group_id: groupId,
      user_id: userId,
      anonymous_name: anonymousName,
      is_active: true,
      joined_at: new Date(),
    };

    const memberRef = await this.memberCollection.add(memberData);
    await this.groupCollection.doc(String(groupId)).update({
      member_count: (groupSnap.data()?.member_count || 0) + 1,
    });

    const snapshot = await memberRef.get();
    return { id: memberRef.id, ...snapshot.data() };
  }

  async autoJoinMoodGroup(userId: string, moodType: string): Promise<any> {
    const group = await this.getOrCreateMoodGroup(moodType);
    return this.joinGroup(userId, { group_id: group.id });
  }

  async sendMessage(userId: string, sendMessageDto: SendMessageDto): Promise<any> {
    const { group_id, message } = sendMessageDto;

    const memberQuery = await this.memberCollection
      .where('group_id', '==', group_id)
      .where('user_id', '==', userId)
      .where('is_active', '==', true)
      .limit(1)
      .get();

    if (memberQuery.empty) {
      throw new BadRequestException('You are not a member of this group');
    }

    const member = memberQuery.docs[0].data();

    const messageData = {
      group_id,
      user_id: userId,
      anonymous_sender: member.anonymous_name,
      message,
      is_active: true,
      created_at: new Date(),
    };

    const msgRef = await this.messageCollection.add(messageData);
    const snapshot = await msgRef.get();
    return { id: msgRef.id, ...snapshot.data() };
  }

  async getGroupChat(userId: string, groupId: string): Promise<any> {
    const memberQuery = await this.memberCollection
      .where('group_id', '==', groupId)
      .where('user_id', '==', userId)
      .where('is_active', '==', true)
      .limit(1)
      .get();

    if (memberQuery.empty) {
      throw new BadRequestException('You are not a member of this group');
    }

    const member = memberQuery.docs[0].data();

    const groupSnap = await this.groupCollection.doc(groupId).get();
    if (!groupSnap.exists || !groupSnap.data()?.is_active) {
      throw new NotFoundException('Group not found');
    }

    const messagesQuery = await this.messageCollection
      .where('group_id', '==', groupId)
      .where('is_active', '==', true)
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();

    const messages = messagesQuery.docs.map((doc) => doc.data()).reverse();

    return {
      group: groupSnap.data(),
      messages,
      my_anonymous_name: member.anonymous_name,
    };
  }

  async getAvailableGroups(): Promise<any[]> {
    const query = await this.groupCollection
      .where('is_active', '==', true)
      .orderBy('member_count', 'desc')
      .get();

    return query.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async getUserGroups(userId: string): Promise<any[]> {
    const memberQuery = await this.memberCollection
      .where('user_id', '==', userId)
      .where('is_active', '==', true)
      .get();

    const groupIds = memberQuery.docs.map((doc) => doc.data().group_id);
    const groupFetches = groupIds.map((id) => this.groupCollection.doc(id).get());
    const groupSnaps = await Promise.all(groupFetches);

    return groupSnaps
      .filter((snap) => snap.exists)
      .map((snap) => ({ id: snap.id, ...snap.data() }));
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const memberQuery = await this.memberCollection
      .where('group_id', '==', groupId)
      .where('user_id', '==', userId)
      .where('is_active', '==', true)
      .limit(1)
      .get();

    if (!memberQuery.empty) {
      const memberRef = memberQuery.docs[0].ref;
      await memberRef.update({ is_active: false });

      const groupSnap = await this.groupCollection.doc(groupId).get();
      const currentCount = groupSnap.data()?.member_count || 1;
      await this.groupCollection.doc(String(groupId)).update({
        member_count: Math.max(currentCount - 1, 0),
      });
    }
  }

  async listenToGroupMessages(groupId: string): Promise<any[]> {
    const groupSnap = await this.groupCollection.doc(groupId).get();
    if (!groupSnap.exists || !groupSnap.data()?.is_active) {
      throw new NotFoundException('Group not found or inactive');
    }

    const messagesQuery = await this.messageCollection
      .where('group_id', '==', groupId)
      .where('is_active', '==', true)
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();

    return messagesQuery.docs.map((doc) => doc.data()).reverse();
  }
}