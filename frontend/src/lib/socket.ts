import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${WS_URL}/code`, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// 会话相关事件
export interface JoinSessionPayload {
  sessionId: string;
  userId: string;
  username: string;
}

export interface CodeChangePayload {
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

export interface CursorMovePayload {
  sessionId: string;
  userId: string;
  username: string;
  position: {
    line: number;
    column: number;
  };
}

export interface SelectionChangePayload {
  sessionId: string;
  userId: string;
  username: string;
  selection: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

// Socket 事件发送
export const socketEmit = {
  joinSession: (payload: JoinSessionPayload) =>
    getSocket().emit('join-session', payload),

  leaveSession: (payload: { sessionId: string; userId: string }) =>
    getSocket().emit('leave-session', payload),

  codeChange: (payload: CodeChangePayload) =>
    getSocket().emit('code-change', payload),

  cursorMove: (payload: CursorMovePayload) =>
    getSocket().emit('cursor-move', payload),

  selectionChange: (payload: SelectionChangePayload) =>
    getSocket().emit('selection-change', payload),

  recordingControl: (payload: { sessionId: string; recordingId: string; action: string }) =>
    getSocket().emit('recording-control', payload),

  syncCode: (payload: { sessionId: string; code: string }) =>
    getSocket().emit('sync-code', payload),

  getOnlineUsers: (payload: { sessionId: string }) =>
    getSocket().emit('get-online-users', payload),
};

// Socket 事件监听
export const socketOn = {
  userJoined: (callback: (data: { userId: string; username: string }) => void) =>
    getSocket().on('user-joined', callback),

  userLeft: (callback: (data: { userId: string; username: string }) => void) =>
    getSocket().on('user-left', callback),

  codeChanged: (callback: (data: { userId: string; operation: any }) => void) =>
    getSocket().on('code-changed', callback),

  cursorMoved: (callback: (data: { userId: string; username: string; position: any }) => void) =>
    getSocket().on('cursor-moved', callback),

  selectionChanged: (callback: (data: { userId: string; username: string; selection: any }) => void) =>
    getSocket().on('selection-changed', callback),

  recordingStatus: (callback: (data: { recordingId: string; action: string }) => void) =>
    getSocket().on('recording-status', callback),

  codeSynced: (callback: (data: { code: string }) => void) =>
    getSocket().on('code-synced', callback),
};

// 移除事件监听
export const socketOff = {
  userJoined: () => getSocket().off('user-joined'),
  userLeft: () => getSocket().off('user-left'),
  codeChanged: () => getSocket().off('code-changed'),
  cursorMoved: () => getSocket().off('cursor-moved'),
  selectionChanged: () => getSocket().off('selection-changed'),
  recordingStatus: () => getSocket().off('recording-status'),
  codeSynced: () => getSocket().off('code-synced'),
};
