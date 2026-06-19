import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recording, RecordingDocument } from './schemas/recording.schema';

export type OwnershipAction = 'modify' | 'delete';

export interface EnsureRecordingOptions {
  ownership?: { userId: string; action?: OwnershipAction };
  requireActive?: boolean;
  requireCompleted?: boolean;
}

@Injectable()
export class RecordingsGuard {
  constructor(
    @InjectModel(Recording.name) private readonly recordingModel: Model<RecordingDocument>,
  ) {}

  async ensureRecording(
    id: string,
    options: EnsureRecordingOptions = {},
  ): Promise<RecordingDocument> {
    const recording = await this.recordingModel.findById(id).exec();
    return this.applyChecks(recording, options);
  }

  ensureOwnership(
    recording: RecordingDocument,
    userId: string,
    action: OwnershipAction = 'modify',
  ): void {
    if (recording.userId.toString() !== userId) {
      throw new ForbiddenException(
        action === 'delete' ? '无权删除此录制' : '无权修改此录制',
      );
    }
  }

  ensureActive(recording: RecordingDocument): void {
    if (recording.isCompleted) {
      throw new ForbiddenException('录制已结束，无法添加操作');
    }
  }

  ensureCompleted(recording: RecordingDocument): void {
    if (!recording.isCompleted) {
      throw new ForbiddenException('录制尚未完成');
    }
  }

  applyChecks(
    recording: RecordingDocument | null,
    options: EnsureRecordingOptions,
  ): RecordingDocument {
    if (!recording) {
      throw new NotFoundException('录制不存在');
    }

    if (options.ownership) {
      this.ensureOwnership(
        recording,
        options.ownership.userId,
        options.ownership.action,
      );
    }

    if (options.requireActive) {
      this.ensureActive(recording);
    }

    if (options.requireCompleted) {
      this.ensureCompleted(recording);
    }

    return recording;
  }
}
