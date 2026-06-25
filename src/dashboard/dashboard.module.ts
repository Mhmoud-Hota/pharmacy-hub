// src/dashboard/dashboard.module.ts
import { Module }              from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService }    from './dashboard.service';
import { BackupController }    from './backup.controller';
import { BackupService }       from './backup.service';
import { PrismaService }       from '../database/prisma.service';

@Module({
  controllers: [DashboardController, BackupController],
  providers:   [DashboardService, BackupService, PrismaService],
})
export class DashboardModule {}
