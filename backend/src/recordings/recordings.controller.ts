import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { RecordingsService } from './recordings.service';
import { CreateRecordingDto } from './dto/create-recording.dto';
import { AddOperationDto } from './dto/add-operation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Recording } from './schemas/recording.schema';

@ApiTags('recordings')
@Controller('api/recordings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  @Post()
  @ApiOperation({ summary: '创建录制' })
  @ApiResponse({ status: 201, description: '创建成功', type: Recording })
  async create(@Body() createRecordingDto: CreateRecordingDto, @Request() req: RequestWithUser) {
    return this.recordingsService.create(createRecordingDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '获取录制列表' })
  @ApiQuery({ name: 'mine', required: false, description: '只显示我的录制' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Recording] })
  async findAll(@Query('mine') mine: string, @Request() req: any) {
    const userId = mine === 'true' ? req.user.userId : undefined;
    return this.recordingsService.findAll(userId);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: '获取会话的录制列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Recording] })
  async findBySession(@Param('sessionId') sessionId: string) {
    return this.recordingsService.findBySession(sessionId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个录制' })
  @ApiResponse({ status: 200, description: '获取成功', type: Recording })
  @ApiResponse({ status: 404, description: '录制不存在' })
  async findOne(@Param('id') id: string) {
    return this.recordingsService.findOne(id);
  }

  @Get(':id/playback')
  @ApiOperation({ summary: '获取回放数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '录制不存在' })
  async getPlaybackData(@Param('id') id: string) {
    return this.recordingsService.getPlaybackData(id);
  }

  @Get(':id/snapshot')
  @ApiOperation({ summary: '获取特定时间点的快照' })
  @ApiQuery({ name: 'timestamp', required: true, description: '时间戳（毫秒）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSnapshot(@Param('id') id: string, @Query('timestamp') timestamp: number) {
    const code = await this.recordingsService.getSnapshotAtTime(id, timestamp);
    return { code };
  }

  @Post(':id/operations')
  @ApiOperation({ summary: '添加操作记录' })
  @ApiResponse({ status: 201, description: '添加成功' })
  async addOperation(
    @Param('id') id: string,
    @Body() operationDto: AddOperationDto,
    @Request() req: any,
  ) {
    await this.recordingsService.addOperation(id, operationDto, req.user.userId);
    return { message: '操作已记录' };
  }

  @Post(':id/operations/batch')
  @ApiOperation({ summary: '批量添加操作记录' })
  @ApiResponse({ status: 201, description: '添加成功' })
  async addOperationsBatch(
    @Param('id') id: string,
    @Body() operations: AddOperationDto[],
    @Request() req: any,
  ) {
    await this.recordingsService.addOperationsBatch(id, operations, req.user.userId);
    return { message: '操作已批量记录' };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成录制' })
  @ApiResponse({ status: 200, description: '完成成功', type: Recording })
  async completeRecording(
    @Param('id') id: string,
    @Body('finalCode') finalCode: string,
    @Request() req: any,
  ) {
    return this.recordingsService.completeRecording(id, finalCode, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除录制' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '录制不存在' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.recordingsService.remove(id, req.user.userId);
    return { message: '录制已删除' };
  }
}
