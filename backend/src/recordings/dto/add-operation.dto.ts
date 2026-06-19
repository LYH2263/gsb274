import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { OperationType } from '../schemas/recording.schema';

export class AddOperationDto {
  @ApiProperty({ description: '操作类型', enum: OperationType })
  @IsEnum(OperationType)
  type: OperationType;

  @ApiPropertyOptional({ description: '操作位置（行）' })
  @IsOptional()
  @IsNumber()
  line?: number;

  @ApiPropertyOptional({ description: '操作位置（列）' })
  @IsOptional()
  @IsNumber()
  column?: number;

  @ApiPropertyOptional({ description: '结束位置（行）' })
  @IsOptional()
  @IsNumber()
  endLine?: number;

  @ApiPropertyOptional({ description: '结束位置（列）' })
  @IsOptional()
  @IsNumber()
  endColumn?: number;

  @ApiPropertyOptional({ description: '操作内容' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: '快照内容' })
  @IsOptional()
  @IsString()
  snapshot?: string;

  @ApiProperty({ description: '时间戳（相对于录制开始的毫秒数）' })
  @IsNumber()
  timestamp: number;
}
