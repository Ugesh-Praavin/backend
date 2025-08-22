import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from 'src/config/firebase.config';
import { PostData, CommentData, SupportData } from '../../common/types/post.types';

@Injectable()
export class PostService {
  private readonly postsCollection = db.collection('posts');
  private readonly commentsCollection = db.collection('post_comments');
  private readonly supportCollection = db.collection('post_support');
  private readonly postSupports = (postId: string) => this.postsCollection.doc(postId).collection('supports');

  /**
   * Helper function to normalize dates from Firestore
   * Handles Firestore Timestamp, JS Date, or string
   */
  private normalizeDate(dateValue: any): string {
    if (!dateValue) {
      return new Date().toISOString();
    }
    
    console.log('normalizeDate: raw date value:', dateValue, 'type:', typeof dateValue);
    
    // If it's already a string, return as is
    if (typeof dateValue === 'string') {
      return dateValue;
    }
    
    // If it's a Firestore Timestamp, convert to Date then to ISO string
    if (dateValue && typeof dateValue.toDate === 'function') {
      const date = dateValue.toDate();
      console.log('normalizeDate: converted Firestore Timestamp to Date:', date);
      return date.toISOString();
    }
    
    // If it's a Date object, convert to ISO string
    if (dateValue instanceof Date) {
      console.log('normalizeDate: using Date object:', dateValue);
      return dateValue.toISOString();
    }
    
    // Fallback: try to create a Date from the value
    try {
      const date = new Date(dateValue);
      console.log('normalizeDate: created Date from value:', date);
      return date.toISOString();
    } catch (error) {
      console.warn('normalizeDate: failed to parse date, using current time:', error);
      return new Date().toISOString();
    }
  }
  
  async createPost(userId: string, createPostDto: any, userCommunity?: string) {
    try {
      // Use provided community or default to "rit_chennai"
      const community = (userCommunity || "rit_chennai").toLowerCase();
      console.log('createPost: using community from request:', community);

      const now = new Date();
      const postData = {
        ...createPostDto,
        author_id: userId,
        community: community,
        created_at: now,
        updated_at: now,
        likes_count: 0,
        comments_count: 0,
        support_count: 0,
        is_anonymous: true, // All posts are anonymous for MoodMingle
        status: 'active', // active, deleted, hidden
        views_count: 0
      };

      const docRef = await this.postsCollection.add(postData);
      // Ensure the document also stores its id field
      await docRef.update({ id: docRef.id });
      console.log('createPost: saved post with community', { id: docRef.id, community: postData.community, ...postData });
      
      return {
        id: docRef.id,
        ...postData,
        created_at: this.normalizeDate(postData.created_at)
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw new BadRequestException('Failed to create post');
    }
  }

  /**
   * Get all posts with pagination and filtering
   */
  async getAllPosts(page: number = 1, limit: number = 20, community?: string, category?: string, mood?: string, userId?: string) {
    try {
      console.log('getAllPosts called with:', { page, limit, communityFromReq: community, category, mood, userId });
      
      // Always normalize community to lowercase for consistent matching
      let effectiveCommunity = community ? community.toLowerCase() : undefined;
      console.log('getAllPosts: normalized community from request:', effectiveCommunity);
      
      if (!effectiveCommunity && userId) {
        try {
          const userDoc = await db.collection('users').doc(userId).get();
          const userData = userDoc.data();
          effectiveCommunity = (userData as any)?.community ? (userData as any).community.toLowerCase() : "rit_chennai";
          console.log('getAllPosts: resolved community from user profile:', effectiveCommunity);
        } catch (e) {
          console.warn('getAllPosts: failed to load user profile for community, using default:', e);
          effectiveCommunity = "rit_chennai";
        }
      }
      
      if (!effectiveCommunity) {
        effectiveCommunity = "rit_chennai"; // Default fallback
        console.log('getAllPosts: no community provided, using default:', effectiveCommunity);
      }

      console.log('getAllPosts: final effective community for query:', effectiveCommunity);

      let query = this.postsCollection.where('status', '==', 'active').orderBy('created_at', 'desc');
      if (effectiveCommunity) {
        query = this.postsCollection
          .where('community', '==', effectiveCommunity)
          .where('status', '==', 'active')
          .orderBy('created_at', 'desc');
      }
      if (category) {
        console.log('Filtering by category:', category, typeof category);
        query = query.where('category', '==', category);
      }
      if (mood) {
        console.log('Filtering by mood:', mood, typeof mood);
        query = query.where('mood', '==', mood);
      }

      console.log('getAllPosts: final query filters', { community: effectiveCommunity, status: 'active', orderBy: 'created_at desc', category: !!category, mood: !!mood });
      const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
      console.log('getAllPosts: snapshot size', snapshot.size);

      const posts: PostData[] = [];
      for (const doc of snapshot.docs) {
        const postData = doc.data();
        console.log('getAllPosts: post community check', { postId: doc.id, postCommunity: postData.community, requestedCommunity: effectiveCommunity });
        posts.push({
          id: doc.id,
          ...postData,
          created_at: this.normalizeDate(postData.created_at),
          updated_at: this.normalizeDate(postData.updated_at)
        } as PostData);
      }

      console.log('getAllPosts: returning posts count', posts.length);
      return {
        posts,
        page,
        limit,
        total: posts.length,
        hasMore: posts.length === limit
      };
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      if (error && error.message) {
        console.error('Firestore error message:', error.message);
      }
      // Friendly error for missing index with hint to create it
      if (error?.code === 9 || /index/i.test(error?.message || '')) {
        return {
          error: 'Missing Firestore index. Please create it in Firebase console.',
          hint: error?.message,
        } as any;
      }
      throw new BadRequestException('Failed to fetch posts');
    }
  }

  /**
   * Add an anonymous support message to a post (subcollection)
   */
  async addSupportMessage(postId: string, message: string) {
    try {
      // Verify post exists
      const postDoc = await this.postsCollection.doc(postId).get();
      if (!postDoc.exists) {
        throw new NotFoundException('Post not found');
      }

      const now = new Date();
      const support = {
        message,
        created_at: now,
      };

      const ref = await this.postSupports(postId).add(support);
      console.log('addSupportMessage: saved support', { id: ref.id, postId, message });
      return { id: ref.id, message, created_at: now.toISOString() };
    } catch (error) {
      console.error('Error adding support message:', error);
      throw new BadRequestException('Failed to add support message');
    }
  }

  /**
   * Get all anonymous support messages for a post
   */
  async getSupportMessages(postId: string) {
    try {
      // Verify post exists
      const postDoc = await this.postsCollection.doc(postId).get();
      if (!postDoc.exists) {
        throw new NotFoundException('Post not found');
      }

      const snapshot = await this.postSupports(postId)
        .orderBy('created_at', 'desc')
        .get();

      const supports = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          message: data.message,
          created_at: this.normalizeDate(data.created_at),
        };
      });

