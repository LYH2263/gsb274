import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: { userId: string };
}
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { AddInputEventDto } from './dto/add-input-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Analytics } from './schemas/analytics.schema';

@ApiTags('analytics')
@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  @ApiOperation({ summary: '创建分析记录' })
  @ApiResponse({ status: 201, description: '创建成功', type: Analytics })
  async create(@Body() createAnalyticsDto: CreateAnalyticsDto, @Request() req: RequestWithUser) {
    return this.analyticsService.create(createAnalyticsDto, req.user.userId);
  }

  @Get('recording/:recordingId')
  @ApiOperation({ summary: '获取录制的分析数据' })
  @ApiResponse({ status: 200, description: '获取成功', type: Analytics })
  async findByRecording(@Param('recordingId') recordingId: string) {
    return this.analyticsService.findByRecording(recordingId);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: '获取会话的所有分析数据' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Analytics] })
  async findBySession(@Param('sessionId') sessionId: string) {
    return this.analyticsService.findBySession(sessionId);
  }

  @Get('user')
  @ApiOperation({ summary: '获取当前用户的分析数据' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Analytics] })
  async findByUser(@Request() req: RequestWithUser) {
    return this.analyticsService.findByUser(req.user.userId);
  }

  @Post(':recordingId/events')
  @ApiOperation({ summary: '添加输入事件' })
  @ApiResponse({ status: 201, description: '添加成功' })
  async addInputEvent(
    @Param('recordingId') recordingId: string,
    @Body() eventDto: AddInputEventDto,
  ) {
    await this.analyticsService.addInputEvent(recordingId, eventDto);
    return { message: '事件已记录' };
  }

  @Post(':recordingId/events/batch')
  @ApiOperation({ summary: '批量添加输入事件' })
  @ApiResponse({ status: 201, description: '添加成功' })
  async addInputEventsBatch(
    @Param('recordingId') recordingId: string,
    @Body() events: AddInputEventDto[],
  ) {
    await this.analyticsService.addInputEventsBatch(recordingId, events);
    return { message: '事件已批量记录' };
  }

  @Post(':recordingId/process')
  @ApiOperation({ summary: '处理分析数据' })
  @ApiResponse({ status: 200, description: '处理成功', type: Analytics })
  async processAnalytics(@Param('recordingId') recordingId: string) {
    return this.analyticsService.processAnalytics(recordingId);
  }

  @Get(':recordingId/heatmap')
  @ApiOperation({ summary: '获取热力图数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getHeatmapData(@Param('recordingId') recordingId: string) {
    return this.analyticsService.getHeatmapData(recordingId);
  }

  @Get(':recordingId/frequency-curve')
  @ApiOperation({ summary: '获取频率曲线数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFrequencyCurveData(@Param('recordingId') recordingId: string) {
    return this.analyticsService.getFrequencyCurveData(recordingId);
  }
}
