import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ description: '会话标题', example: 'JavaScript 基础教学' })
  @IsString()
  @MinLength(2, { message: '标题长度不能少于2位' })
  title: string;

  @ApiPropertyOptional({ description: '会话描述', example: '讲解 JavaScript 变量和函数' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '编程语言', example: 'javascript' })
  @IsString()
  language: string;

  @ApiPropertyOptional({ description: '初始代码', example: '// 开始编程' })
  @IsOptional()
  @IsString()
  initialCode?: string;
}
