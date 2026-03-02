import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, ShieldCheck, Zap, Globe, Gauge } from 'lucide-react';

const MarketIndex = ({ marketData, loading }) => {
  if (loading) {
    return (
      <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight italic">Market <span className="text-blue-400">Pulse</span></h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse h-32 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const indicesToDisplay = [
    { key: 'NIFTY', label: 'NIFTY 50', icon: '📈', desc: 'Large Cap' },
    { key: 'BANKNIFTY', label: 'BANK NIFTY', icon: '🏦', desc: 'Banking' },
  ];

  // Calculate overall market sentiment
  const calculateSentiment = () => {
    let positive = 0;
    let total = 0;
    indicesToDisplay.forEach(idx => {
      const data = marketData?.[idx.key];
      if (data && !data.error) {
        total++;
        if (data.change > 0 || data.trend === 'UP') positive++;
      }
    });
    if (total === 0) return 50;
    return (positive / total) * 100;
  };

  const sentimentScore = calculateSentiment();
  const sentimentLabel = sentimentScore > 70 ? 'Extremely Bullish' : sentimentScore > 50 ? 'Bullish' : sentimentScore > 30 ? 'Neutral' : 'Bearish';
  const sentimentColor = sentimentScore > 60 ? 'text-emerald-400' : sentimentScore > 40 ? 'text-amber-400' : 'text-rose-400';

  const IndexCard = ({ label, data, icon, desc }) => {
    const isAvailable = data && !data.error;

    if (!isAvailable) {
      return (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-center h-full opacity-30 grayscale blur-[0.5px]">
          <div className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-2">{label}</div>
          <div className="text-sm font-bold text-slate-600 italic">Syncing Matrix...</div>
        </div>
      );
    }

    const { price, change, pChange, high, low, trend } = data;
    const isPositive = change !== undefined ? change > 0 : trend === 'UP';
    const isNegative = change !== undefined ? change < 0 : trend === 'DOWN';

    const colorClass = isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400';
    const glowClass = isPositive ? 'shadow-[0_0_20px_rgba(52,211,153,0.15)]' : isNegative ? 'shadow-[0_0_20px_rgba(251,113,133,0.15)]' : '';
    const bgGradient = isPositive
      ? 'from-emerald-500/10 via-transparent to-transparent'
      : isNegative
        ? 'from-rose-500/10 via-transparent to-transparent'
        : 'from-slate-500/10 via-transparent to-transparent';

    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

    return (
      <div className={`group relative bg-[#1e293b]/40 border border-white/5 hover:border-white/20 rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 ${glowClass} overflow-hidden backdrop-blur-sm h-full`}>
        {/* Animated Background Gradient */}
        <div className={`absolute -inset-1 bg-gradient-to-br ${bgGradient} opacity-20 group-hover:opacity-40 transition-opacity duration-700`}></div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-slate-500 font-black text-[9px] uppercase tracking-[0.15em]">{label}</span>
              <span className="text-[8px] font-bold text-blue-400/60 uppercase">{desc}</span>
            </div>
            <div className={`p-2 rounded-xl bg-white/5 ${colorClass} border border-white/10 shadow-sm backdrop-blur-md`}>
              <Icon size={12} strokeWidth={4} />
            </div>
          </div>

          {/* Price & Change Row */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-100 tracking-tighter tabular-nums group-hover:text-blue-400 transition-colors">
                {price ? price.toLocaleString('en-IN') : 'N/A'}
              </span>
              {change !== undefined && (
                <span className={`text-[10px] font-black ${colorClass} tabular-nums`}>
                  {isPositive ? '+' : ''}{pChange.toFixed(2)}%
                </span>
              )}
            </div>
            {change !== undefined && (
              <div className={`text-[9px] font-bold text-slate-500 tabular-nums mt-0.5`}>
                {isPositive ? '▲' : isNegative ? '▼' : '▬'} {Math.abs(change).toFixed(1)} points
              </div>
            )}
          </div>

          {/* Session Details */}
          <div className="mt-auto pt-4 border-t border-white/5 space-y-2.5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                  D. High
                </span>
                <span className="text-[11px] text-emerald-400 font-black tabular-nums">₹{high ? high.toLocaleString('en-IN') : '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50"></div>
                  D. Low
                </span>
                <span className="text-[11px] text-rose-400 font-black tabular-nums">₹{low ? low.toLocaleString('en-IN') : '--'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-7 shadow-[0_40px_80px_rgba(0,0,0,0.6)] mb-8 relative overflow-hidden">
      {/* Background Visuals */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full -mr-40 -mt-40"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/5 blur-[120px] rounded-full -ml-40 -mb-40"></div>

      <div className="relative z-10 flex flex-col gap-8 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-1.5 h-12 bg-gradient-to-b from-blue-500 via-indigo-600 to-purple-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
            <div>
              <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter italic">
                Market <span className="text-blue-500">Pulse</span>
                <Activity size={24} className="text-blue-500 animate-pulse" />
              </h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1.5">Integrated Precision Core</p>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-3">
            {marketData?.timestamp && (
              <>
                <div className="flex flex-col bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl min-w-[80px]">
                  <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Mood</span>
                  <span className={`text-xs font-black italic ${sentimentColor}`}>{sentimentLabel}</span>
                </div>
                <div className="flex flex-col bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl min-w-[80px]">
                  <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Breadth</span>
                  <span className="text-xs font-black text-slate-100 italic">{sentimentScore.toFixed(0)}% Bull</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col items-end bg-slate-900/40 backdrop-blur-lg border border-white/10 px-4 py-2 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-100 tracking-widest uppercase">Live Link</span>
            </div>
            <span className="text-[9px] text-slate-500 font-bold mt-0.5 tabular-nums">
              {marketData?.timestamp ? new Date(marketData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Standby'}
            </span>
          </div>
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-lg shadow-blue-500/5">
            <Zap size={16} className="text-blue-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {indicesToDisplay.map(idx => (
          <IndexCard
            key={idx.key}
            label={idx.label}
            icon={idx.icon}
            desc={idx.desc}
            data={marketData?.[idx.key]}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500/50" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verified Data</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-blue-500/50" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">NSE GLOBAL ORIGIN</span>
          </div>
        </div>
        <div className="flex items-center gap-2 group cursor-help">
          <div className="relative">
            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-1000 ${sentimentScore > 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${sentimentScore}%` }}></div>
            </div>
          </div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Market Sentiment</span>
        </div>
      </div>
    </div>
  );
};

export default MarketIndex;
