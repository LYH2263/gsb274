import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Recording, RecordingDocument, Operation, OperationType } from './schemas/recording.schema';
import { CreateRecordingDto } from './dto/create-recording.dto';
import { AddOperationDto } from './dto/add-operation.dto';
import { RedisService } from '../redis/redis.service';
import { RecordingsValidator } from './recordings.validator';

@Injectable()
export class RecordingsService {
  private readonly logger = new Logger(RecordingsService.name);
  private readonly REDIS_KEY_PREFIX = 'recording:ops:';

  constructor(
    @InjectModel(Recording.name) private readonly recordingModel: Model<RecordingDocument>,
    private readonly redisService: RedisService,
  ) {}

  async create(createRecordingDto: CreateRecordingDto, userId: string): Promise<RecordingDocument> {
    const recording = new this.recordingModel({
      ...createRecordingDto,
      sessionId: new Types.ObjectId(createRecordingDto.sessionId),
      userId: new Types.ObjectId(userId),
    });

    this.logger.log(`Creating new recording: ${createRecordingDto.title} by user ${userId}`);
    return recording.save();
  }

  async findAll(userId?: string): Promise<RecordingDocument[]> {
    const query = userId ? { userId: new Types.ObjectId(userId) } : {};

    return this.recordingModel
      .find(query)
      .populate('userId', 'username email avatar')
      .populate('sessionId', 'title')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findBySession(sessionId: string): Promise<RecordingDocument[]> {
    return this.recordingModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .populate('userId', 'username email avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<RecordingDocument> {
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

  async addOperation(id: string, operationDto: AddOperationDto, userId: string): Promise<void> {
    await RecordingsValidator.findForOperation(this.recordingModel, id, userId);

    const redisKey = `${this.REDIS_KEY_PREFIX}${id}`;
    await this.redisService.rpush(redisKey, JSON.stringify(operationDto));
    await this.redisService.expire(redisKey, 86400);
  }

  async addOperationsBatch(id: string, operations: AddOperationDto[], userId: string): Promise<void> {
    await RecordingsValidator.findForOperation(this.recordingModel, id, userId);

    const redisKey = `${this.REDIS_KEY_PREFIX}${id}`;
    for (const op of operations) {
      await this.redisService.rpush(redisKey, JSON.stringify(op));
    }
    await this.redisService.expire(redisKey, 86400);
  }

  async completeRecording(id: string, finalCode: string, userId: string): Promise<RecordingDocument> {
    const recording = await RecordingsValidator.findForCompletion(this.recordingModel, id, userId);

    const redisKey = `${this.REDIS_KEY_PREFIX}${id}`;
    const operationsStr = await this.redisService.lrange(redisKey, 0, -1);
    const operations: Operation[] = operationsStr.map((str) => JSON.parse(str));

    const duration = operations.length > 0 
      ? operations[operations.length - 1].timestamp 
      : 0;

    recording.operations = operations;
    recording.finalCode = finalCode;
    recording.duration = duration;
    recording.isCompleted = true;

    await this.redisService.del(redisKey);

    this.logger.log(`Completed recording: ${id}`);
    return recording.save();
  }

  async remove(id: string, userId: string): Promise<void> {
    await RecordingsValidator.findForDeletion(this.recordingModel, id, userId);

    const redisKey = `${this.REDIS_KEY_PREFIX}${id}`;
    await this.redisService.del(redisKey);

    await this.recordingModel.findByIdAndDelete(id).exec();
    this.logger.log(`Deleted recording: ${id}`);
  }

  async getPlaybackData(id: string): Promise<{
    initialCode: string;
    operations: Operation[];
    duration: number;
    language: string;
  }> {
    const recording = await this.findOne(id);
    RecordingsValidator.validateCompleted(recording);

    return {
      initialCode: recording.initialCode,
      operations: recording.operations,
      duration: recording.duration,
      language: recording.language,
    };
  }

  async getSnapshotAtTime(id: string, timestamp: number): Promise<string> {
    const recording = await this.findOne(id);
    RecordingsValidator.validateCompleted(recording);

    const snapshots = recording.operations.filter(
      (op) => op.type === OperationType.SNAPSHOT && op.timestamp <= timestamp,
    );

    if (snapshots.length === 0) {
      return recording.initialCode;
    }

    const latestSnapshot = snapshots[snapshots.length - 1];
    return latestSnapshot.snapshot || recording.initialCode;
  }
}
