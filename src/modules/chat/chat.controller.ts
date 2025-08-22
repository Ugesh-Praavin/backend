import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { ChatSupportDto } from './dto/chat-support.dto';
import { JwtAuthGuard } from '../../common/guards/auth.guard';

interface AuthenticatedUser {
  uid: string;
  userName: string;
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('support')
  async support(@Body('message') message: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.uid;
    console.log('ChatController: received support request from user:', userId, 'message:', message);

    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const reply = await this.chatService.sendMessage(message, userId, []);
    return { reply, timestamp: new Date(), userId };
  }

  @Post('support/stream')
  async getStreamingSupportResponse(@Body() chatSupportDto: ChatSupportDto, @Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user?.uid;
      console.log('ChatController: received streaming support request from user:', userId, 'message:', chatSupportDto.message);
      
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      
      const stream = this.chatService.getStreamingResponse(chatSupportDto.message, userId);
      const chunks: string[] = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      const fullResponse = chunks.join('');
      return { reply: fullResponse, timestamp: new Date(), userId };
      
    } catch (error) {
      console.error('ChatController: error in streaming support endpoint:', error);
      throw new HttpException(
        'Failed to get streaming support response',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
