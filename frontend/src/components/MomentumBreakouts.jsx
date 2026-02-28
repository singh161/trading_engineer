import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { stockAPI, aiStockAPI } from '../services/api';
import {
    Zap, TrendingUp, TrendingDown, BarChart, ArrowUpRight, ArrowDownRight,
    ShieldAlert, Timer, RefreshCw, Filter, ChevronDown, ChevronUp,
    Flame, Rocket, Activity, Volume2, ShoppingCart, Target, Shield,
    ArrowUp, ArrowDown, Minus, Eye
} from 'lucide-react';

/**
 * Explosive Momentum Radar — Premium Edition
 * Categories, RSI/MACD/Volume indicators, sorting, auto-refresh, quick-buy
 */
function MomentumBreakouts({ onStockClick, analyses = {}, onQuickBuy }) {
    const [allStocks, setAllStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [sortBy, setSortBy] = useState('momentum_score');
    const [sortDir, setSortDir] = useState('desc');
    const [lastRefresh, setLastRefresh] = useState(null);

    const loadMomentumStocks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const recommendations = await aiStockAPI.getRecommendations(50);
            const allRanked = recommendations.all_ranked || [];

            // Include stocks with momentum_score > 35 for "Emerging" category
            const momentumStocks = allRanked
                .filter(s => s.momentum_score > 35)
                .map(s => {
                    // Merge with live analysis data if available
                    const liveData = analyses[(s.symbol || '').toUpperCase()] || {};
                    return {
                        ...s,
                        price_change_pct: liveData.price_change_pct ?? s.technical_analysis?.price_change_pct ?? 0,
                        rsi: s.technical_analysis?.rsi ?? liveData.rsi ?? null,
                        macd_hist: s.technical_analysis?.macd_hist ?? liveData.macd_hist ?? null,
                        trend: s.technical_analysis?.trend ?? liveData.trend ?? 'NEUTRAL',
                        volume_signal: s.technical_analysis?.volume_signal ?? liveData.volume_signal ?? 'NEUTRAL',
                        buy_count: s.technical_analysis?.buy_count ?? liveData.buy_count ?? 0,
                        sell_count: s.technical_analysis?.sell_count ?? liveData.sell_count ?? 0,
                        live_price: liveData.price ?? s.current_price ?? 0,
                    };
                })
                .sort((a, b) => b.momentum_score - a.momentum_score);

            setAllStocks(momentumStocks);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Error loading momentum stocks:', err);
            setError('Failed to load momentum data. Please ensure analysis is complete.');
        } finally {
            setLoading(false);
        }
    }, [analyses]);

    useEffect(() => { loadMomentumStocks(); }, []);
    // Auto-refresh every 60s
    useEffect(() => { const i = setInterval(loadMomentumStocks, 60000); return () => clearInterval(i); }, [loadMomentumStocks]);

    // Categorize
    const categories = useMemo(() => {
        const explosive = allStocks.filter(s => s.momentum_score >= 80);
        const strong = allStocks.filter(s => s.momentum_score >= 60 && s.momentum_score < 80);
        const emerging = allStocks.filter(s => s.momentum_score >= 35 && s.momentum_score < 60);
        return { all: allStocks, explosive, strong, emerging };
    }, [allStocks]);

    const filteredStocks = useMemo(() => {
        const stocks = categories[activeCategory] || allStocks;
        return [...stocks].sort((a, b) => {
            const aVal = a[sortBy] ?? 0, bVal = b[sortBy] ?? 0;
            return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
        });
    }, [categories, activeCategory, sortBy, sortDir, allStocks]);

    // Summary stats
    const stats = useMemo(() => {
        if (allStocks.length === 0) return null;
        const avgMom = allStocks.reduce((s, st) => s + (st.momentum_score || 0), 0) / allStocks.length;
        const bullish = allStocks.filter(s => s.recommendation === 'BUY').length;
        const bearish = allStocks.filter(s => s.recommendation === 'SELL').length;
        const avgRsi = allStocks.filter(s => s.rsi).reduce((s, st) => s + st.rsi, 0) / (allStocks.filter(s => s.rsi).length || 1);
        return {
            total: allStocks.length,
            avgMomentum: avgMom.toFixed(1),
            explosive: categories.explosive.length,
            bullish, bearish,
            avgRsi: avgRsi.toFixed(1),
            marketMood: avgMom > 65 ? '🔥 Hot' : avgMom > 50 ? '⚡ Active' : '😴 Calm',
        };
    }, [allStocks, categories]);

    // Helper for RSI color
    const rsiColor = (rsi) => {
        if (!rsi) return 'text-dark-text-secondary';
        if (rsi > 70) return 'text-red-400';
        if (rsi > 60) return 'text-orange-400';
        if (rsi < 30) return 'text-emerald-400';
        if (rsi < 40) return 'text-green-400';
        return 'text-blue-400';
    };

    const trendBadge = (trend) => {
        if (trend === 'UP') return { text: 'BULLISH', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' };
        if (trend === 'DOWN') return { text: 'BEARISH', cls: 'bg-red-500/15 text-red-400 border-red-500/20' };
        return { text: 'NEUTRAL', cls: 'bg-dark-border text-dark-text-secondary border-dark-border' };
    };

    const momentumGlow = (score) => {
        if (score >= 80) return 'border-amber-500/40 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20';
        if (score >= 60) return 'border-blue-accent/30 hover:border-blue-accent/50';
        return 'border-dark-border hover:border-dark-text-secondary/30';
    };

    if (loading && allStocks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500 w-6 h-6 animate-pulse" />
                </div>
                <p className="text-dark-text-secondary mt-4 font-medium">Scanning Market for Momentum Gems...</p>
                <p className="text-dark-text-secondary/50 text-xs mt-1">Analyzing RSI, MACD, Volume & Trend patterns</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 bg-dark-card border border-dark-border rounded-2xl">
                <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-dark-text mb-2">Analysis Required</h3>
                <p className="text-dark-text-secondary mb-6">{error}</p>
                <button onClick={loadMomentumStocks} className="px-6 py-2 bg-blue-accent hover:bg-blue-accent/90 text-white rounded-lg transition-all">Try Refresh</button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* ═══ HEADER ═══ */}
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-red-500/10 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-1/2 -mb-10 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Zap className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Explosive Momentum Radar</h2>
                            <p className="text-dark-text-secondary text-sm">Real-time breakout detection with RSI, MACD & Volume analysis</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {lastRefresh && (
                            <span className="text-[10px] text-dark-text-secondary">
                                Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <button onClick={loadMomentumStocks} className="p-2 bg-dark-bg/50 hover:bg-dark-border rounded-lg transition-all text-dark-text-secondary hover:text-dark-text">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ SUMMARY STATS ═══ */}
            {stats && (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                        { label: 'Total Signals', value: stats.total, icon: <Activity className="w-3.5 h-3.5" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'Explosive', value: stats.explosive, icon: <Flame className="w-3.5 h-3.5" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Avg Momentum', value: stats.avgMomentum, icon: <Zap className="w-3.5 h-3.5" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        { label: 'Bullish', value: stats.bullish, icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Avg RSI', value: stats.avgRsi, icon: <BarChart className="w-3.5 h-3.5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                        { label: 'Market Mood', value: stats.marketMood, icon: <Target className="w-3.5 h-3.5" />, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    ].map((s, i) => (
                        <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-3 hover:border-dark-text-secondary/30 transition-all">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <div className={`p-1 rounded-md ${s.bg} ${s.color}`}>{s.icon}</div>
                                <span className="text-[10px] text-dark-text-secondary uppercase tracking-wider font-medium">{s.label}</span>
                            </div>
                            <div className="text-base font-bold text-dark-text">{s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══ CATEGORY TABS + SORT ═══ */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-dark-card border border-dark-border rounded-xl p-3">
                <div className="flex bg-dark-bg rounded-lg p-1">
                    {[
                        { id: 'all', label: 'All', icon: <Activity className="w-3.5 h-3.5" />, count: categories.all.length },
                        { id: 'explosive', label: 'Explosive', icon: <Flame className="w-3.5 h-3.5" />, count: categories.explosive.length },
                        { id: 'strong', label: 'Strong', icon: <Rocket className="w-3.5 h-3.5" />, count: categories.strong.length },
                        { id: 'emerging', label: 'Emerging', icon: <TrendingUp className="w-3.5 h-3.5" />, count: categories.emerging.length },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveCategory(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeCategory === tab.id
                                    ? tab.id === 'explosive' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                                        : 'bg-blue-accent text-white shadow-md'
                                    : 'text-dark-text-secondary hover:text-dark-text'
                                }`}>
                            {tab.icon}
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeCategory === tab.id ? 'bg-white/20' : 'bg-dark-border'}`}>{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                        className="text-xs bg-dark-bg border border-dark-border rounded-lg px-2 py-1.5 text-dark-text focus:outline-none focus:border-blue-accent">
                        <option value="momentum_score">Momentum Score</option>
                        <option value="technical_score">Technical Score</option>
                        <option value="final_score">Final Score</option>
                        <option value="price_change_pct">Price Change %</option>
                    </select>
                    <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                        className="p-1.5 text-dark-text-secondary hover:text-dark-text hover:bg-dark-border rounded-lg transition-all">
                        {sortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* ═══ STOCK CARDS GRID ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredStocks.length > 0 ? (
                    filteredStocks.map((stock) => {
                        const trend = trendBadge(stock.trend);
                        const momGlow = momentumGlow(stock.momentum_score);
                        const pricePct = stock.price_change_pct || 0;
                        const isExplosive = stock.momentum_score >= 80;

                        return (
                            <div key={stock.symbol}
                                className={`bg-dark-card border rounded-2xl p-5 transition-all cursor-pointer group relative overflow-hidden ${momGlow}`}
                                onClick={() => onStockClick?.(stock.symbol)}
                            >
                                {/* Explosive glow effect */}
                                {isExplosive && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none"></div>
                                )}

                                <div className="relative z-10 space-y-3">
                                    {/* Row 1: Symbol + Trend + Pulse */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-white group-hover:text-blue-accent transition-colors">{stock.symbol}</h3>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${trend.cls}`}>{trend.text}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm font-bold text-dark-text">₹{(stock.live_price || stock.current_price || 0).toFixed(2)}</span>
                                                <span className={`text-xs font-semibold flex items-center gap-0.5 ${pricePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {pricePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                    {pricePct >= 0 ? '+' : ''}{pricePct.toFixed(2)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {isExplosive && (
                                                <span className="flex h-2 w-2 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                </span>
                                            )}
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isExplosive ? 'text-amber-400' : 'text-blue-accent'}`}>
                                                {isExplosive ? '🔥 Explosive' : stock.momentum_score >= 60 ? '⚡ Strong' : '📊 Emerging'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Row 2: Momentum + Confidence Scores */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-dark-bg/60 p-2.5 rounded-xl border border-white/5">
                                            <p className="text-[9px] uppercase text-dark-text-secondary font-bold mb-1">Momentum</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-lg font-black ${stock.momentum_score >= 80 ? 'text-amber-400' : stock.momentum_score >= 60 ? 'text-blue-accent' : 'text-dark-text'}`}>
                                                    {stock.momentum_score?.toFixed(1)}
                                                </span>
                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${stock.momentum_score >= 80 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                                            stock.momentum_score >= 60 ? 'bg-gradient-to-r from-blue-accent to-purple-500' :
                                                                'bg-gradient-to-r from-gray-500 to-gray-400'
                                                        }`} style={{ width: `${stock.momentum_score}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-dark-bg/60 p-2.5 rounded-xl border border-white/5">
                                            <p className="text-[9px] uppercase text-dark-text-secondary font-bold mb-1">Confidence</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-black text-dark-text">{stock.final_score?.toFixed(1)}<span className="text-xs text-dark-text-secondary">%</span></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3: RSI + MACD + Volume indicators */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* RSI */}
                                        <div className="bg-dark-bg/40 rounded-lg p-2 border border-white/5">
                                            <p className="text-[8px] uppercase text-dark-text-secondary font-bold mb-0.5">RSI</p>
                                            {stock.rsi ? (
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-sm font-bold ${rsiColor(stock.rsi)}`}>{stock.rsi.toFixed(1)}</span>
                                                    <span className={`text-[8px] px-1 py-0.5 rounded font-bold ${stock.rsi > 70 ? 'bg-red-500/15 text-red-400' :
                                                            stock.rsi < 30 ? 'bg-emerald-500/15 text-emerald-400' :
                                                                'bg-dark-border text-dark-text-secondary'
                                                        }`}>{stock.rsi > 70 ? 'OB' : stock.rsi < 30 ? 'OS' : 'OK'}</span>
                                                </div>
                                            ) : <span className="text-xs text-dark-text-secondary">—</span>}
                                        </div>
                                        {/* MACD */}
                                        <div className="bg-dark-bg/40 rounded-lg p-2 border border-white/5">
                                            <p className="text-[8px] uppercase text-dark-text-secondary font-bold mb-0.5">MACD</p>
                                            {stock.macd_hist != null ? (
                                                <div className="flex items-center gap-1">
                                                    {stock.macd_hist > 0
                                                        ? <ArrowUp className="w-3 h-3 text-emerald-400" />
                                                        : <ArrowDown className="w-3 h-3 text-red-400" />}
                                                    <span className={`text-[10px] font-bold ${stock.macd_hist > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {stock.macd_hist > 0 ? 'Bullish' : 'Bearish'}
                                                    </span>
                                                </div>
                                            ) : <span className="text-xs text-dark-text-secondary">—</span>}
                                        </div>
                                        {/* Volume */}
                                        <div className="bg-dark-bg/40 rounded-lg p-2 border border-white/5">
                                            <p className="text-[8px] uppercase text-dark-text-secondary font-bold mb-0.5">Volume</p>
                                            <div className="flex items-center gap-1">
                                                <Volume2 className={`w-3 h-3 ${stock.volume_signal === 'BUY' ? 'text-emerald-400' :
                                                        stock.volume_signal === 'SELL' ? 'text-red-400' : 'text-dark-text-secondary'
                                                    }`} />
                                                <span className={`text-[10px] font-bold ${stock.volume_signal === 'BUY' ? 'text-emerald-400' :
                                                        stock.volume_signal === 'SELL' ? 'text-red-400' : 'text-dark-text-secondary'
                                                    }`}>{stock.volume_signal === 'BUY' ? 'Surge' : stock.volume_signal === 'SELL' ? 'Drop' : 'Normal'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 4: Buy/Sell Signal Count */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1 text-xs">
                                                <span className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center text-[10px] font-bold text-emerald-400">{stock.buy_count}</span>
                                                <span className="text-dark-text-secondary text-[10px]">Buy</span>
                                            </span>
                                            <span className="flex items-center gap-1 text-xs">
                                                <span className="w-5 h-5 rounded-md bg-red-500/15 flex items-center justify-center text-[10px] font-bold text-red-400">{stock.sell_count}</span>
                                                <span className="text-dark-text-secondary text-[10px]">Sell</span>
                                            </span>
                                            <div className="h-3 w-px bg-dark-border mx-1"></div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stock.recommendation === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' :
                                                    stock.recommendation === 'SELL' ? 'bg-red-500/15 text-red-400' :
                                                        'bg-dark-border text-dark-text-secondary'
                                                }`}>{stock.recommendation}</span>
                                        </div>
                                        {/* Quick Buy */}
                                        {onQuickBuy && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onQuickBuy(stock.symbol, stock.live_price || stock.current_price); }}
                                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                <ShoppingCart className="w-3 h-3" /> BUY
                                            </button>
                                        )}
                                    </div>

                                    {/* Row 5: AI Target */}
                                    {stock.target_price?.target_price && (
                                        <div className="bg-gradient-to-r from-blue-accent/10 to-purple-500/10 border border-blue-accent/20 p-3 rounded-xl">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-[9px] uppercase text-blue-accent font-bold mb-0.5">AI Target</p>
                                                    <p className="text-base font-black text-white">₹{stock.target_price.target_price.toFixed(2)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center text-emerald-400 font-bold gap-0.5 text-sm">
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                        +{(((stock.target_price.target_price - (stock.live_price || stock.current_price)) / (stock.live_price || stock.current_price)) * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Row 6: Breakout Strength Bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[9px] font-bold text-dark-text-secondary">
                                            <span>BREAKOUT STRENGTH</span>
                                            <span>{stock.technical_score?.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${stock.technical_score >= 80 ? 'bg-gradient-to-r from-amber-500 to-red-500' :
                                                    stock.technical_score >= 60 ? 'bg-gradient-to-r from-blue-accent to-purple-500' :
                                                        'bg-gradient-to-r from-gray-500 to-gray-400'
                                                }`} style={{ width: `${stock.technical_score}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-24 text-center bg-dark-card/50 border border-dashed border-dark-border rounded-3xl">
                        <BarChart className="w-14 h-14 text-dark-border mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-dark-text">No {activeCategory !== 'all' ? activeCategory : ''} Setups Found</h3>
                        <p className="text-dark-text-secondary max-w-sm mx-auto mt-2 text-sm">
                            {activeCategory === 'explosive' ? 'No stocks have momentum score above 80 right now. Try "Strong" or "All" categories.' :
                                activeCategory === 'emerging' ? 'No stocks in the emerging momentum range. Market may be quiet.' :
                                    'The market is consolidating. No stocks meet momentum breakout criteria.'}
                        </p>
                        <button onClick={loadMomentumStocks} className="mt-5 px-5 py-2 bg-dark-border hover:bg-dark-border/80 text-dark-text rounded-xl transition-all text-sm">
                            Scan Again
                        </button>
                    </div>
                )}
            </div>

            {/* ═══ WARNING ═══ */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-dark-text-secondary leading-relaxed">
                    <span className="font-bold text-amber-500 uppercase mr-1">Trading Warning:</span>
                    High momentum stocks carry significant risk. While these setups target 15-20% gains, they can reverse quickly. Always use a stop-loss and never risk more than 2-3% of your capital on a single momentum play.
                </p>
            </div>
        </div>
    );
}

export default MomentumBreakouts;
