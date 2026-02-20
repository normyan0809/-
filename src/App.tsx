/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { InputPanel } from '@/components/InputPanel';
import { Charts } from '@/components/Charts';
import { SimulationCanvas } from '@/components/SimulationCanvas';
import { calculateMotion, SimulationResult, SimulationParams } from '@/utils/physics';
import { Play, Pause, RotateCcw, Info, Moon, Sun, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { translations, Language } from '@/utils/i18n';

export default function App() {
  const [params, setParams] = useState<SimulationParams>({
    v0: 0,
    vBelt: 2,
    mu: 0.2,
    length: 10,
    theta: 0,
    g: 9.8,
    mass: 1.0,
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lang, setLang] = useState<Language>('zh'); // Default to Chinese as requested
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const t = translations[lang];

  // Apply theme class to body
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleParamChange = (key: string, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setIsSimulating(false);
    setCurrentTime(0);
  };

  useEffect(() => {
    const res = calculateMotion(params);
    setResult(res);
  }, [params]);

  const toggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    } else {
      setIsSimulating(true);
      if (result && currentTime >= result.totalTime) {
        setCurrentTime(0);
      }
    }
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setCurrentTime(0);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  useEffect(() => {
    let lastTime = performance.now();
    
    const loop = (time: number) => {
      if (!isSimulating) return;
      
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      setCurrentTime(prev => {
        if (!result) return prev;
        const next = prev + dt;
        if (next >= result.totalTime) {
          setIsSimulating(false);
          return result.totalTime;
        }
        return next;
      });

      requestRef.current = requestAnimationFrame(loop);
    };

    if (isSimulating) {
      lastTime = performance.now();
      requestRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isSimulating, result]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Switch Language"
          >
            <Languages className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <button 
            onClick={() => setTheme(th => th === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            ) : (
              <Sun className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            )}
          </button>
          <a 
            href="https://github.com/google/generative-ai-android-sample" 
            target="_blank" 
            rel="noreferrer"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <Info className="w-6 h-6" />
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-3 space-y-6">
          <InputPanel 
            values={params} 
            onChange={handleParamChange} 
            onSimulate={toggleSimulation}
            isSimulating={isSimulating}
            lang={lang}
          />
          
          {/* Simulation Stats */}
          {result && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                {t.results}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{t.totalTime}</span>
                  <span className="font-mono font-medium">{result.totalTime.toFixed(2)} {t.unit_s}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{t.exitVelocity}</span>
                  <span className="font-mono font-medium">{result.exitVelocity.toFixed(2)} {t.unit_ms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{t.exitPosition}</span>
                  <span className="font-mono font-medium">{result.exitPosition.toFixed(2)} {t.unit_m}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{t.relativeDistance}</span>
                  <span className="font-mono font-medium">{result.relativeDistance.toFixed(2)} {t.unit_m}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{t.workFriction}</span>
                  <span className="font-mono font-medium">{result.workFriction.toFixed(2)} {t.unit_j}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{t.heatGenerated}</span>
                  <span className="font-mono font-medium text-red-600 dark:text-red-400">{result.heatGenerated.toFixed(2)} {t.unit_j}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">{t.status}</span>
                  <span className={cn(
                    "font-medium px-2 py-0.5 rounded text-xs",
                    result.status.includes('exited') 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  )}>
                    {t[result.status]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Visualization & Charts */}
        <div className="lg:col-span-9 space-y-6">
          {/* Canvas */}
          <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
             <SimulationCanvas 
               result={result} 
               currentTime={currentTime} 
               length={params.length} 
               theta={params.theta}
               theme={theme}
             />
             <div className="p-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 mt-1">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={toggleSimulation}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    {isSimulating ? <Pause className="w-5 h-5 text-slate-700 dark:text-slate-300" /> : <Play className="w-5 h-5 text-slate-700 dark:text-slate-300" />}
                  </button>
                  <button 
                    onClick={resetSimulation}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <RotateCcw className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  </button>
                  <div className="text-sm font-mono text-slate-500 dark:text-slate-400">
                    {currentTime.toFixed(2)}{t.unit_s} / {result?.totalTime.toFixed(2)}{t.unit_s}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-100 ease-linear"
                    style={{ width: `${result ? (currentTime / result.totalTime) * 100 : 0}%` }}
                  />
                </div>
             </div>
          </div>

          {/* Charts */}
          <Charts result={result} lang={lang} theme={theme} />
          
          {/* Analysis / Steps */}
          {result && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">{t.motionAnalysis}</h3>
              <div className="space-y-4">
                {result.segments.map((seg, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-full text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {lang === 'zh' ? seg.descriptionZh : seg.description}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        From <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-1 rounded">t={seg.startTime.toFixed(2)}{t.unit_s}</span> to <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-1 rounded">t={seg.endTime.toFixed(2)}{t.unit_s}</span>
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <div>{t.acceleration}: <span className="font-mono text-slate-700 dark:text-slate-300">{seg.acceleration.toFixed(2)} {t.unit_ms2}</span></div>
                        <div>{t.distance}: <span className="font-mono text-slate-700 dark:text-slate-300">{(seg.endX - seg.startX).toFixed(2)} {t.unit_m}</span></div>
                        <div>{t.startVelocity}: <span className="font-mono text-slate-700 dark:text-slate-300">{seg.startV.toFixed(2)} {t.unit_ms}</span></div>
                        <div>{t.endVelocity}: <span className="font-mono text-slate-700 dark:text-slate-300">{seg.endV.toFixed(2)} {t.unit_ms}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
