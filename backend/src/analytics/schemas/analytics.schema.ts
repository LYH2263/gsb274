import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type AnalyticsDocument = Analytics & Document;

// 输入事件
@Schema({ _id: false })
export class InputEvent {
  @ApiProperty({ description: '时间戳（毫秒）' })
  @Prop({ required: true })
  timestamp: number;

  @ApiProperty({ description: '事件类型' })
  @Prop({ required: true })
  type: string;

  @ApiProperty({ description: '字符数量' })
  @Prop({ default: 0 })
  charCount: number;
}

export const InputEventSchema = SchemaFactory.createForClass(InputEvent);

// 时间段统计
@Schema({ _id: false })
export class TimeSlot {
  @ApiProperty({ description: '时间段开始（毫秒）' })
  @Prop({ required: true })
  startTime: number;

  @ApiProperty({ description: '时间段结束（毫秒）' })
  @Prop({ required: true })
  endTime: number;

  @ApiProperty({ description: '输入事件数量' })
  @Prop({ default: 0 })
  eventCount: number;

  @ApiProperty({ description: '总字符数' })
  @Prop({ default: 0 })
  totalChars: number;

  @ApiProperty({ description: '活跃度（0-1）' })
  @Prop({ default: 0 })
  intensity: number;
}

export const TimeSlotSchema = SchemaFactory.createForClass(TimeSlot);

@Schema({ timestamps: true })
export class Analytics {
  @ApiProperty({ description: '分析ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '关联录制ID' })
  @Prop({ type: Types.ObjectId, ref: 'Recording', required: true })
  recordingId: Types.ObjectId;

  @ApiProperty({ description: '用户ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: '会话ID' })
  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  sessionId: Types.ObjectId;

  @ApiProperty({ description: '输入事件列表' })
  @Prop({ type: [InputEventSchema], default: [] })
  inputEvents: InputEvent[];

  @ApiProperty({ description: '时间段统计' })
  @Prop({ type: [TimeSlotSchema], default: [] })
  timeSlots: TimeSlot[];

  @ApiProperty({ description: '总输入事件数' })
  @Prop({ default: 0 })
  totalEvents: number;

  @ApiProperty({ description: '总字符数' })
  @Prop({ default: 0 })
  totalChars: number;

  @ApiProperty({ description: '平均输入速度（字符/分钟）' })
  @Prop({ default: 0 })
  avgTypingSpeed: number;

  @ApiProperty({ description: '峰值输入速度' })
  @Prop({ default: 0 })
  peakTypingSpeed: number;

  @ApiProperty({ description: '活跃时长（毫秒）' })
  @Prop({ default: 0 })
  activeTime: number;

  @ApiProperty({ description: '总时长（毫秒）' })
  @Prop({ default: 0 })
  totalTime: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);

// 索引
AnalyticsSchema.index({ recordingId: 1 });
AnalyticsSchema.index({ userId: 1 });
AnalyticsSchema.index({ sessionId: 1 });
