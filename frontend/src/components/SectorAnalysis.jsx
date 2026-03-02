import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';
import { Trophy, TrendingUp, TrendingDown, Minus, Info, BarChart4, PieChart, Activity, Zap } from 'lucide-react';

function SectorAnalysis() {
  const [sectorData, setSectorData] = useState({});
  const [topSector, setTopSector] = useState(null);
  const [worstSector, setWorstSector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSectorData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiStockAPI.getSectorAnalysis();
      if (data.sector_data && Object.keys(data.sector_data).length > 0) {
        setSectorData(data.sector_data);
        setTopSector(data.top_sector);
        setWorstSector(data.worst_sector);
      } else {
        setSectorData({});
        setTopSector(null);
        setWorstSector(null);
      }
    } catch (err) {
      console.error('Error loading sector analysis:', err);
      setError('Failed to load sector analysis data');
      setSectorData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSectorData();
    const handleAnalysisComplete = () => setTimeout(loadSectorData, 1000);
    window.addEventListener('ai-analysis-complete', handleAnalysisComplete);
    return () => window.removeEventListener('ai-analysis-complete', handleAnalysisComplete);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getRecommendation = (sector) => {
    const data = sectorData[sector];
    if (!data) return 'NEUTRAL';
    const avgScore = data.average_score;
    const buyRatio = data.buy_ratio;
    if (avgScore >= 70 && buyRatio >= 0.6) return 'STRONG BUY';
    if (avgScore >= 60 && buyRatio >= 0.4) return 'BUY';
    if (avgScore < 40 || buyRatio < 0.2) return 'SELL';
    return 'HOLD';
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="p-4 bg-white/5 rounded-2xl animate-spin">
        <Activity size={40} className="text-blue-500" />
      </div>
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest italic animate-pulse">Analyzing Sector Matrices...</p>
    </div>
  );

  if (error || Object.keys(sectorData).length === 0) return (
    <div className="text-center py-20 rounded-3xl bg-white/[0.02] border border-white/5 border-dashed">
      <div className="mb-4 inline-flex p-4 bg-white/5 rounded-full"><Info size={32} className="text-slate-600" /></div>
      <h3 className="text-lg font-bold text-slate-300">Sector IQ Offline</h3>
      <p className="text-sm text-slate-500 mt-2">No sector data currently mapped. Run complete scan to initiate.</p>
    </div>
  );

  const sortedSectors = Object.entries(sectorData).sort((a, b) => b[1].average_score - a[1].average_score);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Visual Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topSector && sectorData[topSector] && (
          <div className="relative group bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6 overflow-hidden shadow-[0_20px_40px_rgba(52,211,153,0.1)] transition-all hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Trophy size={80} /></div>
            <div className="relative z-10">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Top Alpha Sector</span>
              <h3 className="text-2xl font-black text-white mt-1 italic tracking-tight uppercase">{topSector}</h3>
              <div className="flex items-center gap-6 mt-6">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-emerald-400 italic">#{sectorData[topSector].average_score.toFixed(1)}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Neural Score</span>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white italic">{sectorData[topSector].stock_count}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Stocks</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {worstSector && sectorData[worstSector] && (
          <div className="relative group bg-rose-500/10 border border-rose-500/20 rounded-[2rem] p-6 overflow-hidden shadow-[0_20px_40px_rgba(251,113,133,0.1)] transition-all hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Zap size={80} /></div>
            <div className="relative z-10">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Underperforming Zone</span>
              <h3 className="text-2xl font-black text-white mt-1 italic tracking-tight uppercase">{worstSector}</h3>
              <div className="flex items-center gap-6 mt-6">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-rose-400 italic">#{sectorData[worstSector].average_score.toFixed(1)}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Neural Score</span>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white italic">{sectorData[worstSector].stock_count}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Stocks</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedSectors.map(([sector, data]) => {
          const recommendation = getRecommendation(sector);
          const scoreColor = getScoreColor(data.average_score);

          return (
            <div key={sector} className="group relative bg-[#1e293b]/40 border border-white/5 hover:border-white/10 rounded-3xl p-5 transition-all duration-500 hover:bg-white/[0.04] backdrop-blur-sm overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="flex flex-col min-w-0">
                  <h4 className="text-lg font-black text-slate-100 uppercase tracking-tight truncate group-hover:text-white">{sector}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/5 ${getScoreColor(data.average_score)}`}>
                      {recommendation}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{data.stock_count} Assets</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xl font-black italic tracking-tighter ${scoreColor}`}>{data.average_score.toFixed(1)}</div>
                  <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Matrix IQ</div>
                </div>
              </div>

              {/* Score Progress */}
              <div className="w-full h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r from-transparent to-${scoreColor.replace('text-', '')} transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                  style={{ width: `${data.average_score}%`, backgroundColor: data.average_score >= 70 ? '#10b981' : data.average_score >= 40 ? '#fbbf24' : '#ef4444' }}
                ></div>
              </div>

              {/* Micro Stats */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { l: 'Buy', v: data.buy_count, c: 'emerald' },
                  { l: 'Hold', v: data.hold_count, c: 'amber' },
                  { l: 'Ratio', v: `${(data.buy_ratio * 100).toFixed(0)}%`, c: 'blue' }
                ].map(s => (
                  <div key={s.l} className="flex flex-col items-center bg-white/[0.02] p-2 rounded-xl border border-white/5">
                    <span className={`text-xs font-black text-${s.c}-400 italic`}>{s.v}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.l}</span>
                  </div>
                ))}
              </div>

              {/* Stock Chips */}
              <div className="flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                {data.stocks?.slice(0, 4).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-md text-[8px] font-bold text-slate-400 group-hover:text-slate-300 transition-colors">
                    {s}
                  </span>
                ))}
                {data.stocks?.length > 4 && (
                  <span className="text-[8px] font-bold text-slate-600 pl-1">+{data.stocks.length - 4} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SectorAnalysis;
