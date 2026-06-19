import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Session } from './schemas/session.schema';

@ApiTags('sessions')
@Controller('api/sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: '创建编程会话' })
  @ApiResponse({ status: 201, description: '创建成功', type: Session })
  async create(@Body() createSessionDto: CreateSessionDto, @Request() req: any) {
    return this.sessionsService.create(createSessionDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '获取会话列表' })
  @ApiQuery({ name: 'mine', required: false, description: '只显示我的会话' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Session] })
  async findAll(@Query('mine') mine: string, @Request() req: any) {
    const userId = mine === 'true' ? req.user.userId : undefined;
    return this.sessionsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个会话' })
  @ApiResponse({ status: 200, description: '获取成功', type: Session })
  @ApiResponse({ status: 404, description: '会话不存在' })
  async findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新会话信息' })
  @ApiResponse({ status: 200, description: '更新成功', type: Session })
  @ApiResponse({ status: 404, description: '会话不存在' })
  @ApiResponse({ status: 403, description: '无权修改此会话' })
  async update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Request() req: any,
  ) {
    return this.sessionsService.update(id, updateSessionDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除会话' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '会话不存在' })
  @ApiResponse({ status: 403, description: '无权删除此会话' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.sessionsService.remove(id, req.user.userId);
    return { message: '会话已删除' };
  }

  @Post(':id/start')
  @ApiOperation({ summary: '启动会话' })
  @ApiResponse({ status: 200, description: '启动成功', type: Session })
  async startSession(@Param('id') id: string, @Request() req: any) {
    return this.sessionsService.startSession(id, req.user.userId);
  }

  @Post(':id/end')
  @ApiOperation({ summary: '结束会话' })
  @ApiResponse({ status: 200, description: '结束成功', type: Session })
  async endSession(@Param('id') id: string, @Request() req: any) {
    return this.sessionsService.endSession(id, req.user.userId);
  }

  @Post(':id/join')
  @ApiOperation({ summary: '加入会话' })
  @ApiResponse({ status: 200, description: '加入成功', type: Session })
  async joinSession(@Param('id') id: string, @Request() req: any) {
    return this.sessionsService.joinSession(id, req.user.userId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: '离开会话' })
  @ApiResponse({ status: 200, description: '离开成功', type: Session })
  async leaveSession(@Param('id') id: string, @Request() req: any) {
    return this.sessionsService.leaveSession(id, req.user.userId);
  }
}
