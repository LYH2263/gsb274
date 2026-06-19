import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class AddInputEventDto {
  @ApiProperty({ description: '时间戳（毫秒）' })
  @IsNumber()
  timestamp: number;

  @ApiProperty({ description: '事件类型', example: 'keypress' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: '字符数量' })
  @IsOptional()
  @IsNumber()
  charCount?: number;
}
