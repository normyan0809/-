import React, { useEffect, useRef } from 'react';
import { SimulationResult } from '@/utils/physics';

interface SimulationCanvasProps {
  result: SimulationResult | null;
  currentTime: number;
  length: number;
  theta: number;
  theme: 'light' | 'dark';
}

export function SimulationCanvas({ result, currentTime, length, theta, theme }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#1e293b' : '#f8fafc'; // slate-800 : slate-50
    const beltColor = isDark ? '#475569' : '#e2e8f0'; // slate-600 : slate-200
    const beltStroke = isDark ? '#64748b' : '#94a3b8'; // slate-500 : slate-400
    const blockColor = '#4f46e5'; // Indigo 600 (same for both for visibility)

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scaling
    const padding = 50;
    const availableWidth = canvas.width - padding * 2;
    const scale = availableWidth / length;
    
    const centerY = canvas.height / 2;

    ctx.save();
    ctx.translate(padding, centerY);
    ctx.rotate(-theta * Math.PI / 180);

    // Draw Belt
    ctx.fillStyle = beltColor;
    ctx.fillRect(0, 0, length * scale, 10);
    
    ctx.strokeStyle = beltStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length * scale, 0);
    ctx.stroke();

    // Draw Block
    let blockX = 0;
    
    if (result) {
      const segment = result.segments.find(s => currentTime >= s.startTime && currentTime <= s.endTime) 
        || (currentTime > result.totalTime ? result.segments[result.segments.length - 1] : result.segments[0]);
      
      if (segment) {
        const dt = Math.min(currentTime, segment.endTime) - segment.startTime;
        const effectiveDt = Math.max(0, dt);
        blockX = segment.startX + segment.startV * effectiveDt + 0.5 * segment.acceleration * effectiveDt * effectiveDt;
      } else {
        blockX = 0;
      }
    }

    const blockWidth = 40;
    const blockHeight = 20;
    const drawX = blockX * scale;

    ctx.fillStyle = blockColor;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    ctx.fillRect(drawX - blockWidth/2, -blockHeight, blockWidth, blockHeight);
    
    ctx.restore();

  }, [result, currentTime, length, theta, theme]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative transition-colors">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={300} 
        className="w-full h-full object-contain"
      />
      <div className="absolute top-4 left-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        t = {currentTime.toFixed(2)}s
      </div>
    </div>
  );
}
