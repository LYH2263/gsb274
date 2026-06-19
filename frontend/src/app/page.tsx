'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Code2,
  Play,
  Users,
  BarChart3,
  ChevronRight,
  Menu,
  X,
  Zap,
  Shield,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Code2,
      title: 'Monaco Editor 集成',
      description: '基于 VS Code 核心的代码编辑器，支持多语言语法高亮和智能补全',
    },
    {
      icon: Play,
      title: '录制与回放',
      description: '记录操作指令实现代码流录制，支持快进、快退和倍速播放',
    },
    {
      icon: Users,
      title: '实时协作',
      description: '基于 Socket.io 的实时同步，多人同时编辑，光标位置实时显示',
    },
    {
      icon: BarChart3,
      title: '行为分析',
      description: '生成输入频率热力图，展示编程活跃度变化曲线',
    },
  ];

  const stats = [
    { value: '10K+', label: '活跃用户' },
    { value: '50K+', label: '教学会话' },
    { value: '99.9%', label: '系统稳定性' },
    { value: '4.9', label: '用户评分' },
  ];

  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">CodeEdu</span>
            </div>

            {/* 桌面导航 */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                功能特性
              </Link>
              <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                关于我们
              </Link>
              <Link href="/login">
                <Button variant="ghost">登录</Button>
              </Link>
              <Link href="/register">
                <Button>免费注册</Button>
              </Link>
            </div>

            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border">
            <div className="px-4 py-4 space-y-4">
              <Link
                href="#features"
                className="block text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                功能特性
              </Link>
              <Link
                href="#about"
                className="block text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                关于我们
              </Link>
              <div className="flex gap-4 pt-4">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">登录</Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button className="w-full">免费注册</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero 区域 */}
      <section className="pt-32 pb-20 px-4 hero-gradient">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">全新升级的编程教育体验</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            让编程教学
            <span className="text-primary"> 更直观</span>
            <br />
            <span className="text-primary">更高效</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            CodeEdu 是一个基于 Web 的代码实时协作与回放系统，
            帮助教师录制编程过程，让学生通过回放学习，提供行为分析助力教学。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                立即开始
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                <Play className="w-5 h-5 mr-2" />
                观看演示
              </Button>
            </Link>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">强大的功能特性</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              为编程教育量身打造的完整解决方案
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-card rounded-xl border border-border card-hover"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 为什么选择我们 */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                为什么选择 CodeEdu？
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                我们致力于打造最优质的在线编程教育体验，让教学和学习变得更加轻松高效。
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">安全可靠</h4>
                    <p className="text-muted-foreground">
                      企业级数据安全保护，所有数据加密传输和存储
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">随时随地</h4>
                    <p className="text-muted-foreground">
                      基于 Web 的平台，无需安装，浏览器即可访问
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">实时高效</h4>
                    <p className="text-muted-foreground">
                      毫秒级实时同步，流畅的协作体验
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 p-8 flex items-center justify-center">
                <div className="w-full h-full bg-card rounded-lg border border-border shadow-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Code2 className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">编辑器预览</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            准备好开始了吗？
          </h2>
          <p className="text-lg opacity-90 mb-8">
            立即注册，免费体验 CodeEdu 的全部功能
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              免费注册
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">CodeEdu</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 CodeEdu. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
