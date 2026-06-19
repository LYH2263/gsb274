import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument, SessionStatus } from './schemas/session.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async create(createSessionDto: CreateSessionDto, creatorId: string): Promise<SessionDocument> {
    const session = new this.sessionModel({
      ...createSessionDto,
      creatorId: new Types.ObjectId(creatorId),
      currentCode: createSessionDto.initialCode || '',
    });

    this.logger.log(`Creating new session: ${createSessionDto.title} by user ${creatorId}`);
    return session.save();
  }

  async findAll(userId?: string): Promise<SessionDocument[]> {
    const query = userId
      ? {
          $or: [
            { creatorId: new Types.ObjectId(userId) },
            { participants: new Types.ObjectId(userId) },
          ],
        }
      : {};

    return this.sessionModel
      .find(query)
      .populate('creatorId', 'username email avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<SessionDocument> {
    const session = await this.sessionModel
      .findById(id)
      .populate('creatorId', 'username email avatar')
      .populate('participants', 'username email avatar')
      .exec();

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    return session;
  }

  async update(
    id: string,
    updateSessionDto: UpdateSessionDto,
    userId: string,
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(id).exec();

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    if (session.creatorId.toString() !== userId) {
      throw new ForbiddenException('无权修改此会话');
    }

    const updated = await this.sessionModel
      .findByIdAndUpdate(id, updateSessionDto, { new: true })
      .populate('creatorId', 'username email avatar')
      .exec();

    this.logger.log(`Updated session: ${id}`);
    return updated!;
  }

  async remove(id: string, userId: string): Promise<void> {
    const session = await this.sessionModel.findById(id).exec();

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    if (session.creatorId.toString() !== userId) {
      throw new ForbiddenException('无权删除此会话');
    }

    await this.sessionModel.findByIdAndDelete(id).exec();
    this.logger.log(`Deleted session: ${id}`);
  }

  async startSession(id: string, userId: string): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(id).exec();

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    if (session.creatorId.toString() !== userId) {
      throw new ForbiddenException('无权启动此会话');
    }

    session.status = SessionStatus.ACTIVE;
    session.startedAt = new Date();

    this.logger.log(`Started session: ${id}`);
    return session.save();
  }

  async endSession(id: string, userId: string): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(id).exec();

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    if (session.creatorId.toString() !== userId) {
      throw new ForbiddenException('无权结束此会话');
    }

    session.status = SessionStatus.COMPLETED;
    session.endedAt = new Date();
    
    if (session.startedAt) {
      session.duration = Math.floor(
        (session.endedAt.getTime() - session.startedAt.getTime()) / 1000,
      );
    }

    this.logger.log(`Ended session: ${id}`);
    return session.save();
  }

  async joinSession(id: string, userId: string): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(id).exec();

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    const userObjectId = new Types.ObjectId(userId);
    if (!session.participants.some((p) => p.equals(userObjectId))) {
      session.participants.push(userObjectId);
      await session.save();
    }

    this.logger.log(`User ${userId} joined session: ${id}`);
    return this.findOne(id);
  }

  async leaveSession(id: string, userId: string): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(id).exec();

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    const userObjectId = new Types.ObjectId(userId);
    session.participants = session.participants.filter((p) => !p.equals(userObjectId));
    await session.save();

    this.logger.log(`User ${userId} left session: ${id}`);
    return this.findOne(id);
  }

  async updateCode(id: string, code: string): Promise<void> {
    await this.sessionModel.findByIdAndUpdate(id, { currentCode: code }).exec();
  }
}
