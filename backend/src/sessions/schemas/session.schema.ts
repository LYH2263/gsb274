import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SessionDocument = Session & Document;

export enum SessionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Session {
  @ApiProperty({ description: '会话ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '会话标题' })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ description: '会话描述' })
  @Prop({ default: '' })
  description: string;

  @ApiProperty({ description: '编程语言' })
  @Prop({ required: true })
  language: string;

  @ApiProperty({ description: '创建者ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId: Types.ObjectId;

  @ApiProperty({ description: '参与者ID列表' })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  participants: Types.ObjectId[];

  @ApiProperty({ description: '会话状态', enum: SessionStatus })
  @Prop({ type: String, enum: SessionStatus, default: SessionStatus.PENDING })
  status: SessionStatus;

  @ApiProperty({ description: '初始代码' })
  @Prop({ default: '' })
  initialCode: string;

  @ApiProperty({ description: '当前代码' })
  @Prop({ default: '' })
  currentCode: string;

  @ApiProperty({ description: '开始时间' })
  @Prop()
  startedAt: Date;

  @ApiProperty({ description: '结束时间' })
  @Prop()
  endedAt: Date;

  @ApiProperty({ description: '会话时长（秒）' })
  @Prop({ default: 0 })
  duration: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// 索引
SessionSchema.index({ creatorId: 1 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ createdAt: -1 });
