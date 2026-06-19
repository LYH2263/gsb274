'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Code2,
  Circle,
  Play,
  Square,
  Users,
  Settings,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { sessionsApi, recordingsApi, analyticsApi } from '@/lib/api';
import {
  connectSocket,
  disconnectSocket,
  socketEmit,
  socketOn,
  socketOff,
} from '@/lib/socket';

const CodeEditor = dynamic(() => import('@/components/editor/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

interface Session {
  _id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  initialCode: string;
  currentCode: string;
  creatorId: {
    _id: string;
    username: string;
  };
}

interface OnlineUser {
  userId: string;
  username: string;
}

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user, setLoading } = useAuthStore();

  const [session, setSession] = useState<Session | null>(null);
  const [code, setCode] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);

  const operationsBuffer = useRef<any[]>([]);
  const inputEventsBuffer = useRef<any[]>([]);
  const flushIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isOwner = session?.creatorId?._id === user?.id;

  useEffect(() => {
    setLoading(false);

    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    loadSession();
    setupSocket();

    return () => {
      cleanupSocket();
      cleanupRecording();
    };
  }, [isAuthenticated, params.id]);

  const loadSession = async () => {
    setIsLoading(true);
    const { data, error } = await sessionsApi.getById(params.id);
    if (error) {
      toast({
        title: '加载失败',
        description: error,
        variant: 'destructive',
      });
      router.push('/sessions');
      return;
    }
    if (data) {
      setSession(data);
      setCode(data.currentCode || data.initialCode || '');
    }
    setIsLoading(false);
  };

  const setupSocket = () => {
    if (!user) return;

    connectSocket();

    // 加入会话
    socketEmit.joinSession({
      sessionId: params.id,
      userId: user.id,
      username: user.username,
    });

    // 监听事件
    socketOn.userJoined((data) => {
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.userId === data.userId)) return prev;
        return [...prev, data];
      });
      toast({
        title: `${data.username} 加入了会话`,
      });
    });

    socketOn.userLeft((data) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    socketOn.codeChanged((data) => {
      if (data.userId !== user.id) {
        // 应用其他用户的代码变更
        // 这里简化处理，实际需要 OT 合并
      }
    });

    socketOn.codeSynced((data) => {
      setCode(data.code);
    });
  };

  const cleanupSocket = () => {
    if (!user) return;

    socketEmit.leaveSession({
      sessionId: params.id,
      userId: user.id,
    });

    socketOff.userJoined();
    socketOff.userLeft();
    socketOff.codeChanged();
    socketOff.codeSynced();

    disconnectSocket();
  };

  const cleanupRecording = () => {
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
    }
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
    }
  };

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);

      // 广播代码变更
      if (user) {
        socketEmit.codeChange({
          sessionId: params.id,
          userId: user.id,
          operation: {
            type: 'replace',
            line: 0,
            column: 0,
            text: newCode,
            timestamp: Date.now() - recordingStartTime,
          },
        });
      }

      // 录制中记录操作
      if (isRecording) {
        const timestamp = Date.now() - recordingStartTime;
        operationsBuffer.current.push({
          type: 'replace',
          line: 0,
          column: 0,
          text: newCode,
          timestamp,
        });

        inputEventsBuffer.current.push({
          timestamp,
          type: 'input',
          charCount: 1,
        });
      }
    },
    [user, params.id, isRecording, recordingStartTime]
  );

  const startRecording = async () => {
    if (!session) return;

    try {
      // 创建录制
      const { data, error } = await recordingsApi.create({
        sessionId: session._id,
        title: `${session.title} - 录制`,
        language: session.language,
        initialCode: code,
      });

      if (error) {
        toast({
          title: '开始录制失败',
          description: error,
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        setRecordingId(data._id);
        setRecordingStartTime(Date.now());
        setIsRecording(true);

        // 创建分析记录
        await analyticsApi.create({
          recordingId: data._id,
          sessionId: session._id,
        });

        // 定期刷新操作缓冲区
        flushIntervalRef.current = setInterval(async () => {
          if (operationsBuffer.current.length > 0) {
            const ops = [...operationsBuffer.current];
            operationsBuffer.current = [];
            await recordingsApi.addOperationsBatch(data._id, ops);
          }

          if (inputEventsBuffer.current.length > 0) {
            const events = [...inputEventsBuffer.current];
            inputEventsBuffer.current = [];
            await analyticsApi.addInputEventsBatch(data._id, events);
          }
        }, 5000);

        // 定期保存快照
        snapshotIntervalRef.current = setInterval(() => {
          const timestamp = Date.now() - recordingStartTime;
          operationsBuffer.current.push({
            type: 'snapshot',
            snapshot: code,
            timestamp,
          });
        }, 30000);

        toast({
          title: '开始录制',
          description: '您的编程过程正在被记录',
        });

        // 通知其他用户
        socketEmit.recordingControl({
          sessionId: session._id,
          recordingId: data._id,
          action: 'start',
        });
      }
    } catch (err) {
      toast({
        title: '开始录制失败',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = async () => {
    if (!recordingId) return;

    try {
      cleanupRecording();

      // 刷新剩余操作
      if (operationsBuffer.current.length > 0) {
        await recordingsApi.addOperationsBatch(recordingId, operationsBuffer.current);
        operationsBuffer.current = [];
      }

      if (inputEventsBuffer.current.length > 0) {
        await analyticsApi.addInputEventsBatch(recordingId, inputEventsBuffer.current);
        inputEventsBuffer.current = [];
      }

      // 完成录制
      await recordingsApi.complete(recordingId, code);

      // 处理分析数据
      await analyticsApi.process(recordingId);

      setIsRecording(false);

      toast({
        title: '录制完成',
        description: '您可以在录制列表中查看回放',
      });

      // 通知其他用户
      if (session) {
        socketEmit.recordingControl({
          sessionId: session._id,
          recordingId,
          action: 'stop',
        });
      }

      setRecordingId(null);
    } catch (err) {
      toast({
        title: '停止录制失败',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCode = async () => {
    if (!session) return;

    socketEmit.syncCode({
      sessionId: session._id,
      code,
    });

    toast({
      title: '代码已同步',
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href="/sessions">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              {isLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="font-semibold">{session?.title}</h1>
                    <p className="text-xs text-muted-foreground">
                      {session?.language}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* 在线用户 */}
              <div className="flex items-center gap-1 mr-4">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {onlineUsers.length + 1}
                </span>
                <div className="flex -space-x-2 ml-2">
                  {onlineUsers.slice(0, 3).map((u) => (
                    <TooltipProvider key={u.userId}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar className="w-6 h-6 border-2 border-background">
                            <AvatarFallback className="text-xs">
                              {u.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>{u.username}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {onlineUsers.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                      +{onlineUsers.length - 3}
                    </div>
                  )}
                </div>
              </div>

              {/* 录制控制（仅创建者可见） */}
              {isOwner && (
                <>
                  {isRecording ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={stopRecording}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      停止录制
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={startRecording}
                    >
                      <Circle className="w-4 h-4 mr-2 text-red-500" />
                      开始录制
                    </Button>
                  )}
                </>
              )}

              {/* 录制状态指示 */}
              {isRecording && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-red-600 dark:text-red-400">
                    录制中
                  </span>
                </div>
              )}

              <Button variant="ghost" size="icon" onClick={handleSaveCode}>
                <Save className="w-5 h-5" />
              </Button>

              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 编辑器区域 */}
      <main className="flex-1 p-4">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-lg" />
        ) : (
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <CodeEditor
                value={code}
                language={session?.language || 'javascript'}
                onChange={handleCodeChange}
                theme="vs-dark"
                height="calc(100vh - 120px)"
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
