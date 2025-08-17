import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db, admin } from 'src/config/firebase.config';
import { PostData, CommentData } from '../../common/types/post.types';

@Injectable()
export class CommentService {
  private readonly commentsCollection = db.collection('post_comments');
  private readonly postsCollection = db.collection('posts');


  async createComment(userId: string, postId: string, createCommentDto: any) {
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
        throw new BadRequestException('Cannot comment on inactive post');
      }

      const now = new Date();
      const commentData = {
        ...createCommentDto,
        post_id: postId,
        author_id: userId,
        created_at: now,
        updated_at: now,
        likes_count: 0,
        is_anonymous: true, // All comments are anonymous
        status: 'active'
      };

      const docRef = await this.commentsCollection.add(commentData);

      // Update post comment count
      await this.postsCollection.doc(postId).update({
        comments_count: (postData.comments_count || 0) + 1,
        updated_at: now
      });

      return {
        id: docRef.id,
        ...commentData,
        created_at: commentData.created_at.toISOString()
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error instanceof NotFoundException || error instanceof BadRequestException 
        ? error 
        : new BadRequestException('Failed to create comment');
    }
  }

  /**
   * Get comments for a post
   */
  async getCommentsByPost(postId: string, page: number = 1, limit: number = 50) {
    try {
      const snapshot = await this.commentsCollection
        .where('post_id', '==', postId)
        .where('status', '==', 'active')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit)
        .get();

      const comments: CommentData[] = [];
      for (const doc of snapshot.docs) {
        const commentData = doc.data();
        comments.push({
          id: doc.id,
          ...commentData,
          created_at: commentData.created_at.toISOString()
        } as CommentData);
      }

      return {
        comments,
        page,
        limit,
        total: comments.length,
        hasMore: comments.length === limit
      };
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw new BadRequestException('Failed to fetch comments');
    }
  }

  /**
   * Update a comment (only by author)
   */
  async updateComment(commentId: string, userId: string, updateData: any) {
    try {
      const commentDoc = await this.commentsCollection.doc(commentId).get();
      if (!commentDoc.exists) {
        throw new NotFoundException('Comment not found');
      }

      const commentData = commentDoc.data();
      if (!commentData) {
        throw new NotFoundException('Comment data not found');
      }

      if (commentData.author_id !== userId) {
        throw new BadRequestException('You can only edit your own comments');
      }

      const updatedData = {
        ...updateData,
        updated_at: new Date()
      };

      await this.commentsCollection.doc(commentId).update(updatedData);
      
      return {
        id: commentId,
        ...commentData,
        ...updatedData,
        updated_at: updatedData.updated_at.toISOString()
      };
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error instanceof NotFoundException || error instanceof BadRequestException 
        ? error 
        : new BadRequestException('Failed to update comment');
    }
  }

  /**
   * Delete a comment (only by author)
   */
  async deleteComment(commentId: string, userId: string) {
    try {
      const commentDoc = await this.commentsCollection.doc(commentId).get();
      if (!commentDoc.exists) {
        throw new NotFoundException('Comment not found');
      }

      const commentData = commentDoc.data();
      if (!commentData) {
        throw new NotFoundException('Comment data not found');
      }

      if (commentData.author_id !== userId) {
        throw new BadRequestException('You can only delete your own comments');
      }

      // Soft delete - mark as deleted instead of removing
      await this.commentsCollection.doc(commentId).update({
        status: 'deleted',
        updated_at: new Date()
      });

      // Decrease post comment count
      await this.postsCollection.doc(commentData.post_id).update({
        comments_count: admin.firestore.FieldValue.increment(-1)
      });

      return { message: 'Comment deleted successfully' };
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error instanceof NotFoundException || error instanceof BadRequestException 
        ? error 
        : new BadRequestException('Failed to delete comment');
    }
  }

  /**
   * Like/unlike a comment
   */
  async toggleCommentLike(commentId: string, userId: string) {
    try {
      const commentDoc = await this.commentsCollection.doc(commentId).get();
      if (!commentDoc.exists) {
        throw new NotFoundException('Comment not found');
      }

      const commentData = commentDoc.data();
      if (!commentData) {
        throw new NotFoundException('Comment data not found');
      }

      if (commentData.status !== 'active') {
        throw new BadRequestException('Cannot like inactive comment');
      }

      // Check if user already liked this comment
      const existingLike = await this.commentsCollection
        .doc(commentId)
        .collection('likes')
        .doc(userId)
        .get();

      if (existingLike.exists) {
        // Unlike - remove the like
        await this.commentsCollection
          .doc(commentId)
          .collection('likes')
          .doc(userId)
          .delete();

        // Decrease like count
        await this.commentsCollection.doc(commentId).update({
          likes_count: Math.max(0, (commentData.likes_count || 0) - 1)
        });

        return { message: 'Comment unliked successfully', liked: false };
      } else {
        // Like - add the like
        await this.commentsCollection
          .doc(commentId)
          .collection('likes')
          .doc(userId)
          .set({
            user_id: userId,
            created_at: new Date()
          });

        // Increase like count
        await this.commentsCollection.doc(commentId).update({
          likes_count: (commentData.likes_count || 0) + 1
        });

        return { message: 'Comment liked successfully', liked: true };
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error instanceof NotFoundException || error instanceof BadRequestException 
        ? error 
        : new BadRequestException('Failed to toggle comment like');
    }
  }
}
