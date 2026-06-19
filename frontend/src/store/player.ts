import { create } from 'zustand';

export interface Operation {
  type: 'insert' | 'delete' | 'replace' | 'cursor' | 'selection' | 'snapshot';
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  text?: string;
  snapshot?: string;
  timestamp: number;
}

export interface PlaybackData {
  initialCode: string;
  operations: Operation[];
  duration: number;
  language: string;
}

interface PlayerState {
  // 播放状态
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  
  // 数据
  playbackData: PlaybackData | null;
  currentCode: string;
  currentOperationIndex: number;
  
  // 热力图数据
  heatmapData: { startTime: number; intensity: number }[];
  
  // 操作方法
  setPlaybackData: (data: PlaybackData) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setCurrentCode: (code: string) => void;
  setCurrentOperationIndex: (index: number) => void;
  setHeatmapData: (data: { startTime: number; intensity: number }[]) => void;
  
  // 播放控制
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // 初始状态
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackSpeed: 1,
  playbackData: null,
  currentCode: '',
  currentOperationIndex: 0,
  heatmapData: [],

  // 设置方法
  setPlaybackData: (data) =>
    set({
      playbackData: data,
      duration: data.duration,
      currentCode: data.initialCode,
      currentOperationIndex: 0,
      currentTime: 0,
    }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setCurrentCode: (code) => set({ currentCode: code }),

  setCurrentOperationIndex: (index) => set({ currentOperationIndex: index }),

  setHeatmapData: (data) => set({ heatmapData: data }),

  // 播放控制
  play: () => {
    const { playbackData } = get();
    if (playbackData) {
      set({ isPlaying: true });
    }
  },

  pause: () => set({ isPlaying: false }),

  seek: (time) => {
    const { playbackData } = get();
    if (!playbackData) return;

    // 找到对应时间点的代码状态
    let code = playbackData.initialCode;
    let operationIndex = 0;

    // 查找最近的快照
    const snapshots = playbackData.operations.filter(
      (op) => op.type === 'snapshot' && op.timestamp <= time
    );

    if (snapshots.length > 0) {
      const lastSnapshot = snapshots[snapshots.length - 1];
      code = lastSnapshot.snapshot || code;
      operationIndex = playbackData.operations.indexOf(lastSnapshot) + 1;
    }

    // 从快照或初始状态应用操作直到目标时间
    for (let i = operationIndex; i < playbackData.operations.length; i++) {
      const op = playbackData.operations[i];
      if (op.timestamp > time) break;
      
      // 应用操作（简化处理，实际需要更复杂的 OT 逻辑）
      if (op.type === 'insert' && op.text) {
        // 这里简化处理，实际项目中需要精确的位置计算
        code = applyInsert(code, op);
      } else if (op.type === 'delete') {
        code = applyDelete(code, op);
      } else if (op.type === 'replace' && op.text) {
        code = applyReplace(code, op);
      }
      
      operationIndex = i + 1;
    }

    set({
      currentTime: time,
      currentCode: code,
      currentOperationIndex: operationIndex,
    });
  },

  reset: () =>
    set({
      isPlaying: false,
      currentTime: 0,
      currentCode: '',
      currentOperationIndex: 0,
      playbackData: null,
      heatmapData: [],
    }),
}));

// 辅助函数：应用插入操作
function applyInsert(code: string, op: Operation): string {
  if (op.line === undefined || op.column === undefined || !op.text) return code;
  
  const lines = code.split('\n');
  if (op.line >= lines.length) {
    // 添加新行
    while (lines.length <= op.line) {
      lines.push('');
    }
  }
  
  const line = lines[op.line];
  lines[op.line] = line.slice(0, op.column) + op.text + line.slice(op.column);
  
  return lines.join('\n');
}

// 辅助函数：应用删除操作
function applyDelete(code: string, op: Operation): string {
  if (
    op.line === undefined ||
    op.column === undefined ||
    op.endLine === undefined ||
    op.endColumn === undefined
  ) {
    return code;
  }
  
  const lines = code.split('\n');
  
  if (op.line === op.endLine) {
    // 同一行内删除
    const line = lines[op.line];
    lines[op.line] = line.slice(0, op.column) + line.slice(op.endColumn);
  } else {
    // 跨行删除
    const startLine = lines[op.line];
    const endLine = lines[op.endLine];
    lines[op.line] = startLine.slice(0, op.column) + endLine.slice(op.endColumn);
    lines.splice(op.line + 1, op.endLine - op.line);
  }
  
  return lines.join('\n');
}

// 辅助函数：应用替换操作
function applyReplace(code: string, op: Operation): string {
  // 先删除再插入
  code = applyDelete(code, op);
  code = applyInsert(code, { ...op, endLine: undefined, endColumn: undefined });
  return code;
}
