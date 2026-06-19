import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Analytics, AnalyticsDocument, InputEvent, TimeSlot } from './schemas/analytics.schema';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { AddInputEventDto } from './dto/add-input-event.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly REDIS_KEY_PREFIX = 'analytics:events:';
  private readonly TIME_SLOT_INTERVAL = 5000; // 5秒一个时间段

  constructor(
    @InjectModel(Analytics.name) private readonly analyticsModel: Model<AnalyticsDocument>,
    private readonly redisService: RedisService,
  ) {}

  async create(createAnalyticsDto: CreateAnalyticsDto, userId: string): Promise<AnalyticsDocument> {
    const analytics = new this.analyticsModel({
      recordingId: new Types.ObjectId(createAnalyticsDto.recordingId),
      sessionId: new Types.ObjectId(createAnalyticsDto.sessionId),
      userId: new Types.ObjectId(userId),
    });

    this.logger.log(`Creating analytics for recording: ${createAnalyticsDto.recordingId}`);
    return analytics.save();
  }

  async findByRecording(recordingId: string): Promise<AnalyticsDocument | null> {
    return this.analyticsModel
      .findOne({ recordingId: new Types.ObjectId(recordingId) })
      .populate('userId', 'username email avatar')
      .exec();
  }

  async findBySession(sessionId: string): Promise<AnalyticsDocument[]> {
    return this.analyticsModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .populate('userId', 'username email avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUser(userId: string): Promise<AnalyticsDocument[]> {
    return this.analyticsModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('recordingId', 'title')
      .populate('sessionId', 'title')
      .sort({ createdAt: -1 })
      .exec();
  }

  async addInputEvent(recordingId: string, eventDto: AddInputEventDto): Promise<void> {
    const redisKey = `${this.REDIS_KEY_PREFIX}${recordingId}`;
    await this.redisService.rpush(redisKey, JSON.stringify(eventDto));
    await this.redisService.expire(redisKey, 86400); // 24小时过期
  }

  async addInputEventsBatch(recordingId: string, events: AddInputEventDto[]): Promise<void> {
    const redisKey = `${this.REDIS_KEY_PREFIX}${recordingId}`;
    for (const event of events) {
      await this.redisService.rpush(redisKey, JSON.stringify(event));
    }
    await this.redisService.expire(redisKey, 86400);
  }

  async processAnalytics(recordingId: string): Promise<AnalyticsDocument> {
    const analytics = await this.analyticsModel
      .findOne({ recordingId: new Types.ObjectId(recordingId) })
      .exec();

    if (!analytics) {
      throw new NotFoundException('分析数据不存在');
    }

    // 从 Redis 获取所有输入事件
    const redisKey = `${this.REDIS_KEY_PREFIX}${recordingId}`;
    const eventsStr = await this.redisService.lrange(redisKey, 0, -1);
    const inputEvents: InputEvent[] = eventsStr.map((str) => JSON.parse(str));

    if (inputEvents.length === 0) {
      return analytics;
    }

    // 计算时间段统计
    const timeSlots = this.calculateTimeSlots(inputEvents);

    // 计算总体统计
    const totalEvents = inputEvents.length;
    const totalChars = inputEvents.reduce((sum, e) => sum + (e.charCount || 0), 0);
    const totalTime = inputEvents.length > 0
      ? inputEvents[inputEvents.length - 1].timestamp - inputEvents[0].timestamp
      : 0;

    // 计算平均和峰值输入速度
    const avgTypingSpeed = totalTime > 0 ? (totalChars / totalTime) * 60000 : 0;
    const peakTypingSpeed = this.calculatePeakTypingSpeed(timeSlots);

    // 计算活跃时长
    const activeTime = this.calculateActiveTime(timeSlots);

    // 更新分析数据
    analytics.inputEvents = inputEvents;
    analytics.timeSlots = timeSlots;
    analytics.totalEvents = totalEvents;
    analytics.totalChars = totalChars;
    analytics.avgTypingSpeed = Math.round(avgTypingSpeed);
    analytics.peakTypingSpeed = Math.round(peakTypingSpeed);
    analytics.activeTime = activeTime;
    analytics.totalTime = totalTime;

    // 清理 Redis
    await this.redisService.del(redisKey);

    this.logger.log(`Processed analytics for recording: ${recordingId}`);
    return analytics.save();
  }

  private calculateTimeSlots(events: InputEvent[]): TimeSlot[] {
    if (events.length === 0) return [];

    const slots: TimeSlot[] = [];
    const startTime = events[0].timestamp;
    const endTime = events[events.length - 1].timestamp;

    for (let time = startTime; time < endTime; time += this.TIME_SLOT_INTERVAL) {
      const slotEnd = time + this.TIME_SLOT_INTERVAL;
      const slotEvents = events.filter(
        (e) => e.timestamp >= time && e.timestamp < slotEnd,
      );

      const eventCount = slotEvents.length;
      const totalChars = slotEvents.reduce((sum, e) => sum + (e.charCount || 0), 0);

      slots.push({
        startTime: time,
        endTime: slotEnd,
        eventCount,
        totalChars,
        intensity: Math.min(eventCount / 20, 1), // 归一化到 0-1
      });
    }

    return slots;
  }

  private calculatePeakTypingSpeed(slots: TimeSlot[]): number {
    if (slots.length === 0) return 0;

    let maxSpeed = 0;
    for (const slot of slots) {
      const duration = slot.endTime - slot.startTime;
      const speed = duration > 0 ? (slot.totalChars / duration) * 60000 : 0;
      maxSpeed = Math.max(maxSpeed, speed);
    }

    return maxSpeed;
  }

  private calculateActiveTime(slots: TimeSlot[]): number {
    return slots
      .filter((slot) => slot.eventCount > 0)
      .reduce((sum, slot) => sum + (slot.endTime - slot.startTime), 0);
  }

  // 获取热力图数据
  async getHeatmapData(recordingId: string): Promise<{
    timeSlots: TimeSlot[];
    maxIntensity: number;
  }> {
    const analytics = await this.findByRecording(recordingId);

    if (!analytics) {
      throw new NotFoundException('分析数据不存在');
    }

    const maxIntensity = Math.max(...analytics.timeSlots.map((s) => s.intensity), 0);

    return {
      timeSlots: analytics.timeSlots,
      maxIntensity,
    };
  }

  // 获取频率曲线数据
  async getFrequencyCurveData(recordingId: string): Promise<{
    dataPoints: { time: number; frequency: number }[];
  }> {
    const analytics = await this.findByRecording(recordingId);

    if (!analytics) {
      throw new NotFoundException('分析数据不存在');
    }

    const dataPoints = analytics.timeSlots.map((slot) => ({
      time: slot.startTime,
      frequency: slot.eventCount,
    }));

    return { dataPoints };
  }
}
