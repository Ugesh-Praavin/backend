import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Group } from '../../common/entities/group.entity';
import { GroupMember } from '../../common/entities/group-member.entity';
import { GroupMessage } from '../../common/entities/group-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember, GroupMessage])
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService], 
})
export class GroupModule {}