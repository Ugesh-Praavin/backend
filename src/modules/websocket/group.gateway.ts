import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GroupService } from '../group/group.service';


@WebSocketGateway({
  cors: { origin: '*' },
})
export class GroupGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeListeners = new Map(); // Track Firestore listeners

  constructor(private readonly groupService: GroupService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Clean up any active Firestore listeners for this client
    const clientListeners = this.activeListeners.get(client.id) || [];
    clientListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners.delete(client.id);
  }

  // Join a group room and start listening to real-time messages
  @SubscribeMessage('joinGroupRoom')
  async handleJoinRoom(
    @MessageBody() data: { groupId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `group_${data.groupId}`;
    client.join(roomName);
    
    // Fetch latest group messages and emit them to the client
    const messages = await this.groupService.listenToGroupMessages(String(data.groupId));
    messages.forEach((newMessage) => {
      this.server.to(roomName).emit('newGroupMessage', {
        id: newMessage.id,
        anonymous_sender: newMessage.anonymous_sender,
        message: newMessage.message,
        created_at: newMessage.created_at,
        groupId: data.groupId,
      });
    });

    client.emit('joinedRoom', {
      groupId: data.groupId,
      roomName,
      message: 'Joined group chat successfully'
    });
  }

  // Leave a group room
  @SubscribeMessage('leaveGroupRoom')
  async handleLeaveRoom(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `group_${data.groupId}`;
    client.leave(roomName);
    
    client.emit('leftRoom', {
      groupId: data.groupId,
      message: 'Left group chat'
    });
  }

  // Send message to group
  @SubscribeMessage('sendGroupMessage')
  async handleSendMessage(
    @MessageBody() data: { groupId: string; userId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Save message to Firestore (this will trigger the real-time listener)
      await this.groupService.sendMessage(String(data.userId), {
        group_id: String(data.groupId),
        message: data.message,
      });

      // Message will be broadcasted via Firestore listener, no need to emit here
      
    } catch (error) {
      client.emit('messageError', {
        error: error.message,
        groupId: data.groupId,
      });
    }
  }

  // Typing indicator
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { groupId: string; anonymousName: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `group_${data.groupId}`;
    
    // Broadcast typing status to others in the room (except sender)
    client.to(roomName).emit('userTyping', {
      groupId: data.groupId,
      anonymousName: data.anonymousName,
      isTyping: data.isTyping,
    });
  }

  // Get online members count
  @SubscribeMessage('getOnlineMembers')
  async handleGetOnlineMembers(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `group_${data.groupId}`;
    const room = this.server.sockets.adapter.rooms.get(roomName);
    const onlineCount = room ? room.size : 0;
    
    client.emit('onlineMembersCount', {
      groupId: data.groupId,
      onlineCount,
    });
  }
}