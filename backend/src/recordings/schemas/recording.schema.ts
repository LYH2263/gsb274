import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type RecordingDocument = Recording & Document;

// 操作类型
export enum OperationType {
  INSERT = 'insert',
  DELETE = 'delete',
  REPLACE = 'replace',
  CURSOR = 'cursor',
  SELECTION = 'selection',
  SNAPSHOT = 'snapshot',
}

// 单个操作（Delta）
@Schema({ _id: false })
export class Operation {
  @ApiProperty({ description: '操作类型', enum: OperationType })
  @Prop({ type: String, enum: OperationType, required: true })
  type: OperationType;

  @ApiProperty({ description: '操作位置（行）' })
  @Prop()
  line: number;

  @ApiProperty({ description: '操作位置（列）' })
  @Prop()
  column: number;

  @ApiProperty({ description: '结束位置（行）' })
  @Prop()
  endLine: number;

  @ApiProperty({ description: '结束位置（列）' })
  @Prop()
  endColumn: number;

  @ApiProperty({ description: '操作内容' })
  @Prop()
  text: string;

  @ApiProperty({ description: '快照内容（用于 snapshot 类型）' })
  @Prop()
  snapshot: string;

  @ApiProperty({ description: '时间戳（相对于录制开始的毫秒数）' })
  @Prop({ required: true })
  timestamp: number;
}

export const OperationSchema = SchemaFactory.createForClass(Operation);

@Schema({ timestamps: true })
export class Recording {
  @ApiProperty({ description: '录制ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '关联会话ID' })
  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  sessionId: Types.ObjectId;

  @ApiProperty({ description: '录制者ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: '录制标题' })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ description: '编程语言' })
  @Prop({ required: true })
  language: string;

  @ApiProperty({ description: '初始代码' })
  @Prop({ default: '' })
  initialCode: string;

  @ApiProperty({ description: '最终代码' })
  @Prop({ default: '' })
  finalCode: string;

  @ApiProperty({ description: '操作序列' })
  @Prop({ type: [OperationSchema], default: [] })
  operations: Operation[];

  @ApiProperty({ description: '总时长（毫秒）' })
  @Prop({ default: 0 })
  duration: number;

  @ApiProperty({ description: '是否已完成录制' })
  @Prop({ default: false })
  isCompleted: boolean;

  @ApiProperty({ description: '快照间隔（毫秒）' })
  @Prop({ default: 30000 })
  snapshotInterval: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const RecordingSchema = SchemaFactory.createForClass(Recording);

// 索引
RecordingSchema.index({ sessionId: 1 });
RecordingSchema.index({ userId: 1 });
RecordingSchema.index({ createdAt: -1 });
