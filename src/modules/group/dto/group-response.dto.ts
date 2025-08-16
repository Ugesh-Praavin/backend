export class GroupResponseDto {
  id: number;
  name: string;
  description: string;
  type: string;
  member_count: number;
  is_active: boolean;
  expires_at?: Date;
  created_at: Date;
}

export class GroupMessageResponseDto {
  id: number;
  anonymous_sender: string;
  message: string;
  created_at: Date;
}

export class GroupChatResponseDto {
  group: GroupResponseDto;
  messages: GroupMessageResponseDto[];
  my_anonymous_name: string;
}