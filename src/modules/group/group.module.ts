import { Module } from '@nestjs/common';
// import { ScheduleModule } from '@nestjs/schedule';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupCleanupService } from './group-cleanup.service';
import { GroupGateway } from '../websocket/group.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    // ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [GroupController],
  providers: [GroupService, GroupCleanupService, GroupGateway],
  exports: [GroupService, GroupCleanupService],
})
export class GroupModule {}