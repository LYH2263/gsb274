import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Recording, RecordingDocument } from './schemas/recording.schema';

export class RecordingsValidator {
  static async findAndValidateExists(
    recordingModel: Model<RecordingDocument>,
    id: string,
  ): Promise<RecordingDocument> {
    const recording = await recordingModel.findById(id).exec();

    if (!recording) {
      throw new NotFoundException('录制不存在');
    }

    return recording;
  }

  static validateOwnership(
    recording: RecordingDocument,
    userId: string,
    action: 'modify' | 'delete' = 'modify',
  ): void {
    if (recording.userId.toString() !== userId) {
      const message = action === 'delete' ? '无权删除此录制' : '无权修改此录制';
      throw new ForbiddenException(message);
    }
  }

  static validateNotCompleted(recording: RecordingDocument): void {
    if (recording.isCompleted) {
      throw new ForbiddenException('录制已结束，无法添加操作');
    }
  }

  static validateCompleted(recording: RecordingDocument): void {
    if (!recording.isCompleted) {
      throw new ForbiddenException('录制尚未完成');
    }
  }

  static async findForOperation(
    recordingModel: Model<RecordingDocument>,
    id: string,
    userId: string,
  ): Promise<RecordingDocument> {
    const recording = await this.findAndValidateExists(recordingModel, id);
    this.validateOwnership(recording, userId, 'modify');
    this.validateNotCompleted(recording);
    return recording;
  }

  static async findForCompletion(
    recordingModel: Model<RecordingDocument>,
    id: string,
    userId: string,
  ): Promise<RecordingDocument> {
    const recording = await this.findAndValidateExists(recordingModel, id);
    this.validateOwnership(recording, userId, 'modify');
    return recording;
  }

  static async findForDeletion(
    recordingModel: Model<RecordingDocument>,
    id: string,
    userId: string,
  ): Promise<RecordingDocument> {
    const recording = await this.findAndValidateExists(recordingModel, id);
    this.validateOwnership(recording, userId, 'delete');
    return recording;
  }
}
