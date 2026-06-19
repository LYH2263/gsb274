import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CreateAnalyticsDto {
  @ApiProperty({ description: '关联录制ID' })
  @IsMongoId({ message: '无效的录制ID' })
  recordingId: string;

  @ApiProperty({ description: '会话ID' })
  @IsMongoId({ message: '无效的会话ID' })
  sessionId: string;
}
