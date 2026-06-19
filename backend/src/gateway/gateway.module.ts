import { Module } from '@nestjs/common';
import { CodeGateway } from './code.gateway';
import { SessionsModule } from '../sessions/sessions.module';
import { RecordingsModule } from '../recordings/recordings.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [SessionsModule, RecordingsModule, AnalyticsModule],
  providers: [CodeGateway],
  exports: [CodeGateway],
})
export class GatewayModule {}
