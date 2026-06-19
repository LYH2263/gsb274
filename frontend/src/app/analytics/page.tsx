'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Activity, Clock, Code2, Play, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { analyticsApi, recordingsApi } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/utils';

interface AnalyticsData {
  _id: string;
  recordingId: {
    _id: string;
    title: string;
    language: string;
    duration: number;
  };
  sessionId: {
    _id: string;
    title: string;
  };
  totalEvents: number;
  averageSpeed: number;
  peakSpeed: number;
  createdAt: string;
}

interface Recording {
  _id: string;
  title: string;
  language: string;
  duration: number;
  isCompleted: boolean;
  createdAt: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user, setLoading } = useAuthStore();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecordings: 0,
    totalDuration: 0,
    totalEvents: 0,
    avgSpeed: 0,
  });

  useEffect(() => {
    setLoading(false);
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadData();
  }, [isAuthenticated, router, setLoading]);

  const loadData = async () => {
    setIsLoading(true);
    
    // 加载用户的分析数据
    const { data: analytics } = await analyticsApi.getByUser();
    if (analytics) {
      setAnalyticsData(analytics);
      
      // 计算统计数据
      const totalEvents = analytics.reduce((sum, a) => sum + (a.totalEvents || 0), 0);
      const avgSpeed = analytics.length > 0
        ? analytics.reduce((sum, a) => sum + (a.averageSpeed || 0), 0) / analytics.length
        : 0;
      
      setStats(prev => ({
        ...prev,
        totalEvents,
        avgSpeed: Math.round(avgSpeed * 100) / 100,
      }));
    }

    // 加载用户的录制
    const { data: recordingsData } = await recordingsApi.getAll(true);
    if (recordingsData) {
      setRecordings(recordingsData);
      
      const totalDuration = recordingsData.reduce((sum, r) => sum + (r.duration || 0), 0);
      setStats(prev => ({
        ...prev,
        totalRecordings: recordingsData.length,
        totalDuration,
      }));
    }

    setIsLoading(false);
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
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-xl font-bold">数据分析</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Play className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats.totalRecordings}</p>
                    <p className="text-sm text-muted-foreground">总录制数</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</p>
                    <p className="text-sm text-muted-foreground">总时长</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats.totalEvents}</p>
                    <p className="text-sm text-muted-foreground">总输入事件</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats.avgSpeed}</p>
                    <p className="text-sm text-muted-foreground">平均速度 (字/分)</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 录制分析列表 */}
        <Card>
          <CardHeader>
            <CardTitle>录制分析详情</CardTitle>
            <CardDescription>查看每个录制的详细分析数据</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : recordings.length > 0 ? (
              <div className="space-y-4">
                {recordings.map((recording) => {
                  const analytics = analyticsData.find(
                    (a) => a.recordingId?._id === recording._id
                  );
                  
                  return (
                    <Link
                      key={recording._id}
                      href={`/playback/${recording._id}`}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Play className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{recording.title}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Code2 className="w-3 h-3" />
                            {recording.language}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(recording.duration)}
                          </span>
                          <span>{formatDate(recording.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {analytics ? (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {analytics.totalEvents || 0} 事件
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {analytics.averageSpeed?.toFixed(1) || 0} 字/分
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            暂无数据
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无分析数据</p>
                <p className="text-sm mt-1">开始录制以生成分析数据</p>
                <Link href="/sessions">
                  <Button variant="link" className="mt-2">
                    浏览会话
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
