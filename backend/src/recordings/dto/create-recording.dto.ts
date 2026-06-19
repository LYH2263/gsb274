import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsMongoId } from 'class-validator';

export class CreateRecordingDto {
  @ApiProperty({ description: '关联会话ID' })
  @IsMongoId({ message: '无效的会话ID' })
  sessionId: string;

  @ApiProperty({ description: '录制标题', example: 'JavaScript 函数讲解' })
  @IsString()
  @MinLength(2, { message: '标题长度不能少于2位' })
  title: string;

  @ApiProperty({ description: '编程语言', example: 'javascript' })
  @IsString()
  language: string;

  @ApiPropertyOptional({ description: '初始代码' })
  @IsOptional()
  @IsString()
  initialCode?: string;
}
