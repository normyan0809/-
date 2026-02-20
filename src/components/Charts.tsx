import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { SimulationResult } from '@/utils/physics';
import { translations, Language } from '@/utils/i18n';

interface ChartsProps {
  result: SimulationResult | null;
  lang: Language;
  theme: 'light' | 'dark';
}

export function Charts({ result, lang, theme }: ChartsProps) {
  if (!result) return null;
  const t = translations[lang];

  // Generate data points for charts
  const data = [];
  const steps = 100;
  const dt = result.totalTime / steps;

  for (let i = 0; i <= steps; i++) {
    const time = i * dt;
    // Find segment
    const segment = result.segments.find(s => time >= s.startTime && time <= s.endTime) 
      || result.segments[result.segments.length - 1];
    
    if (segment) {
      const segDt = time - segment.startTime;
      const effectiveDt = Math.min(segDt, segment.endTime - segment.startTime);
      
      const v = segment.startV + segment.acceleration * effectiveDt;
      const x = segment.startX + segment.startV * effectiveDt + 0.5 * segment.acceleration * effectiveDt * effectiveDt;
      
      data.push({
        time: time.toFixed(2),
        velocity: v,
        position: x,
        acceleration: segment.acceleration
      });
    }
  }

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipText = isDark ? '#f1f5f9' : '#0f172a';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* V-t Graph */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">{t.vtGraph}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="time" 
                label={{ value: `${t.time} (${t.unit_s})`, position: 'insideBottomRight', offset: -5, fill: textColor }} 
                tick={{ fontSize: 12, fill: textColor }}
                stroke={textColor}
              />
              <YAxis 
                label={{ value: `${t.velocity} (${t.unit_ms})`, angle: -90, position: 'insideLeft', fill: textColor }} 
                tick={{ fontSize: 12, fill: textColor }}
                stroke={textColor}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: tooltipBg,
                  color: tooltipText
                }}
                labelStyle={{ color: textColor }}
              />
              <ReferenceLine y={0} stroke={textColor} />
              <Line 
                type="monotone" 
                dataKey="velocity" 
                stroke="#4f46e5" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 6 }}
                name={t.velocity}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* X-t Graph */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">{t.xtGraph}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="time" 
                label={{ value: `${t.time} (${t.unit_s})`, position: 'insideBottomRight', offset: -5, fill: textColor }} 
                tick={{ fontSize: 12, fill: textColor }}
                stroke={textColor}
              />
              <YAxis 
                label={{ value: `${t.position} (${t.unit_m})`, angle: -90, position: 'insideLeft', fill: textColor }} 
                tick={{ fontSize: 12, fill: textColor }}
                stroke={textColor}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: tooltipBg,
                  color: tooltipText
                }}
                labelStyle={{ color: textColor }}
              />
              <ReferenceLine y={0} stroke={textColor} />
              <Line 
                type="monotone" 
                dataKey="position" 
                stroke="#059669" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 6 }}
                name={t.position}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
