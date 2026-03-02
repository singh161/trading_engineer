import React from 'react';
import { Timer, Briefcase, BarChart4 } from 'lucide-react';

const ModeSelector = ({ mode, onModeChange }) => {
  const modes = [
    { value: 'intraday', label: 'Intraday', description: '5m charts', icon: Timer },
    { value: 'swing', label: 'Swing', description: 'Daily (2-10d)', icon: BarChart4 },
    { value: 'longterm', label: 'Long Term', description: 'Weekly (6mo+)', icon: Briefcase },
  ];

  return (
    <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analysis Horizon</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.value;
          return (
            <button
              key={m.value}
              onClick={() => onModeChange(m.value)}
              className={`relative group p-3 rounded-xl border transition-all duration-300 ${isActive
                  ? 'bg-blue-600/10 border-blue-500/50 text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:border-white/10'
                }`}
            >
              {isActive && (
                <div className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-500 group-hover:text-slate-300 animate-pulse-slow'}`}>
                  <Icon size={16} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className={`text-sm font-black tracking-tight ${isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                    {m.label}
                  </span>
                  <span className="text-[10px] opacity-60 font-medium truncate w-full">{m.description}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;