      console.log('getSupportMessages: returning', supports.length, 'items for post', postId);
      return { supports };
    } catch (error) {
      console.error('Error fetching support messages:', error);
      throw new BadRequestException('Failed to fetch support messages');
    }
  }

  /**
   * Get a single post by ID with comments and support
   */
  async getPostById(postId: string) {
    try {
      const postDoc = await this.postsCollection.doc(postId).get();
      if (!postDoc.exists) {
        throw new NotFoundException('Post not found');
      }

      const postData = postDoc.data();
      if (!postData) {
        throw new NotFoundException('Post data not found');
      }
      
      // Get comments for this post
      const commentsSnapshot = await this.commentsCollection
        .where('post_id', '==', postId)
        .where('status', '==', 'active')
        .orderBy('created_at', 'desc')
        .limit(50)
        .get();

      const comments: CommentData[] = [];
      for (const doc of commentsSnapshot.docs) {
        const commentData = doc.data();
        comments.push({
          id: doc.id,
          ...commentData,
          created_at: this.normalizeDate(commentData.created_at)
        } as CommentData);
      }

      // Get support statistics
      const supportSnapshot = await this.supportCollection
        .where('post_id', '==', postId)
        .get();

      const supportStats = this.calculateSupportStats(supportSnapshot.docs);

      // Increment view count
      await this.postsCollection.doc(postId).update({
        views_count: (postData.views_count || 0) + 1
      });

      return {
        id: postId,
        ...postData,
        created_at: this.normalizeDate(postData.created_at),
        updated_at: this.normalizeDate(postData.updated_at),
        comments,
        support_stats: supportStats
      };
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error instanceof NotFoundException ? error : new BadRequestException('Failed to fetch post');
    }
  }

  /**
   * Update a post (only by author)
   */
  async updatePost(postId: string, userId: string, updateData: any) {
    try {
      const postDoc = await this.postsCollection.doc(postId).get();
      if (!postDoc.exists) {
        throw new NotFoundException('Post not found');
      }

      const postData = postDoc.data();
      if (!postData) {
        throw new NotFoundException('Post data not found');
      }
      
      if (postData.author_id !== userId) {
        throw new BadRequestException('You can only edit your own posts');
      }

      const updatedData = {
        ...updateData,
        updated_at: new Date()
      };

      await this.postsCollection.doc(postId).update(updatedData);
      
      return {
        id: postId,
        ...postData,
        ...updatedData,
        updated_at: this.normalizeDate(updatedData.updated_at)
      };
    } catch (error) {
      console.error('Error updating post:', error);
      throw error instanceof NotFoundException || error instanceof BadRequestException 
        ? error 
        : new BadRequestException('Failed to update post');
    }
  }

  /**
   * Delete a post (only by author)
   */
  async deletePost(postId: string, userId: string) {
    try {
      const postDoc = await this.postsCollection.doc(postId).get();
      if (!postDoc.exists) {
        throw new NotFoundException('Post not found');
      }

      const postData = postDoc.data();
      if (!postData) {
        throw new NotFoundException('Post data not found');
      }
      
      if (postData.author_id !== userId) {
        throw new BadRequestException('You can only delete your own posts');
      }

      // Soft delete - mark as deleted instead of removing
      await this.postsCollection.doc(postId).update({
        status: 'deleted',
        updated_at: new Date()
      });

      return { message: 'Post deleted successfully' };
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error instanceof NotFoundException || error instanceof BadRequestException 
        ? error 
        : new BadRequestException('Failed to delete post');
    }
  }

  /**
   * Get posts by user ID
   */
  async getPostsByUser(userId: string, page: number = 1, limit: number = 20) {
    try {
      const snapshot = await this.postsCollection
        .where('author_id', '==', userId)
        .where('status', '==', 'active')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit)
        .get();

      const posts: PostData[] = [];
      for (const doc of snapshot.docs) {
        const postData = doc.data();
        posts.push({
          id: doc.id,
          ...postData,
          created_at: this.normalizeDate(postData.created_at),
          updated_at: this.normalizeDate(postData.updated_at)
        } as PostData);
      }

      return {
        posts,
        page,
        limit,
        total: posts.length,
        hasMore: posts.length === limit
      };
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw new BadRequestException('Failed to fetch user posts');
    }
  }

  /**
   * Calculate support statistics for a post
   */
  private calculateSupportStats(supportDocs: any[]) {
    const stats = {
      total: supportDocs.length,
      by_type: {} as Record<string, number>,
      recent_support: [] as Array<{ type: string; message: string; created_at: any }>
    };

    supportDocs.forEach(doc => {
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
          created_at: this.normalizeDate(supportData.created_at)
        });
      }
    });

    return stats;
  }

  /**
   * Search posts by content or tags
   */
  async searchPosts(query: string, page: number = 1, limit: number = 20) {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple implementation - in production, consider using Algolia or similar
      const snapshot = await this.postsCollection
        .where('status', '==', 'active')
        .orderBy('created_at', 'desc')
        .limit(100) // Get more posts to filter
        .get();

      const posts: PostData[] = [];
      const queryLower = query.toLowerCase();

      for (const doc of snapshot.docs) {
        const postData = doc.data();
        const content = postData.content?.toLowerCase() || '';
        const tags = postData.tags?.map((tag: string) => tag.toLowerCase()) || [];
        const category = postData.category?.toLowerCase() || '';
        const mood = postData.mood?.toLowerCase() || '';

        // Check if query matches content, tags, category, or mood
        if (content.includes(queryLower) || 
            tags.some((tag: string) => tag.includes(queryLower)) ||
            category.includes(queryLower) ||
            mood.includes(queryLower)) {
          
          posts.push({
            id: doc.id,
            ...postData,
            created_at: this.normalizeDate(postData.created_at),
            updated_at: this.normalizeDate(postData.updated_at)
          } as PostData);
        }

        // Stop if we have enough posts
        if (posts.length >= limit) break;
      }

      return {
        posts: posts.slice((page - 1) * limit, page * limit),
        page,
        limit,
        total: posts.length,
        hasMore: posts.length > page * limit
      };
    } catch (error) {
      console.error('Error searching posts:', error);
      throw new BadRequestException('Failed to search posts');
    }
  }

  /**
   * Migration: Backfill community field for existing posts and users
   * This should be run once to fix existing data
   */
  async migrateCommunityField() {
    try {
      console.log('Starting community field migration...');
      
      // First, backfill users without community field
      const usersSnapshot = await db.collection('users').get();
      let usersUpdated = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        if (!userData.community) {
          await userDoc.ref.update({ community: "rit_chennai" });
          usersUpdated++;
          console.log(`Updated user ${userDoc.id} with community: rit_chennai`);
        }
      }
      
      console.log(`Updated ${usersUpdated} users with community field`);
      
      // Then, backfill posts without community field
      const postsSnapshot = await this.postsCollection.get();
      let postsUpdated = 0;
      
      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        if (!postData.community) {
          // Try to get community from author's profile
          let community = "rit_chennai";
          try {
            const authorDoc = await db.collection('users').doc(postData.author_id).get();
            const authorData = authorDoc.data();
            community = (authorData as any)?.community || "rit_chennai";
          } catch (e) {
            console.warn(`Could not get community for post ${postDoc.id}, using default`);
          }
          
          await postDoc.ref.update({ community: community.toLowerCase() });
          postsUpdated++;
          console.log(`Updated post ${postDoc.id} with community: ${community.toLowerCase()}`);
        }
      }
      
      console.log(`Updated ${postsUpdated} posts with community field`);
      
      return {
        usersUpdated,
        postsUpdated,
        message: 'Community field migration completed successfully'
      };
    } catch (error) {
      console.error('Error during community field migration:', error);
      throw new BadRequestException('Failed to migrate community field');
    }
  }
}
