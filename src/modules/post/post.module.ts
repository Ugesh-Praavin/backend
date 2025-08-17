import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CommentService } from './comment.service';
import { SupportService } from './support.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PostController],
  providers: [PostService, CommentService, SupportService],
  exports: [PostService, CommentService, SupportService],
})
export class PostModule {}