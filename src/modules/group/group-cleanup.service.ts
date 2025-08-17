import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { db } from 'src/config/firebase.config';

@Injectable()
export class GroupCleanupService {
  private readonly logger = new Logger(GroupCleanupService.name);
  private readonly groupCollection = db.collection('groups');
  private readonly memberCollection = db.collection('group_members');
  private readonly messageCollection = db.collection('group_messages');

  /**
   * Run cleanup every hour to check for expired groups
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredGroups() {
    this.logger.log('🕐 Starting expired groups cleanup...');
    
    try {
      const now = new Date();
      
      // Find all expired groups
      const expiredGroupsQuery = await this.groupCollection
        .where('expires_at', '<=', now)
        .where('is_active', '==', true)
        .get();

      if (expiredGroupsQuery.empty) {
        this.logger.log('✅ No expired groups found');
        return;
      }

      this.logger.log(`🗑️ Found ${expiredGroupsQuery.size} expired groups to cleanup`);

      // Process each expired group
      for (const groupDoc of expiredGroupsQuery.docs) {
        const groupId = groupDoc.id;
        await this.cleanupGroup(groupId);
      }

      this.logger.log('✅ Expired groups cleanup completed successfully');
    } catch (error) {
      this.logger.error('❌ Error during expired groups cleanup:', error);
    }
  }

  /**
   * Cleanup a specific expired group and all its data
   */
  private async cleanupGroup(groupId: string): Promise<void> {
    try {
      this.logger.log(`🧹 Cleaning up group: ${groupId}`);

      // 1. Delete all messages in the group
      const messagesQuery = await this.messageCollection
        .where('group_id', '==', groupId)
        .get();
      
      if (!messagesQuery.empty) {
        const deletePromises = messagesQuery.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        this.logger.log(`🗑️ Deleted ${messagesQuery.size} messages from group ${groupId}`);
      }

      // 2. Delete all member records
      const membersQuery = await this.memberCollection
        .where('group_id', '==', groupId)
        .get();
      
      if (!membersQuery.empty) {
        const deletePromises = membersQuery.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        this.logger.log(`🗑️ Deleted ${membersQuery.size} member records from group ${groupId}`);
      }

      // 3. Delete the group itself
      await this.groupCollection.doc(groupId).delete();
      this.logger.log(`🗑️ Deleted group ${groupId}`);

    } catch (error) {
      this.logger.error(`❌ Error cleaning up group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Manual cleanup method that can be called from other services
   */
  async manualCleanup(): Promise<{ deletedGroups: number; deletedMessages: number; deletedMembers: number }> {
    this.logger.log('🔧 Manual cleanup requested');
    
    const now = new Date();
    let deletedGroups = 0;
    let deletedMessages = 0;
    let deletedMembers = 0;

    try {
      // Find all expired groups
      const expiredGroupsQuery = await this.groupCollection
        .where('expires_at', '<=', now)
        .where('is_active', '==', true)
        .get();

      if (expiredGroupsQuery.empty) {
        return { deletedGroups: 0, deletedMessages: 0, deletedMembers: 0 };
      }

      // Process each expired group
      for (const groupDoc of expiredGroupsQuery.docs) {
        const groupId = groupDoc.id;
        const result = await this.cleanupGroupWithStats(groupId);
        
        deletedGroups += result.deletedGroups;
        deletedMessages += result.deletedMessages;
        deletedMembers += result.deletedMembers;
      }

      this.logger.log(`✅ Manual cleanup completed: ${deletedGroups} groups, ${deletedMessages} messages, ${deletedMembers} members deleted`);
      
      return { deletedGroups, deletedMessages, deletedMembers };
    } catch (error) {
      this.logger.error('❌ Error during manual cleanup:', error);
      throw error;
    }
  }

  /**
   * Cleanup with statistics for manual cleanup
   */
  private async cleanupGroupWithStats(groupId: string): Promise<{ deletedGroups: number; deletedMessages: number; deletedMembers: number }> {
    let deletedGroups = 0;
    let deletedMessages = 0;
    let deletedMembers = 0;

    try {
      // 1. Count and delete all messages in the group
      const messagesQuery = await this.messageCollection
        .where('group_id', '==', groupId)
        .get();
      
      if (!messagesQuery.empty) {
        const deletePromises = messagesQuery.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        deletedMessages = messagesQuery.size;
      }

      // 2. Count and delete all member records
      const membersQuery = await this.memberCollection
        .where('group_id', '==', groupId)
        .get();
      
      if (!membersQuery.empty) {
        const deletePromises = membersQuery.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        deletedMembers = membersQuery.size;
      }

      // 3. Delete the group itself
      await this.groupCollection.doc(groupId).delete();
      deletedGroups = 1;

    } catch (error) {
      this.logger.error(`❌ Error cleaning up group ${groupId}:`, error);
      throw error;
    }

    return { deletedGroups, deletedMessages, deletedMembers };
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{ totalGroups: number; expiredGroups: number; activeGroups: number }> {
    try {
      const now = new Date();
      
      // Get total groups
      const totalGroupsQuery = await this.groupCollection.get();
      const totalGroups = totalGroupsQuery.size;

      // Get expired groups
      const expiredGroupsQuery = await this.groupCollection
        .where('expires_at', '<=', now)
        .where('is_active', '==', true)
        .get();
      const expiredGroups = expiredGroupsQuery.size;

      // Get active groups
      const activeGroupsQuery = await this.groupCollection
        .where('is_active', '==', true)
        .get();
      const activeGroups = activeGroupsQuery.size;

      return {
        totalGroups,
        expiredGroups,
        activeGroups
      };
    } catch (error) {
      this.logger.error('❌ Error getting cleanup stats:', error);
      throw error;
    }
  }
}
