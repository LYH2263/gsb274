import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recording, RecordingDocument } from './schemas/recording.schema';

type OwnershipAction = 'modify' | 'delete';

@Injectable()
export class RecordingValidator {
  constructor(
    @InjectModel(Recording.name) private readonly recordingModel: Model<RecordingDocument>,
  ) {}

  validateExists(recording: RecordingDocument | null): asserts recording is RecordingDocument {
    if (!recording) {
      throw new NotFoundException('录制不存在');
    }
  }

  validateOwnership(recording: RecordingDocument, userId: string, action: OwnershipAction): void {
    if (recording.userId.toString() !== userId) {
      const message = action === 'delete' ? '无权删除此录制' : '无权修改此录制';
      throw new ForbiddenException(message);
    }
  }

  validateNotCompleted(recording: RecordingDocument): void {
    if (recording.isCompleted) {
      throw new ForbiddenException('录制已结束，无法添加操作');
    }
  }

  validateCompleted(recording: RecordingDocument): void {
    if (!recording.isCompleted) {
      throw new ForbiddenException('录制尚未完成');
    }
  }

  private async findRawById(id: string): Promise<RecordingDocument | null> {
    return this.recordingModel.findById(id).exec();
  }

  private async findPopulatedById(id: string): Promise<RecordingDocument | null> {
    return this.recordingModel
      .findById(id)
      .populate('userId', 'username email avatar')
      .populate('sessionId', 'title')
      .exec();
  }

  async findForAddOperation(id: string, userId: string): Promise<RecordingDocument> {
    const recording = await this.findRawById(id);
    this.validateExists(recording);
    this.validateOwnership(recording, userId, 'modify');
    this.validateNotCompleted(recording);
    return recording;
  }

  async findForCompletion(id: string, userId: string): Promise<RecordingDocument> {
    const recording = await this.findRawById(id);
    this.validateExists(recording);
    this.validateOwnership(recording, userId, 'modify');
    return recording;
  }

  async findForRemoval(id: string, userId: string): Promise<RecordingDocument> {
    const recording = await this.findRawById(id);
    this.validateExists(recording);
    this.validateOwnership(recording, userId, 'delete');
    return recording;
  }

  async findByIdOrThrow(id: string): Promise<RecordingDocument> {
    const recording = await this.findPopulatedById(id);
    this.validateExists(recording);
    return recording;
  }

  async findForPlayback(id: string): Promise<RecordingDocument> {
    const recording = await this.findByIdOrThrow(id);
    this.validateCompleted(recording);
    return recording;
  }
}
