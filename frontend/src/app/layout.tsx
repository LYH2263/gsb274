import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CodeEdu - 在线编程教育平台',
  description: '基于 Web 的代码实时协作与回放系统，支持教师录制编程过程、学生回放学习',
  keywords: ['编程教育', '在线学习', '代码协作', 'Monaco Editor', '实时同步'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
