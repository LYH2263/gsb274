import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import { RecordingsModule } from './recordings/recordings.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GatewayModule } from './gateway/gateway.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB 连接
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // 功能模块
    RedisModule,
    AuthModule,
    UsersModule,
    SessionsModule,
    RecordingsModule,
    AnalyticsModule,
    GatewayModule,
  ],
})
export class AppModule {}
