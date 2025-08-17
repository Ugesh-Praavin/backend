import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from 'src/config/firebase.config';

@Injectable()
export class PostService {
  private readonly postsCollection = db.collection('posts');
  private readonly commentsCollection = db.collection('post_comments');
  private readonly supportCollection = db.collection('post_support');

  /**
   * Create a new post
   */
  async createPost(userId: string, createPostDto: any) {
    try {
      const now = new Date();
      const postData = {
        ...createPostDto,
        author_id: userId,
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
      
      return {
        id: docRef.id,
        ...postData,
        created_at: postData.created_at.toISOString()
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw new BadRequestException('Failed to create post');
    }
  }

  /**
   * Get all posts with pagination and filtering
   */
  async getAllPosts(page: number = 1, limit: number = 20, category?: string, mood?: string) {
    try {
      let query = this.postsCollection
        .where('status', '==', 'active')
        .orderBy('created_at', 'desc');

      if (category) {
        query = query.where('category', '==', category);
      }
      if (mood) {
        query = query.where('mood', '==', mood);
      }

      const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
      
      const posts = [];
      for (const doc of snapshot.docs) {
        const postData = doc.data();
        posts.push({
          id: doc.id,
          ...postData,
          created_at: postData.created_at.toISOString(),
          updated_at: postData.updated_at.toISOString()
        });
      }

      return {
        posts,
        page,
        limit,
        total: posts.length,
        hasMore: posts.length === limit
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new BadRequestException('Failed to fetch posts');
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
      
      // Get comments for this post
      const commentsSnapshot = await this.commentsCollection
        .where('post_id', '==', postId)
        .where('status', '==', 'active')
        .orderBy('created_at', 'desc')
        .limit(50)
        .get();

      const comments = [];
      for (const doc of commentsSnapshot.docs) {
        const commentData = doc.data();
        comments.push({
          id: doc.id,
          ...commentData,
          created_at: commentData.created_at.toISOString()
        });
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
        created_at: postData.created_at.toISOString(),
        updated_at: postData.updated_at.toISOString(),
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
        updated_at: updatedData.updated_at.toISOString()
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

      const posts = [];
      for (const doc of snapshot.docs) {
        const postData = doc.data();
        posts.push({
          id: doc.id,
          ...postData,
          created_at: postData.created_at.toISOString(),
          updated_at: postData.updated_at.toISOString()
        });
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
      by_type: {},
      recent_support: []
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
          created_at: supportData.created_at?.toDate?.() || supportData.created_at
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

      const posts = [];
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
            created_at: postData.created_at.toISOString(),
            updated_at: postData.updated_at.toISOString()
          });
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
}
