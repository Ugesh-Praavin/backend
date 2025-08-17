import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db, admin } from 'src/config/firebase.config';
import { PostData, SupportData } from '../../common/types/post.types';

@Injectable()
export class SupportService {
  private readonly supportCollection = db.collection('post_support');
  private readonly postsCollection = db.collection('posts');

  
  async supportPost(userId: string, postId: string, supportPostDto: any) {
    try {
      // Verify post exists
      const postDoc = await this.postsCollection.doc(postId).get();
      if (!postDoc.exists) {
        throw new NotFoundException('Post not found');
      }

      const postData = postDoc.data();
      if (!postData) {
        throw new NotFoundException('Post data not found');
      }
      
      if (postData.status !== 'active') {
        throw new BadRequestException('Cannot support inactive post');
      }

      // Check if user already supported this post with the same type
      const existingSupport = await this.supportCollection
        .where('post_id', '==', postId)
        .where('user_id', '==', userId)
        .where('support_type', '==', supportPostDto.support_type)
        .limit(1)
        .get();

      if (!existingSupport.empty) {
        throw new BadRequestException('You have already supported this post with this type');
      }

      const now = new Date();
      const supportData = {
        ...supportPostDto,
        post_id: postId,
        user_id: userId,
        created_at: now,
        is_anonymous: true
      };

      const docRef = await this.supportCollection.add(supportData);

      // Update post support count
      await this.postsCollection.doc(postId).update({
        support_count: (postData.support_count || 0) + 1,
        updated_at: now
      });

      return {
        id: docRef.id,
        ...supportData,
        created_at: supportData.created_at.toISOString()
      };
    } catch (error) {
      console.error('Error supporting post:', error);
      throw error instanceof NotFoundException || error instanceof BadRequestException 
        ? error 
        : new BadRequestException('Failed to support post');
    }
  }

  /**
   * Remove support from a post
   */
  async removeSupport(userId: string, postId: string, supportType: string) {
    try {
      const supportDoc = await this.supportCollection
        .where('post_id', '==', postId)
        .where('user_id', '==', userId)
        .where('support_type', '==', supportType)
        .limit(1)
        .get();

      if (supportDoc.empty) {
        throw new NotFoundException('Support not found');
      }

      // Remove the support
      await supportDoc.docs[0].ref.delete();

      // Decrease post support count
      await this.postsCollection.doc(postId).update({
        support_count: admin.firestore.FieldValue.increment(-1)
      });

      return { message: 'Support removed successfully' };
    } catch (error) {
      console.error('Error removing support:', error);
      throw error instanceof NotFoundException || error instanceof BadRequestException 
        ? error 
        : new BadRequestException('Failed to remove support');
    }
  }

  /**
   * Get support statistics for a post
   */
  async getPostSupportStats(postId: string) {
    try {
      const supportSnapshot = await this.supportCollection
        .where('post_id', '==', postId)
        .get();

      const stats = {
        total: supportSnapshot.docs.length,
        by_type: {} as Record<string, number>,
        recent_support: [] as Array<{ type: string; message: string; created_at: any }>
      };

      supportSnapshot.docs.forEach(doc => {
        const supportData = doc.data();
        const supportType = supportData.support_type || 'other';
        
        if (!stats.by_type[supportType]) {
          stats.by_type[supportType] = 0;
        }
        stats.by_type[supportType]++;

        // Add recent support (last 10)
        if (stats.recent_support.length < 10) {
          stats.recent_support.push({
            type: supportType,
            message: supportData.message,
            created_at: supportData.created_at?.toDate?.() || supportData.created_at
          });
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching support stats:', error);
      throw new BadRequestException('Failed to fetch support statistics');
    }
  }

  /**
   * Get user's support history
   */
  async getUserSupportHistory(userId: string, page: number = 1, limit: number = 20) {
    try {
      const snapshot = await this.supportCollection
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit)
        .get();

      const supports: SupportData[] = [];
      for (const doc of snapshot.docs) {
        const supportData = doc.data();
        supports.push({
          id: doc.id,
          ...supportData,
          created_at: supportData.created_at.toISOString()
        } as SupportData);
      }

      return {
        supports,
        page,
        limit,
        total: supports.length,
        hasMore: supports.length === limit
      };
    } catch (error) {
      console.error('Error fetching user support history:', error);
      throw new BadRequestException('Failed to fetch support history');
    }
  }

  /**
   * Get posts supported by user
   */
  async getPostsSupportedByUser(userId: string, page: number = 1, limit: number = 20) {
    try {
      const supportSnapshot = await this.supportCollection
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit)
        .get();

      const supportedPosts: Array<{
        support_id: string;
        support_type: string;
        support_message: string;
        support_date: string;
        post: {
          id: string;
          content: string;
          mood: string;
          category: string;
          created_at: string;
          support_count: number;
          comments_count: number;
        };
      }> = [];
      
      for (const doc of supportSnapshot.docs) {
        const supportData = doc.data();
        
        // Get the post data
        const postDoc = await this.postsCollection.doc(supportData.post_id).get();
        if (postDoc.exists) {
          const postData = postDoc.data();
          if (postData) {
            supportedPosts.push({
              support_id: doc.id,
              support_type: supportData.support_type,
              support_message: supportData.message,
              support_date: supportData.created_at.toISOString(),
              post: {
                id: postData.id,
                content: postData.content,
                mood: postData.mood,
                category: postData.category,
                created_at: postData.created_at.toISOString(),
                support_count: postData.support_count,
                comments_count: postData.comments_count
              }
            });
          }
        }
      }

      return {
        supported_posts: supportedPosts,
        page,
        limit,
        total: supportedPosts.length,
        hasMore: supportedPosts.length === limit
      };
    } catch (error) {
      console.error('Error fetching posts supported by user:', error);
      throw new BadRequestException('Failed to fetch supported posts');
    }
  }

  /**
   * Get trending support types
   */
  async getTrendingSupportTypes(days: number = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const supportSnapshot = await this.supportCollection
        .where('created_at', '>=', cutoffDate)
        .get();

      const typeCounts = {};
      supportSnapshot.docs.forEach(doc => {
        const supportData = doc.data();
        const supportType = supportData.support_type || 'other';
        typeCounts[supportType] = (typeCounts[supportType] || 0) + 1;
      });

      // Sort by count
      const trendingTypes = Object.entries(typeCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([type, count]) => ({ type, count }));

      return {
        trending_types: trendingTypes,
        period_days: days,
        total_supports: supportSnapshot.docs.length
      };
    } catch (error) {
      console.error('Error fetching trending support types:', error);
      throw new BadRequestException('Failed to fetch trending support types');
    }
  }
}
