import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

export enum UserRole {
  TEACHER = 'teacher',
  STUDENT = 'student',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ description: '用户ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '邮箱' })
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @ApiProperty({ description: '用户名' })
  @Prop({ required: true })
  username: string;

  @ApiProperty({ description: '头像URL' })
  @Prop({ default: '' })
  avatar: string;

  @ApiProperty({ description: '用户角色', enum: UserRole })
  @Prop({ type: String, enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @ApiProperty({ description: '是否激活' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// 索引
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
