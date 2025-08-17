import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CommentService } from './comment.service';
import { SupportService } from './support.service';

@Module({
  controllers: [PostController],
  providers: [PostService, CommentService, SupportService],
  exports: [PostService, CommentService, SupportService],
})
export class PostModule {}