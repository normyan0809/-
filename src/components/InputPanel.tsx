import React from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { translations, Language } from '@/utils/i18n';

interface InputPanelProps {
  values: {
    v0: number;
    vBelt: number;
    mu: number;
    length: number;
    theta: number;
    g: number;
    mass: number;
  };
  onChange: (key: string, value: number) => void;
  onSimulate: () => void;
  isSimulating: boolean;
  lang: Language;
}

export function InputPanel({ values, onChange, onSimulate, isSimulating, lang }: InputPanelProps) {
  const t = translations[lang];
  
  const inputs = [
    { key: 'v0', label: t.initialVelocity, unit: 'm/s', min: -20, max: 20, step: 0.1 },
    { key: 'vBelt', label: t.beltVelocity, unit: 'm/s', min: -20, max: 20, step: 0.1 },
    { key: 'mu', label: t.frictionCoeff, unit: '', min: 0.01, max: 1.0, step: 0.01 },
    { key: 'length', label: t.length, unit: 'm', min: 1, max: 100, step: 0.5 },
    { key: 'theta', label: t.angle, unit: '°', min: -89, max: 89, step: 1 },
    { key: 'mass', label: t.mass, unit: 'kg', min: 0.1, max: 100, step: 0.1 },
    { key: 'g', label: t.gravity, unit: 'm/s²', min: 1, max: 30, step: 0.1 },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6 transition-colors">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t.parameters}</h2>
      
      <div className="space-y-4">
        {inputs.map((input) => (
          <div key={input.key} className="space-y-1">
            <div className="flex justify-between text-sm items-center">
              <label htmlFor={input.key} className="font-medium text-slate-700 dark:text-slate-300">
                {input.label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={values[input.key as keyof typeof values]}
                  onChange={(e) => onChange(input.key, parseFloat(e.target.value))}
                  className="w-20 text-right px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  step={input.step}
                />
                <span className="text-slate-500 dark:text-slate-400 font-mono w-8 text-xs">
                  {input.unit}
                </span>
              </div>
            </div>
            <input
              type="range"
              id={input.key}
              min={input.min}
              max={input.max}
              step={input.step}
              value={values[input.key as keyof typeof values]}
              onChange={(e) => onChange(input.key, parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>{input.min}</span>
              <span>{input.max}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <button
          onClick={onSimulate}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all",
            isSimulating 
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg dark:bg-indigo-500 dark:hover:bg-indigo-600"
          )}
        >
          {isSimulating ? (
            <>
              <RotateCcw className="w-4 h-4" />
              {t.reset}
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              {t.simulate}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
