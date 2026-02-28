import React, { useState } from 'react';
import TradingViewChart from './TradingViewChart';
import BacktestPanel from './BacktestPanel';

/**
 * StockDetailModal Component
 * Redesigned with maximum stability and premium AI aesthetics
 */
function StockDetailModal({ isOpen, onClose, symbol, analysis }) {
    const [activeSubTab, setActiveSubTab] = useState('analysis');

    React.useEffect(() => {
        const handleTabChange = (e) => {
            if (e.detail?.tab) {
                setActiveSubTab(e.detail.tab);
            }
        };
        window.addEventListener('modal-tab-change', handleTabChange);
        return () => window.removeEventListener('modal-tab-change', handleTabChange);
    }, []);

    if (!isOpen || !symbol) return null;

    // Helper to format currency safely
    const formatINR = (val) => {
        if (val === null || val === undefined || isNaN(val)) return 'N/A';
        return `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    };

    // Extract AI data with extreme safety (defensive coding)
    const aiRec = (analysis && typeof analysis === 'object') ? (analysis.ai_recommendation || {}) : {};
    const keyReasons = Array.isArray(aiRec.key_reasons) ? aiRec.key_reasons : [];
    const actionPlan = Array.isArray(aiRec.action_plan) ? aiRec.action_plan : [];
    const strategy = (aiRec.entry_exit_strategy && typeof aiRec.entry_exit_strategy === 'object') ? aiRec.entry_exit_strategy : {};
    const riskLevel = String(aiRec.risk_level || 'MEDIUM').toUpperCase();
    const confidence = Number(aiRec.confidence_score || 0);
    const rrAnalysis = (aiRec.risk_reward_analysis && typeof aiRec.risk_reward_analysis === 'object') ? aiRec.risk_reward_analysis : {};
    const keyLevels = Array.isArray(strategy.key_levels) ? strategy.key_levels : [];

    // Safety check for recommendation string
    const recText = typeof aiRec.recommendation === 'string' ? aiRec.recommendation : 'AI analysis in progress...';
    const splitRec = recText.split('.');
    const successInsight = splitRec.find(s => s.toLowerCase().includes('success')) ||
        "Strict stop-loss aur disciplined entry is trade ko profitable banayegi.";

    const verdict = String(analysis?.final_verdict || aiRec.recommendation || 'NEUTRAL').toUpperCase();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="glass-card w-full max-w-5xl max-h-[95vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Premium Header */}
                <div className="p-8 border-b border-dark-border/50 flex items-center justify-between bg-dark-bg/40">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-3xl font-black text-blue-accent shadow-lg shadow-blue-500/10">
                            {String(symbol)[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-white tracking-tight">{symbol}</h1>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${verdict.includes('BUY') ? 'bg-green-buy/10 text-green-buy border-green-buy/20' :
                                    verdict.includes('SELL') ? 'bg-red-sell/10 text-red-sell border-red-sell/20' :
                                        'bg-yellow-neutral/10 text-yellow-neutral border-yellow-neutral/20'
                                    }`}>
                                    {verdict}
                                </span>
                            </div>
                            <p className="text-lg font-mono text-dark-text-secondary mt-1 flex items-center gap-2">
                                <span className="font-bold text-white">{formatINR(analysis?.price)}</span>
                                {analysis?.price_change_pct !== undefined && (
                                    <span className={`text-sm ${analysis.price_change_pct >= 0 ? 'text-green-buy' : 'text-red-sell'}`}>
                                        {analysis.price_change_pct >= 0 ? '▲' : '▼'} {Math.abs(analysis.price_change_pct).toFixed(2)}%
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 border border-dark-border rounded-xl flex items-center justify-center text-dark-text-secondary hover:text-white hover:bg-dark-border transition-all group"
                    >
                        <span className="text-xl group-hover:rotate-90 transition-transform">✕</span>
                    </button>
                </div>

                {/* Tab Switcher - Floating Style */}
                <div className="px-8 py-2 bg-dark-bg/20 border-b border-dark-border/30 flex gap-8">
                    <button
                        onClick={() => setActiveSubTab('analysis')}
                        className={`py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeSubTab === 'analysis' ? 'border-blue-accent text-white' : 'border-transparent text-dark-text-secondary hover:text-dark-text'
                            }`}
                    >
                        AI Insights
                    </button>
                    <button
                        onClick={() => setActiveSubTab('chart')}
                        className={`py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeSubTab === 'chart' ? 'border-blue-accent text-white' : 'border-transparent text-dark-text-secondary hover:text-dark-text'
                            }`}
                    >
                        Technical Chart
                    </button>
                    <button
                        onClick={() => setActiveSubTab('backtest')}
                        className={`py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeSubTab === 'backtest' ? 'border-blue-accent text-white' : 'border-transparent text-dark-text-secondary hover:text-dark-text'
                            }`}
                    >
                        Backtest Engine
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                    {activeSubTab === 'analysis' ? (
                        !analysis ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-blue-accent/10 border-t-blue-accent animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-xl">🧠</div>
                                </div>
                                <p className="text-dark-text-secondary font-medium animate-pulse">Synchronizing AI Neural Models...</p>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                                {/* Row 1: Gauge & Summary */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
                                    {/* Confidence Gauge */}
                                    <div className="lg:col-span-4 bg-dark-bg/40 border border-dark-border/50 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
                                        <div className="relative mb-6">
                                            <svg className="w-40 h-40 transform -rotate-90">
                                                <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-dark-card" />
                                                <circle
                                                    cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="10" fill="transparent"
                                                    strokeDasharray={464.7}
                                                    strokeDashoffset={464.7 - (464.7 * Math.min(100, confidence)) / 100}
                                                    className="text-blue-accent transition-all duration-1500 ease-out"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-4xl font-black text-white">{confidence}%</span>
                                                <span className="text-[10px] text-dark-text-secondary uppercase font-black tracking-widest mt-1">Accuracy</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-dark-text italic">"High conviction trade setup"</p>
                                            <p className="text-[10px] text-dark-text-secondary uppercase font-bold">Signal Score Matrix</p>
                                        </div>
                                    </div>

                                    {/* Summary Card */}
                                    <div className="lg:col-span-8 bg-dark-bg/40 border border-dark-border/50 rounded-[2rem] p-8 relative">
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl text-xl">✨</span>
                                            <h3 className="text-xs font-black text-dark-text-secondary uppercase tracking-[0.2em]">AI Executive Summary</h3>
                                        </div>
                                        <p className="text-lg text-dark-text leading-relaxed font-semibold italic mb-8 border-l-4 border-blue-accent/30 pl-6 py-2">
                                            {recText.split('\n')[0]}
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {keyReasons.length > 0 ? keyReasons.slice(0, 4).map((reason, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-dark-card/30 rounded-xl border border-white/5 group hover:border-blue-500/20 transition-all">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-accent group-hover:scale-150 transition-transform"></span>
                                                    <span className="text-[11px] text-dark-text-secondary font-bold group-hover:text-white transition-colors">{String(reason)}</span>
                                                </div>
                                            )) : (
                                                <p className="text-xs text-dark-text-secondary italic">Neural analysis of trend cycles complete.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Execution Engine */}
                                <div className="space-y-6 mb-10">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-xs font-black text-dark-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="text-blue-accent">⚡</span> Execution Strategy Engine
                                        </h3>
                                        {rrAnalysis.risk_reward_ratio > 0 && (
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 bg-dark-bg border border-dark-border rounded-lg text-[9px] font-black text-dark-text-secondary">RR: {rrAnalysis.risk_reward_ratio}:1</span>
                                                <span className="px-3 py-1 bg-blue-accent/10 border border-blue-500/20 rounded-lg text-[9px] font-black text-blue-accent uppercase">Edge Detected</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        {/* Main Strategy Card */}
                                        <div className="lg:col-span-7 bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-all"></div>

                                            <div className="grid grid-cols-2 gap-10 mb-10 relative">
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[10px] text-dark-text-secondary uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-green-buy animate-pulse"></span>
                                                            Buy/Entry Zone
                                                        </p>
                                                        <p className="text-4xl font-black text-white tracking-tighter">{formatINR(analysis.buy_price || analysis.price)}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-dark-text-secondary uppercase font-bold">Entry Method</p>
                                                        <p className="text-xs font-bold text-blue-accent">{strategy.entry_method || 'Selective Market Entry'}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 text-right">
                                                    <div>
                                                        <p className="text-[10px] text-red-sell uppercase font-black tracking-widest mb-2 flex items-center gap-2 justify-end">
                                                            Neutral/SL Point
                                                            <span className="w-2 h-2 rounded-full bg-red-sell"></span>
                                                        </p>
                                                        <p className="text-4xl font-black text-white tracking-tighter opacity-80">{formatINR(analysis.sell_price)}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-dark-text-secondary uppercase font-bold">Risk Management</p>
                                                        <p className="text-xs font-bold text-red-sell">{rrAnalysis.risk_percentage || 'Max 3-5%'} Exposure</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Visual Progress Map */}
                                            <div className="space-y-2 mb-8">
                                                <div className="h-3 bg-dark-bg rounded-full overflow-hidden flex border border-white/5 relative">
                                                    <div className="h-full bg-red-sell/50" style={{ width: '15%' }}></div>
                                                    <div className="w-1 h-full bg-white/20"></div>
                                                    <div className="flex-1 h-full bg-green-buy/20 relative">
                                                        <div className="absolute top-0 bottom-0 left-0 bg-green-buy shadow-[0_0_15px_rgba(16,185,129,0.3)]" style={{ width: '40%' }}></div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-[8px] font-black text-dark-text-secondary uppercase px-1">
                                                    <span>Risk Zone</span>
                                                    <span>Current Zone</span>
                                                    <span>Profit Target</span>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-white/5 rounded-[1.5rem] flex items-start gap-3">
                                                <span className="text-xl">💡</span>
                                                <p className="text-xs text-white/70 font-medium leading-relaxed italic">
                                                    {successInsight}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Strategy Metadata */}
                                        <div className="lg:col-span-5 space-y-6">
                                            <div className="bg-dark-bg/40 border border-dark-border/50 rounded-[2rem] p-6 space-y-6">
                                                <div className="space-y-3">
                                                    <h4 className="text-[10px] font-black text-dark-text-secondary uppercase tracking-widest">Trade Parameters</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center p-3 bg-dark-card/50 rounded-xl border border-white/5">
                                                            <span className="text-[10px] font-bold text-dark-text-secondary uppercase">Time Horizon</span>
                                                            <span className="text-xs font-black text-white">{strategy.time_horizon || '1-4 Weeks'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center p-3 bg-dark-card/50 rounded-xl border border-white/5">
                                                            <span className="text-[10px] font-bold text-dark-text-secondary uppercase">Position Size</span>
                                                            <span className="text-xs font-black text-blue-accent">{aiRec.position_size?.recommended_percentage || 100}% Allocate</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <h4 className="text-[10px] font-black text-dark-text-secondary uppercase tracking-widest">Neural Key Levels</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {keyLevels.length > 0 ? keyLevels.map((lvl, idx) => (
                                                            <span key={idx} className={`px-3 py-1.5 rounded-lg text-[9px] font-black border ${String(lvl).includes('Support') ? 'bg-green-buy/10 text-green-buy border-green-buy/20' : 'bg-red-sell/10 text-red-sell border-red-sell/20'
                                                                }`}>
                                                                {String(lvl)}
                                                            </span>
                                                        )) : (
                                                            <span className="text-[10px] text-dark-text-secondary italic">Calculating static defenses...</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 3: Technical Pulse & Action Plan */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                    <div className="lg:col-span-8 space-y-6">
                                        <h3 className="text-xs font-black text-dark-text-secondary uppercase tracking-[0.2em] px-2">Action Checklist</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {actionPlan.length > 0 ? actionPlan.map((step, i) => (
                                                <div key={i} className="flex gap-4 p-5 bg-dark-bg/40 border border-dark-border/50 rounded-2xl hover:bg-dark-bg/60 transition-all group border-l-4 border-l-dark-border hover:border-l-blue-accent">
                                                    <span className="w-8 h-8 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-xs font-black text-dark-text-secondary group-hover:text-blue-accent transition-colors shadow-lg flex-shrink-0">
                                                        {i + 1}
                                                    </span>
                                                    <p className="text-xs text-dark-text font-bold leading-relaxed">{String(step)}</p>
                                                </div>
                                            )) : (
                                                <p className="text-xs text-dark-text-secondary italic px-2">Formulating optimal trade sequence...</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="lg:col-span-4 bg-dark-card/30 border border-dark-border/50 rounded-[2rem] p-8 space-y-8">
                                        <h3 className="text-[10px] font-black text-dark-text-secondary uppercase tracking-widest">Technical Heartbeat</h3>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] text-dark-text-secondary uppercase font-black">RSI Intensity</p>
                                                    <p className={`text-xl font-black ${analysis.rsi > 70 ? 'text-red-sell' : analysis.rsi < 30 ? 'text-green-buy' : 'text-white'}`}>
                                                        {analysis.rsi ? Number(analysis.rsi).toFixed(1) : '50.0'}
                                                    </p>
                                                </div>
                                                <div className="h-10 w-20 bg-dark-bg rounded-md overflow-hidden flex items-end p-0.5 gap-0.5">
                                                    {[4, 7, 5, 9, 11, 8, 12].map((h, i) => <div key={i} className="flex-1 bg-blue-accent/30 rounded-sm" style={{ height: `${h * 8}%` }}></div>)}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-dark-bg/50 rounded-2xl border border-white/5">
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] text-dark-text-secondary uppercase font-black">MACD Status</p>
                                                    <p className="text-xs font-black text-white">{analysis.macd_hist > 0 ? 'BULLISH' : 'BEARISH'}</p>
                                                </div>
                                                <div className={`w-3 h-3 rounded-full ${analysis.macd_hist > 0 ? 'bg-green-buy shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-sell'}`}></div>
                                            </div>
                                            <div className="pt-4 border-t border-dark-border/30">
                                                <div className="flex flex-col items-center gap-2">
                                                    <p className="text-[8px] text-dark-text-secondary uppercase font-black">Current Market Regime</p>
                                                    <span className="px-4 py-2 bg-blue-accent text-[10px] font-black text-white rounded-xl shadow-lg shadow-blue-500/20 uppercase tracking-widest">
                                                        {aiRec.market_regime?.type || 'Trending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : activeSubTab === 'chart' ? (
                        <div className="h-[600px] rounded-[2.5rem] overflow-hidden border border-dark-border/50 shadow-2xl animate-in fade-in zoom-in-95 duration-700">
                            <TradingViewChart symbol={symbol} height={600} />
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-700">
                            <BacktestPanel symbol={symbol} />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-dark-border/50 bg-dark-bg/60 flex justify-between items-center">
                    <button
                        onClick={() => {
                            const savedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
                            const strSym = String(symbol);
                            let newWatchlist = savedWatchlist.includes(strSym) ? savedWatchlist.filter(s => s !== strSym) : [...savedWatchlist, strSym];
                            localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
                            window.dispatchEvent(new Event('watchlist-updated'));
                        }}
                        className="px-8 py-4 bg-dark-card border border-dark-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-dark-text-secondary hover:text-white hover:bg-dark-border transition-all flex items-center gap-3"
                    >
                        <span>⭐</span> Watchlist Sync
                    </button>
                    <button
                        onClick={onClose}
                        className="px-12 py-4 bg-blue-accent hover:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        Close Portal
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StockDetailModal;
