'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Code2, Plus, Search, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { sessionsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Session {
  _id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  createdAt: string;
  creatorId: {
    _id: string;
    username: string;
    email: string;
  };
  participants: { username: string }[];
}

export default function SessionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user, setLoading } = useAuthStore();
  
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [mySessions, setMySessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadSessions();
  }, [isAuthenticated, router, setLoading]);

  const loadSessions = async () => {
    setIsLoading(true);
    
    // 加载所有会话
    const { data: allData } = await sessionsApi.getAll();
    if (allData) {
      setAllSessions(allData);
    }

    // 加载我的会话
    const { data: myData } = await sessionsApi.getAll(true);
    if (myData) {
      setMySessions(myData);
    }

    setIsLoading(false);
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

  const filterSessions = (sessions: Session[]) => {
    if (!searchQuery) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.language.toLowerCase().includes(query)
    );
  };

  const SessionCard = ({ session }: { session: Session }) => (
    <Link href={`/sessions/${session._id}`}>
      <Card className="card-hover cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{session.title}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {session.description || '暂无描述'}
              </CardDescription>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getStatusColor(
                session.status
              )}`}
            >
              {getStatusText(session.status)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Code2 className="w-4 h-4" />
              <span>{session.language}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{session.participants?.length || 0} 参与者</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(session.createdAt)}</span>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <span className="text-muted-foreground">创建者: </span>
            <span>{session.creatorId?.username}</span>
          </div>
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
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">编程会话</span>
              </div>
            </div>

            <Link href="/sessions/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                创建会话
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索栏 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索会话..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 标签页 */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">所有会话</TabsTrigger>
            <TabsTrigger value="mine">我的会话</TabsTrigger>
          </TabsList>

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
            ) : filterSessions(allSessions).length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterSessions(allSessions).map((session) => (
                  <SessionCard key={session._id} session={session} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无会话</p>
                <Link href="/sessions/new">
                  <Button variant="link" className="mt-2">
                    创建第一个会话
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

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
            ) : filterSessions(mySessions).length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterSessions(mySessions).map((session) => (
                  <SessionCard key={session._id} session={session} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>您还没有创建或参与任何会话</p>
                <Link href="/sessions/new">
                  <Button variant="link" className="mt-2">
                    创建会话
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
