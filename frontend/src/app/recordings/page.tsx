'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Search, Clock, Code2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { recordingsApi } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/utils';

interface Recording {
  _id: string;
  title: string;
  language: string;
  duration: number;
  isCompleted: boolean;
  createdAt: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  sessionId: {
    _id: string;
    title: string;
  };
}

export default function RecordingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user, setLoading } = useAuthStore();
  
  const [allRecordings, setAllRecordings] = useState<Recording[]>([]);
  const [myRecordings, setMyRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadRecordings();
  }, [isAuthenticated, router, setLoading]);

  const loadRecordings = async () => {
    setIsLoading(true);
    
    // 加载所有录制
    const { data: allData } = await recordingsApi.getAll();
    if (allData) {
      setAllRecordings(allData);
    }

    // 加载我的录制
    const { data: myData } = await recordingsApi.getAll(true);
    if (myData) {
      setMyRecordings(myData);
    }

    setIsLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('确定要删除这个录制吗？')) {
      return;
    }

    const { error } = await recordingsApi.delete(id);
    if (error) {
      toast({
        title: '删除失败',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: '删除成功',
      });
      loadRecordings();
    }
  };

  const filterRecordings = (recordings: Recording[]) => {
    if (!searchQuery) return recordings;
    const query = searchQuery.toLowerCase();
    return recordings.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.language.toLowerCase().includes(query) ||
        r.sessionId?.title?.toLowerCase().includes(query)
    );
  };

  const RecordingCard = ({ recording, showDelete = false }: { recording: Recording; showDelete?: boolean }) => (
    <Link href={`/playback/${recording._id}`}>
      <Card className="card-hover cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{recording.title}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {recording.sessionId?.title || '独立录制'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {recording.isCompleted ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  已完成
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  录制中
                </span>
              )}
              {showDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDelete(recording._id, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Code2 className="w-4 h-4" />
              <span>{recording.language}</span>
            </div>
            <div className="flex items-center gap-1">
              <Play className="w-4 h-4" />
              <span>{formatDuration(recording.duration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(recording.createdAt)}</span>
            </div>
          </div>
          {recording.userId && (
            <div className="mt-4 text-sm">
              <span className="text-muted-foreground">录制者: </span>
              <span>{recording.userId.username}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );

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
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Play className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xl font-bold">录制列表</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索栏 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索录制..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 标签页 */}
        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine">我的录制</TabsTrigger>
            <TabsTrigger value="all">所有录制</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-6">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-48 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filterRecordings(myRecordings).length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterRecordings(myRecordings).map((recording) => (
                  <RecordingCard key={recording._id} recording={recording} showDelete />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>您还没有任何录制</p>
                <p className="text-sm mt-1">在会话中开始录制编程过程</p>
                <Link href="/sessions">
                  <Button variant="link" className="mt-2">
                    浏览会话
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-48 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filterRecordings(allRecordings).length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterRecordings(allRecordings).map((recording) => (
                  <RecordingCard key={recording._id} recording={recording} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无录制</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
