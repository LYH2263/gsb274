import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SessionsService } from '../sessions/sessions.service';
import { RecordingsService } from '../recordings/recordings.service';
import { AnalyticsService } from '../analytics/analytics.service';

interface JoinSessionPayload {
  sessionId: string;
  userId: string;
  username: string;
}

interface CodeChangePayload {
  sessionId: string;
  userId: string;
  operation: {
    type: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
    text?: string;
    timestamp: number;
  };
}

interface CursorMovePayload {
  sessionId: string;
  userId: string;
  username: string;
  position: {
    line: number;
    column: number;
  };
}

interface RecordingControlPayload {
  sessionId: string;
  recordingId: string;
  action: 'start' | 'stop' | 'pause' | 'resume';
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/code',
})
export class CodeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CodeGateway.name);
  private connectedUsers: Map<string, { socketId: string; sessionId: string; username: string }> =
    new Map();

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly recordingsService: RecordingsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // 找到并移除断开连接的用户
    for (const [userId, userData] of this.connectedUsers.entries()) {
      if (userData.socketId === client.id) {
        this.connectedUsers.delete(userId);
        // 通知房间内其他用户
        this.server.to(userData.sessionId).emit('user-left', {
          userId,
          username: userData.username,
        });
        break;
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinSessionPayload,
  ) {
    const { sessionId, userId, username } = payload;

    // 加入房间
    client.join(sessionId);

    // 记录用户信息
    this.connectedUsers.set(userId, {
      socketId: client.id,
      sessionId,
      username,
    });

    // 获取会话信息
    const session = await this.sessionsService.findOne(sessionId);

    // 通知房间内其他用户
    client.to(sessionId).emit('user-joined', {
      userId,
      username,
    });

    // 返回当前会话状态和在线用户列表
    const onlineUsers = Array.from(this.connectedUsers.entries())
      .filter(([, data]) => data.sessionId === sessionId)
      .map(([id, data]) => ({ userId: id, username: data.username }));

    return {
      success: true,
      session,
      onlineUsers,
    };
  }

  @SubscribeMessage('leave-session')
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; userId: string },
  ) {
    const { sessionId, userId } = payload;

    client.leave(sessionId);
    const userData = this.connectedUsers.get(userId);
    this.connectedUsers.delete(userId);

    // 通知房间内其他用户
    if (userData) {
      this.server.to(sessionId).emit('user-left', {
        userId,
        username: userData.username,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('code-change')
  async handleCodeChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CodeChangePayload,
  ) {
    const { sessionId, userId, operation } = payload;

    // 广播给房间内其他用户
    client.to(sessionId).emit('code-changed', {
      userId,
      operation,
    });

    // 更新会话中的当前代码（可选，根据操作重建）
    // 这里简化处理，实际项目中可能需要更复杂的 OT 合并逻辑

    return { success: true };
  }

  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CursorMovePayload,
  ) {
    const { sessionId, userId, username, position } = payload;

    // 广播给房间内其他用户
    client.to(sessionId).emit('cursor-moved', {
      userId,
      username,
      position,
    });

    return { success: true };
  }

  @SubscribeMessage('selection-change')
  handleSelectionChange(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      sessionId: string;
      userId: string;
      username: string;
      selection: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
      };
    },
  ) {
    const { sessionId, userId, username, selection } = payload;

    // 广播给房间内其他用户
    client.to(sessionId).emit('selection-changed', {
      userId,
      username,
      selection,
    });

    return { success: true };
  }

  @SubscribeMessage('recording-control')
  async handleRecordingControl(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: RecordingControlPayload,
  ) {
    const { sessionId, recordingId, action } = payload;

    // 广播录制状态变化
    this.server.to(sessionId).emit('recording-status', {
      recordingId,
      action,
    });

    return { success: true };
  }

  @SubscribeMessage('sync-code')
  async handleSyncCode(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; code: string },
  ) {
    const { sessionId, code } = payload;

    // 更新会话代码
    await this.sessionsService.updateCode(sessionId, code);

    // 广播给房间内其他用户
    client.to(sessionId).emit('code-synced', { code });

    return { success: true };
  }

  // 获取房间在线用户
  @SubscribeMessage('get-online-users')
  handleGetOnlineUsers(@MessageBody() payload: { sessionId: string }) {
    const { sessionId } = payload;

    const onlineUsers = Array.from(this.connectedUsers.entries())
      .filter(([, data]) => data.sessionId === sessionId)
      .map(([id, data]) => ({ userId: id, username: data.username }));

    return { onlineUsers };
  }
}
