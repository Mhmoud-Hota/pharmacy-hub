// src/app.module.ts
import { Module }            from '@nestjs/common';
import { ConfigModule }      from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join }              from 'path';
import { DatabaseModule }    from './database/database.module';
import { PharmacyModule }    from './pharmacy/pharmacy.module';
import { WebhookModule }     from './webhook/webhook.module';
import { InventoryModule }   from './inventory/inventory.module';
import { DashboardModule }   from './dashboard/dashboard.module';
import { AuthModule }        from './auth/auth.module';   // ← جديد

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath:  join(__dirname, '..', 'public', 'dashboard'),
      serveRoot: '/dashboard',
      exclude:   ['/api/(.*)'],
    }),
    DatabaseModule,
    AuthModule,       // ← جديد
    PharmacyModule,
    WebhookModule,
    InventoryModule,
    DashboardModule,
  ],
})
export class AppModule {}