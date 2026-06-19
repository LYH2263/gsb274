import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { SessionStatus } from '../schemas/session.schema';

export class UpdateSessionDto {
  @ApiPropertyOptional({ description: '会话标题' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '标题长度不能少于2位' })
  title?: string;

  @ApiPropertyOptional({ description: '会话描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '编程语言' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: '会话状态', enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional({ description: '当前代码' })
  @IsOptional()
  @IsString()
  currentCode?: string;
}
