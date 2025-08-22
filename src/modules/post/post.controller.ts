import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { PostService } from './post.service';
import { CommentService } from './comment.service';
import { SupportService } from './support.service';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SupportPostDto } from './dto/support-post.dto';
import { PostData, CommentData, SupportData } from '../../common/types/post.types';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly commentService: CommentService,
    private readonly supportService: SupportService,
  ) {}

  // ===== POST ENDPOINTS =====

  @Post()
  async createPost(@Request() req: any, @Body() createPostDto: CreatePostDto) {
    const userCommunity = (req.user as any)?.community;
    console.log('createPost endpoint: user community from request:', userCommunity);
    return this.postService.createPost(req.user.uid, createPostDto, userCommunity);
  }

  @Get()
  async getAllPosts(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('community') community?: string,
    @Query('category') category?: string,
    @Query('mood') mood?: string,
  ) {
    const userId = req?.user?.uid;
    return this.postService.getAllPosts(
      parseInt(page),
      parseInt(limit),
      community,
      category,
      mood,
      userId
    );
  }

  @Get('search')
  async searchPosts(
    @Query('q') query: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    if (!query) {
      throw new Error('Search query is required');
    }
    return this.postService.searchPosts(query, parseInt(page), parseInt(limit));
  }

  @Get('my-posts')
  async getMyPosts(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.postService.getPostsByUser(req.user.uid, parseInt(page), parseInt(limit));
  }

  @Get(':id')
  async getPostById(@Param('id') postId: string) {
    return this.postService.getPostById(postId);
  }

  @Put(':id')
  async updatePost(
    @Param('id') postId: string,
    @Request() req: any,
    @Body() updateData: any,
  ) {
    return this.postService.updatePost(postId, req.user.uid, updateData);
  }

  @Delete(':id')
  async deletePost(@Param('id') postId: string, @Request() req: any) {
    return this.postService.deletePost(postId, req.user.uid);
  }

  // ===== COMMENT ENDPOINTS =====

  @Post(':id/comments')
  async createComment(
    @Param('id') postId: string,
    @Request() req: any,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.createComment(req.user.uid, postId, createCommentDto);
  }

  @Get(':id/comments')
  async getPostComments(
    @Param('id') postId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.commentService.getCommentsByPost(postId, parseInt(page), parseInt(limit));
  }

  @Put('comments/:commentId')
  async updateComment(
    @Param('commentId') commentId: string,
    @Request() req: any,
    @Body() updateData: any,
  ) {
    return this.commentService.updateComment(commentId, req.user.uid, updateData);
  }

  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @Request() req: any) {
    return this.commentService.deleteComment(commentId, req.user.uid);
  }

  @Post('comments/:commentId/like')
  async toggleCommentLike(@Param('commentId') commentId: string, @Request() req: any) {
    return this.commentService.toggleCommentLike(commentId, req.user.uid);
  }

  // ===== SUPPORT ENDPOINTS =====

  // New support message endpoint (anonymous)
  @Post(':id/support')
  async createSupportMessage(
    @Param('id') postId: string,
    @Body() body: CreateSupportMessageDto,
  ) {
    return this.postService.addSupportMessage(postId, body.message);
  }

  @Delete(':id/support/:supportType')
  async removeSupport(
    @Param('id') postId: string,
    @Param('supportType') supportType: string,
    @Request() req: any,
  ) {
    return this.supportService.removeSupport(req.user.uid, postId, supportType);
  }

  @Get(':id/supports')
  async getPostSupports(@Param('id') postId: string) {
    return this.postService.getSupportMessages(postId);
  }

  @Get('support/my-support')
  async getMySupportHistory(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.supportService.getUserSupportHistory(req.user.uid, parseInt(page), parseInt(limit));
  }

  @Get('support/supported-posts')
  async getPostsSupportedByMe(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.supportService.getPostsSupportedByUser(req.user.uid, parseInt(page), parseInt(limit));
  }

  @Get('support/trending')
  async getTrendingSupportTypes(@Query('days') days: string = '7') {
    return this.supportService.getTrendingSupportTypes(parseInt(days));
  }

  // ===== ANALYTICS ENDPOINTS =====

  @Get('analytics/overview')
  async getPostsAnalytics(@Request() req: any) {
    // Get user's posts statistics
    const myPosts = await this.postService.getPostsByUser(req.user.uid, 1, 1000);
    const mySupport = await this.supportService.getUserSupportHistory(req.user.uid, 1, 1000);
    
    const totalPosts = myPosts.total;
    const totalSupportGiven = mySupport.total;
    const totalComments = myPosts.posts.reduce((sum, post: any) => sum + (post.comments_count || 0), 0);
    
    return {
      user_id: req.user.uid,
      total_posts: totalPosts,
      total_support_given: totalSupportGiven,
      total_comments_received: totalComments,
      average_support_per_post: totalPosts > 0 ? (totalSupportGiven / totalPosts).toFixed(2) : 0,
      average_comments_per_post: totalPosts > 0 ? (totalComments / totalPosts).toFixed(2) : 0
    };
  }

  // ===== MIGRATION ENDPOINTS =====

  @Post('migrate/community-field')
  async migrateCommunityField() {
    return this.postService.migrateCommunityField();
  }
}
