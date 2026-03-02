import React from 'react';
import { CheckCircle2, ShieldAlert, Ban, Info, Star } from 'lucide-react';

const Filters = ({ filter, onFilterChange }) => {
  const filters = [
    { value: 'all', label: 'All', icon: Star, color: 'blue' },
    { value: 'STRONG BUY', label: 'Strong Buy', icon: CheckCircle2, color: 'emerald' },
    { value: 'BUY', label: 'Buy', icon: CheckCircle2, color: 'emerald' },
    { value: 'STRONG SELL', label: 'Strong Sell', icon: ShieldAlert, color: 'rose' },
    { value: 'SELL', label: 'Sell', icon: ShieldAlert, color: 'rose' },
    { value: 'NEUTRAL', label: 'Neutral', icon: Info, color: 'amber' },
  ];

  return (
    <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Signal Intelligence</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const Icon = f.icon;
          const isActive = filter === f.value;

          let activeStyles = "";
          if (f.color === 'emerald') activeStyles = "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
          else if (f.color === 'rose') activeStyles = "bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]";
          else if (f.color === 'amber') activeStyles = "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]";
          else activeStyles = "bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]";

          return (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all duration-300 ${isActive
                  ? activeStyles
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:border-white/10'
                }`}
            >
              <Icon size={12} strokeWidth={isActive ? 3 : 2} />
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Filters;
