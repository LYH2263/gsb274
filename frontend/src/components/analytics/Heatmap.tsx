'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDuration } from '@/lib/utils';

interface TimeSlot {
  startTime: number;
  endTime: number;
  eventCount: number;
  totalChars: number;
  intensity: number;
}

interface HeatmapProps {
  data: TimeSlot[];
  title?: string;
}

export default function Heatmap({ data, title = '输入频率热力图' }: HeatmapProps) {
  const chartData = useMemo(() => {
    return data.map((slot) => ({
      time: slot.startTime,
      timeLabel: formatDuration(slot.startTime),
      frequency: slot.eventCount,
      chars: slot.totalChars,
      intensity: slot.intensity,
    }));
  }, [data]);

  const getIntensityColor = (intensity: number): string => {
    if (intensity < 0.25) return '#3b82f6'; // 蓝色
    if (intensity < 0.5) return '#22c55e'; // 绿色
    if (intensity < 0.75) return '#eab308'; // 黄色
    return '#ef4444'; // 红色
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <>
            {/* 热力条 */}
            <div className="mb-6">
              <div className="flex h-8 rounded-md overflow-hidden">
                {data.map((slot, index) => (
                  <div
                    key={index}
                    className="flex-1 transition-colors cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: getIntensityColor(slot.intensity) }}
                    title={`时间: ${formatDuration(slot.startTime)}\n事件数: ${slot.eventCount}\n字符数: ${slot.totalChars}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{formatDuration(data[0]?.startTime || 0)}</span>
                <span>{formatDuration(data[data.length - 1]?.endTime || 0)}</span>
              </div>
            </div>

            {/* 图例 */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span className="text-sm text-muted-foreground">低活跃</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span className="text-sm text-muted-foreground">中等</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span className="text-sm text-muted-foreground">较高</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span className="text-sm text-muted-foreground">高活跃</span>
              </div>
            </div>

            {/* 面积图 */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFrequency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    label={{
                      value: '事件数',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="text-sm font-medium">{data.timeLabel}</p>
                            <p className="text-sm text-muted-foreground">
                              事件数: {data.frequency}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              字符数: {data.chars}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="frequency"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorFrequency)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            暂无数据
          </div>
        )}
      </CardContent>
    </Card>
  );
}
