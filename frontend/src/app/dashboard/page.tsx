'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Code2,
  Play,
  Plus,
  Users,
  Clock,
  LogOut,
  Settings,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { sessionsApi, recordingsApi } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/utils';

interface Session {
  _id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  createdAt: string;
  creatorId: {
    username: string;
    email: string;
  };
}

interface Recording {
  _id: string;
  title: string;
  language: string;
  duration: number;
  isCompleted: boolean;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, logout, setLoading } = useAuthStore();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(true);

  useEffect(() => {
    setLoading(false);
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadSessions();
    loadRecordings();
  }, [isAuthenticated, router, setLoading]);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    const { data, error } = await sessionsApi.getAll(true);
    if (data) {
      setSessions(data);
    } else if (error) {
      toast({
        title: '加载失败',
        description: error,
        variant: 'destructive',
      });
    }
    setIsLoadingSessions(false);
  };

  const loadRecordings = async () => {
    setIsLoadingRecordings(true);
    const { data, error } = await recordingsApi.getAll(true);
    if (data) {
      setRecordings(data);
    } else if (error) {
      toast({
        title: '加载失败',
        description: error,
        variant: 'destructive',
      });
    }
    setIsLoadingRecordings(false);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: '已退出登录',
    });
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'pending':
        return '待开始';
      case 'completed':
        return '已完成';
      case 'paused':
        return '已暂停';
      default:
        return status;
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">CodeEdu</span>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role === 'teacher' ? '教师' : '学生'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            你好，{user.username}！
          </h1>
          <p className="text-muted-foreground">
            {user.role === 'teacher'
              ? '开始创建编程会话，录制教学内容'
              : '加入会话，开始学习编程'}
          </p>
        </div>

        {/* 快捷操作 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/sessions/new">
            <Card className="card-hover cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">创建会话</p>
                  <p className="text-sm text-muted-foreground">开始新的编程会话</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/sessions">
            <Card className="card-hover cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">加入会话</p>
                  <p className="text-sm text-muted-foreground">浏览可用会话</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/recordings">
            <Card className="card-hover cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Play className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">我的录制</p>
                  <p className="text-sm text-muted-foreground">查看录制内容</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="card-hover cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">数据分析</p>
                  <p className="text-sm text-muted-foreground">查看学习统计</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 最近会话 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                最近会话
                <Link href="/sessions">
                  <Button variant="ghost" size="sm">
                    查看全部
                  </Button>
                </Link>
              </CardTitle>
              <CardDescription>您参与的编程会话</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.slice(0, 5).map((session) => (
                    <Link
                      key={session._id}
                      href={`/sessions/${session._id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Code2 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{session.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{session.language}</span>
                          <span>•</span>
                          <span>{formatDate(session.createdAt)}</span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          session.status
                        )}`}
                      >
                        {getStatusText(session.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>暂无会话</p>
                  <Link href="/sessions/new">
                    <Button variant="link" className="mt-2">
                      创建第一个会话
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 最近录制 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                最近录制
                <Link href="/recordings">
                  <Button variant="ghost" size="sm">
                    查看全部
                  </Button>
                </Link>
              </CardTitle>
              <CardDescription>您的编程录制</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRecordings ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recordings.length > 0 ? (
                <div className="space-y-4">
                  {recordings.slice(0, 5).map((recording) => (
                    <Link
                      key={recording._id}
                      href={`/playback/${recording._id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Play className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{recording.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{recording.language}</span>
                          <span>•</span>
                          <span>{formatDuration(recording.duration)}</span>
                        </div>
                      </div>
                      {recording.isCompleted ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          已完成
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          录制中
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>暂无录制</p>
                  <p className="text-sm mt-1">在会话中开始录制</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
