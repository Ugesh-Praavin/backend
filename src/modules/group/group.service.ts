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

  async createGroup(userId: string, createGroupDto: CreateGroupDto): Promise<any> {
    const expiresAt = createGroupDto.expires_in_hours
      ? new Date(Date.now() + createGroupDto.expires_in_hours * 3600000)
      : null;

    const groupData = {
      ...createGroupDto,
      created_by: userId,
      expires_at: expiresAt ?? null,
      is_active: true,
      member_count: 0,
      created_at: new Date(),
    };

    const docRef = await this.groupCollection.add(groupData);
    
    // Automatically add the creator as a member
    await this.joinGroup(userId, { group_id: docRef.id });
    
    const snapshot = await docRef.get();
    return { id: docRef.id, ...snapshot.data() };
  }

  async getOrCreateMoodGroup(userId: string, moodType: string): Promise<any> {
    const groupName = `Feeling ${moodType.charAt(0).toUpperCase() + moodType.slice(1)}`;

    const query = await this.groupCollection
      .where('name', '==', groupName)
      .where('type', '==', GroupType.MOOD_BASED)
      .where('is_active', '==', true)
      .get();

    if (!query.empty) {
      const doc = query.docs[0];
      const groupData = doc.data();
      
      // Check if the existing group is expired
      if (groupData.expires_at && new Date(groupData.expires_at.toDate()) <= new Date()) {
        // Group is expired, delete it and create a new one
        await this.cleanupExpiredGroup(doc.id);
        return this.createGroup(userId, {
          name: groupName,
          description: `Support group for people feeling ${moodType}`,
          type: GroupType.MOOD_BASED,
          expires_in_hours: 24,
        });
      }
      
      return { id: doc.id, ...groupData };
    }

    return this.createGroup(userId, {
      name: groupName,
      description: `Support group for people feeling ${moodType}`,
      type: GroupType.MOOD_BASED,
      expires_in_hours: 24,
    });
  }

  /**
   * Cleanup a single expired group (helper method)
   */
  private async cleanupExpiredGroup(groupId: string): Promise<void> {
    try {
      // Delete all messages
      const messagesQuery = await this.messageCollection
        .where('group_id', '==', groupId)
        .get();
      
      if (!messagesQuery.empty) {
        const deletePromises = messagesQuery.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
      }

      // Delete all member records
      const membersQuery = await this.memberCollection
        .where('group_id', '==', groupId)
        .get();
      
      if (!membersQuery.empty) {
        const deletePromises = membersQuery.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
      }

      // Delete the group
      await this.groupCollection.doc(groupId).delete();
    } catch (error) {
      console.error(`Error cleaning up expired group ${groupId}:`, error);
    }
  }

  // Generate a unique, creative anonymous name
  private generateAnonymousName(): string {
    const adjectives = [
      'Whispering', 'Gentle', 'Warm', 'Bright', 'Calm', 'Hopeful', 'Caring', 'Kind',
      'Thoughtful', 'Supportive', 'Understanding', 'Patient', 'Encouraging', 'Inspiring',
      'Peaceful', 'Serene', 'Compassionate', 'Empathetic', 'Nurturing', 'Healing'
    ];
    
    const nouns = [
      'Soul', 'Heart', 'Spirit', 'Friend', 'Listener', 'Helper', 'Guide', 'Companion',
      'Supporter', 'Cheerleader', 'Mentor', 'Guardian', 'Angel', 'Dreamer', 'Believer',
      'Warrior', 'Healer', 'Light', 'Star', 'Rainbow'
    ];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${randomAdjective} ${randomNoun}`;
  }

  // Generate a unique anonymous name that doesn't exist in the group
  private async generateUniqueAnonymousName(groupId: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const anonymousName = this.generateAnonymousName();
      
      // Check if this name already exists in the group
      const existingNameQuery = await this.memberCollection
        .where('group_id', '==', groupId)
        .where('anonymous_name', '==', anonymousName)
        .where('is_active', '==', true)
        .limit(1)
        .get();
      
      if (existingNameQuery.empty) {
        return anonymousName;
      }
      
      attempts++;
    }
    
    // If we can't find a unique name after max attempts, add a random number
    const fallbackName = this.generateAnonymousName();
    return `${fallbackName} ${Math.floor(Math.random() * 1000)}`;
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

    // Generate a unique anonymous name for this user in this group
    const anonymousName = await this.generateUniqueAnonymousName(groupId);

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

  /**
   * Change user's anonymous name in a group
   */
  async changeAnonymousName(userId: string, groupId: string): Promise<any> {
    // Verify user is a member of the group
    const memberQuery = await this.memberCollection
      .where('group_id', '==', groupId)
      .where('user_id', '==', userId)
      .where('is_active', '==', true)
      .limit(1)
      .get();

    if (memberQuery.empty) {
      throw new BadRequestException('You are not a member of this group');
    }

    // Generate a new unique anonymous name
    const newAnonymousName = await this.generateUniqueAnonymousName(groupId);
    
    // Update the member record
    const memberRef = memberQuery.docs[0].ref;
    await memberRef.update({
      anonymous_name: newAnonymousName,
      updated_at: new Date()
    });

    return {
      message: 'Anonymous name changed successfully',
      newAnonymousName,
      groupId
    };
  }

  async autoJoinMoodGroup(userId: string, moodType: string): Promise<any> {
    const group = await this.getOrCreateMoodGroup(userId, moodType);
    return this.joinGroup(userId, { group_id: group.id });
  }

  /**
   * Get available anonymous names for a group (for inspiration)
   */
  async getAvailableAnonymousNames(groupId: string): Promise<string[]> {
    try {
      const memberQuery = await this.memberCollection
        .where('group_id', '==', groupId)
        .where('is_active', '==', true)
        .get();

      return memberQuery.docs.map(doc => doc.data().anonymous_name);
    } catch (error) {
      console.error('Error getting available anonymous names:', error);
      return [];
    }
  }

  /**
   * Get user's current anonymous name in a group
   */
  async getUserAnonymousName(userId: string, groupId: string): Promise<string | null> {
    try {
      const memberQuery = await this.memberCollection
        .where('group_id', '==', groupId)
        .where('user_id', '==', userId)
        .where('is_active', '==', true)
        .limit(1)
        .get();

      if (memberQuery.empty) {
        return null;
      }

      return memberQuery.docs[0].data().anonymous_name;
    } catch (error) {
      console.error('Error getting user anonymous name:', error);
      return null;
    }
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
      // Add message type for better categorization
      message_type: this.detectMessageType(message),
      // Add support level (how supportive the message is)
      support_level: this.analyzeSupportLevel(message)
    };

    const msgRef = await this.messageCollection.add(messageData);
    const snapshot = await msgRef.get();
    return { id: msgRef.id, ...snapshot.data() };
  }

  /**
   * Detect the type of message for better categorization
   */
  private detectMessageType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return 'gratitude';
    } else if (lowerMessage.includes('hope') || lowerMessage.includes('wish')) {
      return 'hope';
    } else if (lowerMessage.includes('feel') || lowerMessage.includes('feeling')) {
      return 'emotion';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return 'support';
    } else if (lowerMessage.includes('?') || lowerMessage.includes('question')) {
      return 'question';
    } else {
      return 'general';
    }
  }

  /**
   * Analyze how supportive a message is (1-5 scale)
   */
  private analyzeSupportLevel(message: string): number {
    const lowerMessage = message.toLowerCase();
    let score = 3; // Default neutral score
    
    // Positive supportive words
    const positiveWords = ['hope', 'wish', 'believe', 'strong', 'courage', 'brave', 'amazing', 'wonderful', 'beautiful', 'love', 'care', 'support', 'help', 'encourage', 'inspire'];
    // Negative words
    const negativeWords = ['hate', 'terrible', 'awful', 'horrible', 'bad', 'wrong', 'stupid', 'idiot', 'worthless'];
    
    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) score += 1;
    });
    
    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) score -= 1;
    });
    
    // Ensure score is between 1-5
    return Math.max(1, Math.min(5, score));
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

    const groupData = groupSnap.data();
    if (!groupData) {
      throw new NotFoundException('Group data not found');
    }
    
    // Check if group is expired
    if (groupData.expires_at && new Date(groupData.expires_at.toDate()) <= new Date()) {
      throw new BadRequestException('This group has expired and is no longer accessible');
    }

    const messagesQuery = await this.messageCollection
      .where('group_id', '==', groupId)
      .where('is_active', '==', true)
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();

    const messages = messagesQuery.docs.map((doc) => doc.data()).reverse();

    return {
      group: groupData,
      messages,
      my_anonymous_name: member.anonymous_name,
      expires_at: groupData.expires_at,
      is_expired: groupData.expires_at ? new Date(groupData.expires_at.toDate()) <= new Date() : false
    };
  }

  /**
   * Check if a group is expired
   */
  async isGroupExpired(groupId: string): Promise<boolean> {
    try {
      const groupSnap = await this.groupCollection.doc(groupId).get();
      if (!groupSnap.exists) {
        return true; // Consider non-existent groups as expired
      }

      const groupData = groupSnap.data();
      if (!groupData || !groupData.expires_at) {
        return false; // Groups without expiration are never expired
      }

      return new Date(groupData.expires_at.toDate()) <= new Date();
    } catch (error) {
      console.error(`Error checking group expiration for ${groupId}:`, error);
      return true; // Consider as expired if there's an error
    }
  }

  /**
   * Get groups that are about to expire (within next hour)
   */
  async getGroupsExpiringSoon(hours: number = 1): Promise<any[]> {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

      const expiringGroupsQuery = await this.groupCollection
        .where('expires_at', '<=', futureTime)
        .where('expires_at', '>', now)
        .where('is_active', '==', true)
        .get();

      return expiringGroupsQuery.docs.map(doc => {
        const data = doc.data();
        if (!data || !data.expires_at) return null;
        
        return {
          id: doc.id,
          ...data,
          expires_in_minutes: Math.floor((data.expires_at.toDate().getTime() - now.getTime()) / (1000 * 60))
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('Error getting groups expiring soon:', error);
      return [];
    }
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