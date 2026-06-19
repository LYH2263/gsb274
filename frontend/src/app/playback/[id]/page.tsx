'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { usePlayerStore } from '@/store/player';
import { recordingsApi, analyticsApi } from '@/lib/api';
import { formatDuration, formatDateTime } from '@/lib/utils';
import PlayerControls from '@/components/player/PlayerControls';
import Heatmap from '@/components/analytics/Heatmap';

const CodeEditor = dynamic(() => import('@/components/editor/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

interface Recording {
  _id: string;
  title: string;
  language: string;
  duration: number;
  isCompleted: boolean;
  createdAt: string;
  userId: {
    username: string;
    email: string;
  };
}

export default function PlaybackPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, setLoading } = useAuthStore();
  const {
    playbackData,
    currentCode,
    isPlaying,
    currentTime,
    playbackSpeed,
    setPlaybackData,
    setCurrentCode,
    setCurrentTime,
    setIsPlaying,
    setCurrentOperationIndex,
    reset,
  } = usePlayerStore();

  const [recording, setRecording] = useState<Recording | null>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    setLoading(false);
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadRecording();
    loadAnalytics();

    return () => {
      reset();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAuthenticated, params.id]);

  // 播放循环
  useEffect(() => {
    if (!isPlaying || !playbackData) return;

    const startTime = performance.now();
    const startPlaybackTime = currentTime;

    const animate = (now: number) => {
      const elapsed = (now - startTime) * playbackSpeed;
      const newTime = startPlaybackTime + elapsed;

      if (newTime >= playbackData.duration) {
        setCurrentTime(playbackData.duration);
        setIsPlaying(false);
        return;
      }

      // 应用操作
      applyOperationsUntil(newTime);
      setCurrentTime(newTime);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed]);

  const applyOperationsUntil = (targetTime: number) => {
    if (!playbackData) return;

    let code = playbackData.initialCode;
    let lastIndex = 0;

    // 找到最近的快照
    for (let i = 0; i < playbackData.operations.length; i++) {
      const op = playbackData.operations[i];
      if (op.timestamp > targetTime) break;

      if (op.type === 'snapshot' && op.snapshot) {
        code = op.snapshot;
        lastIndex = i + 1;
      }
    }

    // 应用快照后的操作
    for (let i = lastIndex; i < playbackData.operations.length; i++) {
      const op = playbackData.operations[i];
      if (op.timestamp > targetTime) break;

      if (op.type === 'insert' && op.text !== undefined) {
        code = applyInsert(code, op);
      } else if (op.type === 'delete') {
        code = applyDelete(code, op);
      } else if (op.type === 'replace' && op.text !== undefined) {
        code = applyReplace(code, op);
      }

      lastIndex = i + 1;
    }

    setCurrentCode(code);
    setCurrentOperationIndex(lastIndex);
  };

  const applyInsert = (code: string, op: any): string => {
    if (op.line === undefined || op.column === undefined || !op.text) return code;
    const lines = code.split('\n');
    while (lines.length <= op.line) lines.push('');
    const line = lines[op.line];
    lines[op.line] = line.slice(0, op.column) + op.text + line.slice(op.column);
    return lines.join('\n');
  };

  const applyDelete = (code: string, op: any): string => {
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
      const line = lines[op.line];
      lines[op.line] = line.slice(0, op.column) + line.slice(op.endColumn);
    } else {
      const startLine = lines[op.line];
      const endLine = lines[op.endLine];
      lines[op.line] = startLine.slice(0, op.column) + endLine.slice(op.endColumn);
      lines.splice(op.line + 1, op.endLine - op.line);
    }
    return lines.join('\n');
  };

  const applyReplace = (code: string, op: any): string => {
    code = applyDelete(code, op);
    code = applyInsert(code, { ...op, endLine: undefined, endColumn: undefined });
    return code;
  };

  const loadRecording = async () => {
    setIsLoading(true);
    
    // 获取录制信息
    const { data: recordingData, error: recordingError } = await recordingsApi.getById(params.id);
    if (recordingError) {
      toast({
        title: '加载失败',
        description: recordingError,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    setRecording(recordingData);

    // 获取回放数据
    const { data: playbackDataResponse, error: playbackError } = await recordingsApi.getPlaybackData(params.id);
    if (playbackError) {
      toast({
        title: '加载回放数据失败',
        description: playbackError,
        variant: 'destructive',
      });
    } else if (playbackDataResponse) {
      setPlaybackData(playbackDataResponse);
    }

    setIsLoading(false);
  };

  const loadAnalytics = async () => {
    const { data, error } = await analyticsApi.getHeatmap(params.id);
    if (data && data.timeSlots) {
      setHeatmapData(data.timeSlots);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">回放</span>
              </div>
            </div>

            {recording && (
              <div className="text-right">
                <p className="font-medium">{recording.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDuration(recording.duration)} · {recording.language}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-[500px] w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 编辑器 */}
            <Card>
              <CardContent className="p-0">
                <div className="h-[500px]">
                  <CodeEditor
                    value={currentCode}
                    language={playbackData?.language || 'javascript'}
                    readOnly={true}
                    theme="vs-dark"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 播放控制 */}
            <PlayerControls
              heatmapData={heatmapData.map((slot) => ({
                startTime: slot.startTime,
                intensity: slot.intensity,
              }))}
            />

            {/* 分析数据 */}
            <Tabs defaultValue="heatmap">
              <TabsList>
                <TabsTrigger value="heatmap">热力图分析</TabsTrigger>
                <TabsTrigger value="info">录制信息</TabsTrigger>
              </TabsList>

              <TabsContent value="heatmap" className="mt-4">
                <Heatmap data={heatmapData} />
              </TabsContent>

              <TabsContent value="info" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>录制信息</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recording && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">标题</p>
                          <p className="font-medium">{recording.title}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">语言</p>
                          <p className="font-medium">{recording.language}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">时长</p>
                          <p className="font-medium">{formatDuration(recording.duration)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">创建者</p>
                          <p className="font-medium">{recording.userId?.username}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">创建时间</p>
                          <p className="font-medium">{formatDateTime(recording.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">状态</p>
                          <p className="font-medium">
                            {recording.isCompleted ? '已完成' : '录制中'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
