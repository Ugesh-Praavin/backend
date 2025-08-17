import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupCleanupService } from './group-cleanup.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [GroupController],
  providers: [GroupService, GroupCleanupService],
  exports: [GroupService, GroupCleanupService],
})
export class GroupModule {}