import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';

function SmartRankings({ onStockClick }) {
  const [rankings, setRankings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('buy');

  useEffect(() => {
    loadRankings();

    // Listen for analysis completion event
    const handleAnalysisComplete = () => {
      loadRankings();
    };
    window.addEventListener('ai-analysis-complete', handleAnalysisComplete);

    return () => {
      window.removeEventListener('ai-analysis-complete', handleAnalysisComplete);
    };
  }, []);

  const loadRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiStockAPI.getRecommendations(5);
      setRankings(data);
    } catch (err) {
      console.error('Error loading rankings:', err);
      let errorMessage = 'Failed to load rankings';

      if (err.response?.status === 404) {
        errorMessage = 'AI endpoints not found. Please restart backend server!';
      } else if (err.response?.status === 500) {
        errorMessage = 'Backend error. Check backend logs.';
      } else if (!err.response) {
        errorMessage = 'Cannot connect to backend. Is backend running?';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryStocks = () => {
    if (!rankings) return [];
    const key = `top_${category === 'buy' ? '5_buy' : category === 'hold' ? '5_hold' : '5_sell'}`;
    return rankings[key] || [];
  };

  const getCategoryColor = (cat) => {
    if (cat === 'buy') return 'green-buy';
    if (cat === 'sell') return 'red-sell';
    return 'yellow-neutral';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-accent mx-auto"></div>
        <p className="text-dark-text-secondary mt-2">Loading rankings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-sell mb-2">⚠️ {error}</div>
        <button
          onClick={loadRankings}
          className="px-4 py-2 bg-blue-accent hover:bg-blue-accent/90 text-white rounded-lg"
        >
          Retry
        </button>
        <p className="text-sm text-dark-text-secondary mt-4">
          Run "Complete Analysis" first to generate rankings
        </p>
      </div>
    );
  }

  if (!rankings || (!rankings.top_5_buy?.length && !rankings.top_5_hold?.length && !rankings.top_5_sell?.length)) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-dark-text mb-2">No rankings available</p>
        <p className="text-sm text-dark-text-secondary">
          Click "Run Complete Analysis" to generate AI-powered rankings
        </p>
      </div>
    );
  }

  const stocks = getCategoryStocks();
  const colorClass = getCategoryColor(category);
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-buy';
    if (score >= 40) return 'text-yellow-neutral';
    return 'text-red-sell';
  };

  const getScoreBg = (score) => {
    if (score >= 70) return 'bg-green-buy/10';
    if (score >= 40) return 'bg-yellow-neutral/10';
    return 'bg-red-sell/10';
  };

  const getStrategicInsight = (stock) => {
    const tech = stock.technical_score || 0;
    const sent = stock.sentiment_score || 0;
    const fund = stock.fundamental_score || 0;
    const mom = stock.momentum_score || 0;

    if (stock.recommendation === 'BUY') {
      if (tech > 80 && fund > 70) return '💎 Quality Breakout: Mast chart aur strong business basics, perfect for entry.';
      if (mom > 80) return '🚀 Momentum Surge: Bhaari buying ho rahi hai, trend is very strong right now.';
      if (sent > 80) return '🔥 Sentiment King: Market mein kaafi positive news hai is stock ko lekar.';
      return '✅ Solid Entry: Technical signals sahi baith rahe hain, moderate risk.';
    }

    if (stock.recommendation === 'HOLD') {
      if (fund > 75 && tech < 50) return '🐢 Value Play: Company solid hai, bas sahi price breakout ka wait karein.';
      if (tech > 70 && fund < 50) return '⚡ Speculative Hold: Chart toh accha hai, par fundamentals thode weak hain.';
      if (tech > 40 && tech < 60) return '⚖️ Consolidation: Price ek hi range mein ghoom raha hai, breakout ka wait hai.';
      if (sent < 40) return '⚠️ News Drag: Stock accha hai lekin market sentiment thoda bearish hai.';
      return '⏳ Watching: Abhi hold karein, directional bias clear hone dein.';
    }

    if (stock.recommendation === 'SELL') {
      if (tech < 30) return '📉 Critical Breakdown: Support level toot gaya hai, risk zyada hai yahan.';
      if (sent < 30) return '🚫 Toxic Sentiment: Negative news ka pressure kaafi high hai, avoid karein.';
      return '🔻 Risk Warning: Indicators niche ki taraf ishara kar rahe hain, be careful.';
    }

    return 'Neutral Outlook: Stable zone mein hai.';
  };

  return (
    <div className="space-y-6">
      {/* Category Selector */}
      <div className="flex flex-wrap gap-2 p-1 bg-dark-bg/50 rounded-xl w-fit border border-white/5">
        {['buy', 'hold', 'sell'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all capitalize text-sm flex items-center gap-2 ${category === cat
              ? `bg-${getCategoryColor(cat)} text-white shadow-lg shadow-${getCategoryColor(cat)}/20`
              : 'text-dark-text-secondary hover:text-white hover:bg-white/5'
              }`}
          >
            {cat === 'buy' && <span>🚀</span>}
            {cat === 'hold' && <span>⏳</span>}
            {cat === 'sell' && <span>🔻</span>}
            Top 5 {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Rankings List */}
      <div className="grid grid-cols-1 gap-4">
        {stocks.length === 0 ? (
          <div className="text-center py-20 bg-dark-bg/30 rounded-3xl border border-white/5">
            <div className="text-4xl mb-4 opacity-30">🔍</div>
            <p className="text-dark-text-secondary text-lg">No {category.toUpperCase()} gems found in this scan.</p>
            <p className="text-sm text-dark-text-secondary/60 mt-2 font-mono">Run "Complete Analysis" to refresh radar.</p>
          </div>
        ) : (
          stocks.map((stock, index) => (
            <div
              key={stock.symbol}
              className={`group relative overflow-hidden bg-dark-card border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] hover:border-${colorClass}/30 transition-all duration-300 cursor-pointer shadow-xl`}
              onClick={() => onStockClick && onStockClick(stock.symbol)}
            >
              {/* Background Accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${colorClass}/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-${colorClass}/10 transition-all`} />

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-${colorClass}/10 border border-${colorClass}/20 shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                      <span className={`text-xl font-black text-${colorClass}`}>#{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-dark-text tracking-tight group-hover:text-white transition-colors uppercase">
                        {stock.symbol}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded uppercase ${getScoreBg(stock.final_score)} ${getScoreColor(stock.final_score)} ring-1 ring-${colorClass}/20`}>
                          {stock.recommendation}
                        </span>
                        <span className="text-[10px] text-dark-text-secondary font-black uppercase tracking-widest">
                          Signal Integrity: <span className="text-white">{(stock.final_score || 0).toFixed(0)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Accuracy Multipliers - New Segment */}
                  {stock.ai_recommendation && (
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">AI Confidence</span>
                        <span className="text-xs font-black text-white italic">{stock.ai_recommendation.confidence_score}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Success Prob</span>
                        <span className="text-xs font-black text-white italic">{stock.ai_recommendation.success_probability}%</span>
                      </div>
                      {stock.ai_recommendation.divergence_signal !== 'NONE' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full animate-pulse">
                          <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">⚠️ Divergence</span>
                        </div>
                      )}
                      {stock.ai_recommendation.exhaustion_risk !== 'LOW' && stock.ai_recommendation.exhaustion_risk !== 'NONE' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Exhaustion: {stock.ai_recommendation.exhaustion_risk}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Strategic Insight Badge */}
                  <div className="bg-white/[0.03] border border-white/5 px-4 py-3 rounded-2xl w-full group-hover:bg-white/[0.05] transition-colors">
                    <p className="text-sm font-medium text-slate-300 flex items-center gap-3">
                      <span className="shrink-0 text-lg opacity-80">{stock.recommendation === 'BUY' ? '💎' : stock.recommendation === 'SELL' ? '🔻' : '⏳'}</span>
                      {getStrategicInsight(stock)}
                    </p>
                  </div>

                  {/* Price and Target Section */}
                  <div className="flex flex-wrap items-center gap-8 p-1">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-dark-text-secondary font-black">Entry Current</p>
                      <p className="text-xl font-black text-dark-text tabular-nums italic">₹{stock.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>

                    {stock.target_price?.target_price && (
                      <div className="space-y-1 pl-8 border-l border-white/10 relative">
                        <div className="absolute top-1/2 -left-3 animate-ping w-1.5 h-1.5 bg-green-500 rounded-full bg-opacity-40"></div>
                        <p className="text-[10px] uppercase tracking-widest text-dark-text-secondary font-black">Neural Target</p>
                        <div className="flex items-center gap-4">
                          <p className="text-xl font-black text-green-buy tabular-nums italic">₹{stock.target_price.target_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                            +{(
                              ((stock.target_price.target_price - stock.current_price) /
                                stock.current_price) *
                              100
                            ).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Breakdown (Visual) */}
                <div className="w-full md:w-64 space-y-4 bg-black/40 p-5 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Core Vectors</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  </div>

                  {[
                    { label: 'Technical', val: stock.technical_score, color: 'blue-accent', icon: '📊' },
                    { label: 'Fundamental', val: stock.fundamental_score, color: 'purple-500', icon: '🏢' },
                    { label: 'Sentiment', val: stock.sentiment_score, color: 'yellow-neutral', icon: '📰' },
                    { label: 'Momentum', val: stock.momentum_score, color: 'green-buy', icon: '⚡' }
                  ].map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <span className="text-[12px] grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
                          {item.label}
                        </span>
                        <span className={`text-${item.color} italic`}>{(item.val || 0).toFixed(0)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden ring-1 ring-white/5">
                        <div
                          className={`h-full bg-gradient-to-r from-transparent via-${item.color} to-${item.color} rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                          style={{ width: `${item.val || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SmartRankings;
