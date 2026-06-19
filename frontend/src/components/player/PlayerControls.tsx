'use client';

import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDuration } from '@/lib/utils';
import { usePlayerStore } from '@/store/player';

interface HeatmapData {
  startTime: number;
  intensity: number;
}

interface PlayerControlsProps {
  heatmapData?: HeatmapData[];
}

export default function PlayerControls({ heatmapData = [] }: PlayerControlsProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    play,
    pause,
    seek,
    setPlaybackSpeed,
  } = usePlayerStore();

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const handleSkipBack = () => {
    seek(Math.max(0, currentTime - 10000)); // 后退 10 秒
  };

  const handleSkipForward = () => {
    seek(Math.min(duration, currentTime + 10000)); // 前进 10 秒
  };

  const handleReset = () => {
    seek(0);
    pause();
  };

  const handleSpeedChange = (value: string) => {
    setPlaybackSpeed(parseFloat(value));
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 生成热力图背景渐变
  const getHeatmapGradient = () => {
    if (heatmapData.length === 0) return 'transparent';

    const stops = heatmapData.map((data) => {
      const position = (data.startTime / duration) * 100;
      const color = getHeatmapColor(data.intensity);
      return `${color} ${position}%`;
    });

    return `linear-gradient(to right, ${stops.join(', ')})`;
  };

  const getHeatmapColor = (intensity: number): string => {
    // 从蓝色（低）到红色（高）的渐变
    if (intensity < 0.25) {
      return 'rgba(59, 130, 246, 0.3)'; // 蓝色
    } else if (intensity < 0.5) {
      return 'rgba(34, 197, 94, 0.4)'; // 绿色
    } else if (intensity < 0.75) {
      return 'rgba(234, 179, 8, 0.5)'; // 黄色
    } else {
      return 'rgba(239, 68, 68, 0.6)'; // 红色
    }
  };

  return (
    <div className="w-full space-y-4 p-4 bg-card rounded-lg border border-border">
      {/* 热力图层 */}
      {heatmapData.length > 0 && (
        <div className="relative h-8 rounded-md overflow-hidden">
          <div
            className="absolute inset-0 rounded-md"
            style={{ background: getHeatmapGradient() }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            输入频率热力图
          </div>
        </div>
      )}

      {/* 进度条 */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={100}
          onValueChange={handleSeek}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>重置</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleSkipBack}>
                  <SkipBack className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>后退 10 秒</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="default"
            size="icon"
            className="w-12 h-12 rounded-full"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleSkipForward}>
                  <SkipForward className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>前进 10 秒</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* 播放速度 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">速度</span>
          <Select
            value={playbackSpeed.toString()}
            onValueChange={handleSpeedChange}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="0.75">0.75x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
              <SelectItem value="4">4x</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
