import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recording, RecordingDocument } from './schemas/recording.schema';

export enum RecordingPermissionAction {
  MODIFY = 'modify',
  DELETE = 'delete',
}

@Injectable()
export class RecordingAccessService {
  constructor(
    @InjectModel(Recording.name) private readonly recordingModel: Model<RecordingDocument>,
  ) {}

  async findByIdOrThrow(id: string): Promise<RecordingDocument> {
    const recording = await this.recordingModel.findById(id).exec();
    if (!recording) {
      throw new NotFoundException('录制不存在');
    }
    return recording;
  }

  async findByIdWithPopulateOrThrow(id: string): Promise<RecordingDocument> {
    const recording = await this.recordingModel
      .findById(id)
      .populate('userId', 'username email avatar')
      .populate('sessionId', 'title')
      .exec();

    if (!recording) {
      throw new NotFoundException('录制不存在');
    }

    return recording;
  }

  async validateOwnership(
    recording: RecordingDocument,
    userId: string,
    action: RecordingPermissionAction = RecordingPermissionAction.MODIFY,
  ): Promise<void> {
    if (recording.userId.toString() !== userId) {
      const message = action === RecordingPermissionAction.DELETE
        ? '无权删除此录制'
        : '无权修改此录制';
      throw new ForbiddenException(message);
    }
  }

  async validateNotCompleted(recording: RecordingDocument): Promise<void> {
    if (recording.isCompleted) {
      throw new ForbiddenException('录制已结束，无法添加操作');
    }
  }

  async validateCompleted(recording: RecordingDocument): Promise<void> {
    if (!recording.isCompleted) {
      throw new ForbiddenException('录制尚未完成');
    }
  }

  async getForOperation(id: string, userId: string): Promise<RecordingDocument> {
    const recording = await this.findByIdOrThrow(id);
    await this.validateOwnership(recording, userId, RecordingPermissionAction.MODIFY);
    await this.validateNotCompleted(recording);
    return recording;
  }

  async getForCompletion(id: string, userId: string): Promise<RecordingDocument> {
    const recording = await this.findByIdOrThrow(id);
    await this.validateOwnership(recording, userId, RecordingPermissionAction.MODIFY);
    return recording;
  }

  async getForDeletion(id: string, userId: string): Promise<RecordingDocument> {
    const recording = await this.findByIdOrThrow(id);
    await this.validateOwnership(recording, userId, RecordingPermissionAction.DELETE);
    return recording;
  }

  async getForPlayback(id: string): Promise<RecordingDocument> {
    const recording = await this.findByIdWithPopulateOrThrow(id);
    await this.validateCompleted(recording);
    return recording;
  }
}
