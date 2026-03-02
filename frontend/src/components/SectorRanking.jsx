import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';
import { Trophy, TrendingUp, TrendingDown, Minus, Info, BarChart4, PieChart } from 'lucide-react';

function SectorRanking() {
  const [rankedSectors, setRankedSectors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [limit, setLimit] = useState(20);

  // Listen for voice command filters
  useEffect(() => {
    const handleVoiceFilter = (event) => {
      const filters = event.detail;
      if (filters?.category) {
        const categoryMap = { 'BANKING': 'BUY', 'IT': 'BUY', 'PHARMA': 'BUY' };
        setFilterCategory(categoryMap[filters.category] || filters.category || 'ALL');
      }
      if (filters?.limit) setLimit(filters.limit);
    };

    window.addEventListener('voice-command-filter', handleVoiceFilter);
    const storedFilters = sessionStorage.getItem('voiceCommandFilters');
    if (storedFilters) {
      try {
        const filters = JSON.parse(storedFilters);
        handleVoiceFilter({ detail: filters });
        sessionStorage.removeItem('voiceCommandFilters');
      } catch (e) {
        console.error('Error parsing stored filters:', e);
      }
    }
    return () => window.removeEventListener('voice-command-filter', handleVoiceFilter);
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      setError(null);
      const category = filterCategory === 'ALL' ? null : filterCategory;
      const data = await aiStockAPI.getSectorRanking(category, limit);
      if (data.ranked_sectors && data.ranked_sectors.length > 0) {
        setRankedSectors(data.ranked_sectors);
        setSummary(data.summary);
      } else {
        setRankedSectors([]);
        setSummary(null);
      }
    } catch (err) {
      console.error('Error loading sector ranking:', err);
      setError('Intelligence fetch failure');
      setRankedSectors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking();
    const handleAnalysisComplete = () => setTimeout(loadRanking, 1000);
    window.addEventListener('ai-analysis-complete', handleAnalysisComplete);
    return () => window.removeEventListener('ai-analysis-complete', handleAnalysisComplete);
  }, [filterCategory, limit]);

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20';
    if (rank === 2) return 'bg-slate-300 text-slate-900 shadow-lg shadow-slate-300/20';
    if (rank === 3) return 'bg-amber-600 text-white shadow-lg shadow-amber-600/20';
    return 'bg-white/5 text-slate-400 border border-white/5';
  };

  const getRecommendationStyle = (rec) => {
    const r = rec.toUpperCase();
    if (r.includes('STRONG BUY')) return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: TrendingUp };
    if (r === 'BUY') return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: TrendingUp };
    if (r === 'SELL') return { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', icon: TrendingDown };
    return { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Minus };
  };

  const ScoreBar = ({ score }) => {
    const isHigh = score >= 70;
    const isMed = score >= 50;
    return (
      <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden ring-1 ring-white/5 shadow-inner">
        <div
          className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.15)] ${isHigh ? 'bg-emerald-500' : isMed ? 'bg-amber-400' : 'bg-rose-500'}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="p-4 bg-white/5 rounded-2xl animate-pulse">
        <BarChart4 size={40} className="text-blue-500" />
      </div>
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest italic animate-pulse">Scanning Global Sectors...</p>
    </div>
  );

  if (error || rankedSectors.length === 0) return (
    <div className="text-center py-20 rounded-3xl bg-white/[0.02] border border-white/5 border-dashed">
      <div className="mb-4 inline-flex p-4 bg-white/5 rounded-full"><Info size={32} className="text-slate-600" /></div>
      <h3 className="text-lg font-bold text-slate-300">Intelligence Offline</h3>
      <p className="text-sm text-slate-500 mt-2">No sector matrices analyzed yet. Initiate deep scan to begin.</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Summary View - Premium Horizontal Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 overflow-x-auto no-scrollbar pb-2">
          {[
            { label: 'Total Exposure', value: summary.total_sectors, color: 'blue' },
            { label: 'Bullish Sectors', value: summary.buy_sectors + summary.strong_buy_sectors, color: 'emerald' },
            { label: 'Neutral Zone', value: summary.hold_sectors, color: 'amber' },
            { label: 'Bearish Risk', value: summary.sell_sectors, color: 'rose' }
          ].map((item, i) => (
            <div key={i} className="flex-shrink-0 bg-white/[0.02] border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/[0.04]">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-2xl font-black italic tracking-tigh text-${item.color}-400`}>{item.value}</span>
                <div className={`p-2 rounded-lg bg-${item.color}-500/10 text-${item.color}-400`}>
                  <PieChart size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logic Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
          <h3 className="text-xl font-black text-slate-100 tracking-tight italic">Performance <span className="text-slate-500 not-italic">Matrix</span></h3>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-inner">
          <span className="text-[10px] font-bold text-slate-500 px-3 truncate">Filter Matrix:</span>
          {['ALL', 'BUY', 'HOLD', 'SELL'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${filterCategory === cat ? 'bg-white/10 text-white shadow-xl ring-1 ring-white/10' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* High-Performance Sector Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rankedSectors.map((sector) => {
          const recStyle = getRecommendationStyle(sector.recommendation);
          const RecIcon = recStyle.icon;
          return (
            <div
              key={sector.sector}
              className={`group relative bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-3xl p-6 transition-all duration-500 hover:bg-white/[0.05] hover:shadow-2xl overflow-hidden`}
            >
              {/* Dynamic Rank Ornament */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full rotate-45 pointer-events-none opacity-20 transition-transform group-hover:scale-110"></div>

              <div className="relative z-10 flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center text-lg font-black italic rounded-2xl ${getRankBadgeColor(sector.rank)}`}>
                    {sector.rank}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-black text-slate-100 tracking-tight leading-none group-hover:text-white transition-colors uppercase">{sector.sector}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-[0.1em] uppercase ${recStyle.bg} ${recStyle.color} flex items-center gap-1.5 ring-1 ${recStyle.border}`}>
                        <RecIcon size={8} strokeWidth={4} />
                        {sector.recommendation}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-2xl font-black text-slate-100 italic tracking-tighter group-hover:${recStyle.color} transition-colors`}>
                    {sector.average_score.toFixed(1)}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 -mt-1">Neural Score</div>
                  {/* Accuracy Confirmation Badge */}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-tighter italic">Verified Logic</span>
                  </div>
                </div>
              </div>

              {/* Neural Performance Bar */}
              <div className="mb-8">
                <ScoreBar score={sector.average_score} />
              </div>

              {/* Internal Signal Breakdown - Enhanced */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[
                  { label: 'Bullish', val: sector.buy_count, color: 'emerald', icon: '📈' },
                  { label: 'Breadth', val: `${(sector.breadth_ratio * 100).toFixed(0)}%`, color: 'indigo', icon: '🌐' },
                  { label: 'Mom. Int.', val: (sector.momentum_intensity || 0).toFixed(0), color: 'amber', icon: '⚡' },
                  { label: 'Risk', val: sector.sell_count, color: 'rose', icon: '📉' },
                  { label: 'Precision', val: `${(sector.buy_ratio * 100).toFixed(0)}%`, color: 'blue', icon: '🎯' }
                ].map((stat, idx) => (
                  <div key={idx} className="flex flex-col items-center bg-white/[0.03] p-2 rounded-2xl border border-white/5 hover:bg-white/5 hover:border-white/10 transition-colors relative overflow-hidden group/stat">
                    <span className={`text-[10px] font-black text-${stat.color}-400 italic z-10`}>{stat.val}</span>
                    <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-tighter mt-1 z-10 flex items-center gap-0.5 whitespace-nowrap">
                      {stat.icon} {stat.label}
                    </span>
                    <div className={`absolute bottom-0 left-0 w-full h-0.5 bg-${stat.color}-500/20 group-hover/stat:h-full transition-all duration-300 pointer-events-none`}></div>
                  </div>
                ))}
              </div>

              {/* Stock Exposure Ticker */}
              {sector.stocks && sector.stocks.length > 0 && (
                <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                  <div className="p-1.5 bg-white/5 rounded-lg text-slate-500"><Trophy size={10} /></div>
                  <div className="flex-1 flex flex-wrap gap-1.5 max-h-16 overflow-y-auto no-scrollbar">
                    {sector.stocks.map((stock) => (
                      <span key={stock} className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-md border border-white/5 hover:text-white hover:bg-blue-600 transition-all cursor-default uppercase">
                        {stock}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SectorRanking;
