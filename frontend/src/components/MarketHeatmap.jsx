import React, { useMemo, useState } from 'react';

/**
 * MarketSentimentHeatmap — Premium Redesign
 * Features:
 * - Dynamic tile sizing based on signal strength
 * - Sector grouping toggle
 * - RSI + Buy/Sell count mini bar
 * - Animated glow on STRONG BUY/SELL
 * - Sort by: Change % | Signal Strength | RSI
 * - Filter: ALL | BUY | SELL | NEUTRAL
 * - Hover tooltip with full stats
 */
function MarketHeatmap({ stocks, analyses, onStockClick }) {
    const [sortBy, setSortBy] = useState('signals');      // 'change' | 'signals' | 'rsi'
    const [filterBy, setFilterBy] = useState('all');      // 'all' | 'buy' | 'sell' | 'neutral'
    const [limit, setLimit] = useState(40);

    const heatmapData = useMemo(() => {
        let data = stocks.map(stock => {
            const symbol = stock.symbol || stock.SYMBOL || stock.symbal_name || stock.name || stock.identifier_name || '';
            const analysis = analyses[symbol] || {};
            return {
                symbol,
                name: stock.name || symbol,
                price: analysis.price || 0,
                change: analysis.price_change_pct || 0,
                verdict: analysis.final_verdict || 'NEUTRAL',
                buyCount: analysis.buy_count || 0,
                sellCount: analysis.sell_count || 0,
                rsi: analysis.rsi || 50,
                volume: analysis.volume || 0,
                ema20: analysis.ema20 || null,
                trend: analysis.trend || 'SIDEWAYS',
            };
        }).filter(s => s.symbol);

        // Filter
        if (filterBy === 'buy') data = data.filter(s => s.verdict.includes('BUY'));
        if (filterBy === 'sell') data = data.filter(s => s.verdict.includes('SELL'));
        if (filterBy === 'neutral') data = data.filter(s => s.verdict === 'NEUTRAL');

        // Sort
        if (sortBy === 'change') data.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
        if (sortBy === 'signals') data.sort((a, b) => (b.buyCount + b.sellCount) - (a.buyCount + a.sellCount));
        if (sortBy === 'rsi') data.sort((a, b) => Math.abs(b.rsi - 50) - Math.abs(a.rsi - 50));

        return data.slice(0, limit);
    }, [stocks, analyses, sortBy, filterBy, limit]);

    // Count verdicts for summary
    const totals = useMemo(() => {
        const all = stocks.map(s => {
            const sym = s.symbol || s.SYMBOL || s.symbal_name || s.name || s.identifier_name || '';
            return analyses[sym]?.final_verdict || 'NEUTRAL';
        });
        return {
            strongBuy: all.filter(v => v === 'STRONG BUY').length,
            buy: all.filter(v => v === 'BUY').length,
            neutral: all.filter(v => v === 'NEUTRAL').length,
            sell: all.filter(v => v === 'SELL').length,
            strongSell: all.filter(v => v === 'STRONG SELL').length,
            total: all.length,
        };
    }, [stocks, analyses]);

    const bullPercent = totals.total > 0 ? Math.round(((totals.strongBuy + totals.buy) / totals.total) * 100) : 0;
    const bearPercent = totals.total > 0 ? Math.round(((totals.strongSell + totals.sell) / totals.total) * 100) : 0;

    const getGradient = (verdict, change) => {
        if (verdict === 'STRONG BUY') return 'from-emerald-600 to-green-500';
        if (verdict === 'BUY') return 'from-green-700 to-emerald-600';
        if (verdict === 'STRONG SELL') return 'from-rose-600 to-red-500';
        if (verdict === 'SELL') return 'from-red-700 to-rose-600';
        if (change > 0) return 'from-teal-800 to-teal-700';
        if (change < 0) return 'from-red-900 to-red-800';
        return 'from-slate-700 to-slate-800';
    };

    const getGlow = (verdict) => {
        if (verdict === 'STRONG BUY') return 'shadow-[0_0_18px_rgba(16,185,129,0.45)]';
        if (verdict === 'STRONG SELL') return 'shadow-[0_0_18px_rgba(239,68,68,0.45)]';
        return '';
    };

    const getTileSize = (verdict, buyCount, sellCount) => {
        const total = buyCount + sellCount;
        if (verdict === 'STRONG BUY' || verdict === 'STRONG SELL') return 'h-28';
        if (total >= 7) return 'h-24';
        return 'h-20';
    };

    const getRsiBar = (rsi) => {
        const pct = Math.min(100, Math.max(0, rsi));
        const color = rsi < 35 ? 'bg-emerald-400' : rsi > 65 ? 'bg-rose-400' : 'bg-sky-400';
        return { pct, color };
    };

    const verdictIcon = (verdict) => {
        if (verdict === 'STRONG BUY') return '🚀';
        if (verdict === 'BUY') return '📈';
        if (verdict === 'STRONG SELL') return '🔻';
        if (verdict === 'SELL') return '📉';
        return '➖';
    };

    const SORT_OPTIONS = [
        { key: 'signals', label: 'Signal Strength' },
        { key: 'change', label: 'Price Change' },
        { key: 'rsi', label: 'RSI Extremity' },
    ];

    const FILTER_OPTIONS = [
        { key: 'all', label: 'All', color: 'text-dark-text-secondary' },
        { key: 'buy', label: '🟢 Buy', color: 'text-green-400' },
        { key: 'sell', label: '🔴 Sell', color: 'text-red-400' },
        { key: 'neutral', label: '⬜ Neutral', color: 'text-slate-400' },
    ];

    const analyzed = Object.keys(analyses).length;

    return (
        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">

            {/* ── Top Header ── */}
            <div className="p-6 bg-gradient-to-r from-dark-card to-dark-bg border-b border-dark-border/60">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-black text-white flex items-center gap-3">
                            <span className="text-2xl">🌡️</span>
                            Market Sentiment Heatmap
                        </h3>
                        <p className="text-xs text-dark-text-secondary mt-1">
                            {analyzed > 0 ? `Live analysis of ${analyzed} stocks — click any tile to deep dive` : 'Waiting for analysis data...'}
                        </p>
                    </div>

                    {/* Market Mood Summary Bar */}
                    {totals.total > 0 && (
                        <div className="flex flex-col items-end gap-1.5 min-w-[200px]">
                            <div className="flex justify-between w-full text-[10px] font-black">
                                <span className="text-emerald-400">🐂 BULL {bullPercent}%</span>
                                <span className="text-red-400">BEAR {bearPercent}% 🐻</span>
                            </div>
                            <div className="w-full h-3 bg-dark-bg rounded-full overflow-hidden flex border border-white/5">
                                <div className="h-full bg-gradient-to-r from-emerald-600 to-green-500 transition-all duration-700"
                                    style={{ width: `${bullPercent}%` }} />
                                <div className="flex-1 h-full bg-gradient-to-r from-red-700 to-rose-500" />
                            </div>
                            <div className="flex gap-3 text-[9px] text-dark-text-secondary font-bold">
                                <span className="text-emerald-500">●  SB:{totals.strongBuy} B:{totals.buy}</span>
                                <span className="text-slate-500">● N:{totals.neutral}</span>
                                <span className="text-rose-500">● S:{totals.sell} SS:{totals.strongSell}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Row */}
                <div className="flex flex-wrap gap-3 mt-4 items-center">
                    {/* Filter Tabs */}
                    <div className="flex bg-dark-bg border border-dark-border rounded-xl p-1 gap-1">
                        {FILTER_OPTIONS.map(opt => (
                            <button key={opt.key}
                                onClick={() => setFilterBy(opt.key)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterBy === opt.key
                                        ? 'bg-blue-accent text-white shadow'
                                        : `${opt.color} hover:bg-dark-border`
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 text-[10px] text-dark-text-secondary">
                        <span className="font-bold uppercase tracking-widest">Sort:</span>
                        <div className="flex bg-dark-bg border border-dark-border rounded-xl p-1 gap-1">
                            {SORT_OPTIONS.map(opt => (
                                <button key={opt.key}
                                    onClick={() => setSortBy(opt.key)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${sortBy === opt.key ? 'bg-blue-accent text-white' : 'text-dark-text-secondary hover:bg-dark-border'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Limit */}
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-[10px] text-dark-text-secondary font-bold">Show:</span>
                        {[20, 40, 60].map(l => (
                            <button key={l} onClick={() => setLimit(l)}
                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${limit === l ? 'bg-blue-accent text-white' : 'bg-dark-bg text-dark-text-secondary border border-dark-border hover:bg-dark-border'
                                    }`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Heatmap Grid ── */}
            <div className="p-4">
                {heatmapData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-5xl mb-4 animate-pulse">📊</div>
                        <p className="text-dark-text-secondary font-bold">Analyzing market data...</p>
                        <p className="text-xs text-dark-text-secondary mt-2">Heatmap will populate as stocks are analyzed</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                        {heatmapData.map(item => {
                            const { pct, color } = getRsiBar(item.rsi);
                            const signalStrength = Math.min(100, ((item.buyCount + item.sellCount) / 9) * 100);
                            const isBull = item.verdict.includes('BUY');
                            const isBear = item.verdict.includes('SELL');
                            const isStrong = item.verdict.startsWith('STRONG');

                            return (
                                <div
                                    key={item.symbol}
                                    onClick={() => onStockClick(item.symbol)}
                                    className={`
                                        relative rounded-xl p-2.5 cursor-pointer
                                        bg-gradient-to-br ${getGradient(item.verdict, item.change)}
                                        ${getTileSize(item.verdict, item.buyCount, item.sellCount)}
                                        ${getGlow(item.verdict)}
                                        hover:scale-105 hover:z-10 transition-all duration-200
                                        group overflow-hidden
                                        ${isStrong ? 'ring-1 ring-white/20' : ''}
                                    `}
                                >
                                    {/* Pulse for STRONG signals */}
                                    {isStrong && (
                                        <div className={`absolute inset-0 rounded-xl opacity-20 animate-pulse ${isBull ? 'bg-green-400' : 'bg-red-400'}`} />
                                    )}

                                    <div className="relative flex flex-col h-full justify-between">
                                        {/* Top: Symbol + Icon */}
                                        <div className="flex items-start justify-between">
                                            <span className="text-[10px] font-black text-white/90 leading-tight truncate max-w-[70%]">
                                                {item.symbol}
                                            </span>
                                            <span className="text-[10px] leading-none">{verdictIcon(item.verdict)}</span>
                                        </div>

                                        {/* Middle: Price change */}
                                        <div className="mt-1">
                                            <span className={`text-sm font-black leading-none ${item.change >= 0 ? 'text-white' : 'text-white/90'}`}>
                                                {item.change > 0 ? '▲' : item.change < 0 ? '▼' : ''}
                                                {Math.abs(item.change).toFixed(1)}%
                                            </span>
                                        </div>

                                        {/* Bottom: RSI bar + signal dots */}
                                        <div className="mt-auto space-y-1">
                                            {/* Signal strength bar */}
                                            <div className="h-1 bg-black/30 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${isBull ? 'bg-white/70' : isBear ? 'bg-white/50' : 'bg-white/30'}`}
                                                    style={{ width: `${signalStrength}%` }}
                                                />
                                            </div>
                                            {/* RSI mini indicator */}
                                            <div className="flex items-center gap-1">
                                                <div className="flex-1 h-0.5 bg-black/20 rounded-full overflow-hidden">
                                                    <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-[8px] text-white/50 font-bold">{Math.round(item.rsi)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hover Tooltip */}
                                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 rounded-xl flex flex-col items-center justify-center transition-all duration-200 gap-1 p-2">
                                        <span className="text-white font-black text-xs">{item.symbol}</span>
                                        {item.price > 0 && (
                                            <span className="text-[10px] text-white/70 font-bold">₹{item.price.toLocaleString('en-IN')}</span>
                                        )}
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isBull ? 'bg-green-500/30 text-green-300' : isBear ? 'bg-red-500/30 text-red-300' : 'bg-slate-500/30 text-slate-300'
                                            }`}>
                                            {item.verdict}
                                        </span>
                                        <div className="flex gap-2 text-[9px] font-bold mt-1">
                                            <span className="text-green-400">B:{item.buyCount}</span>
                                            <span className="text-red-400">S:{item.sellCount}</span>
                                            <span className="text-sky-400">RSI:{Math.round(item.rsi)}</span>
                                        </div>
                                        <span className="text-[8px] text-white/40 mt-1 uppercase tracking-widest">Click to analyze</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Legend ── */}
            <div className="px-6 pb-4 flex flex-wrap gap-4 text-[10px] font-black text-dark-text-secondary border-t border-white/5 pt-4">
                {[
                    { color: 'bg-emerald-500', label: 'STRONG BUY' },
                    { color: 'bg-green-700', label: 'BUY' },
                    { color: 'bg-slate-600', label: 'NEUTRAL' },
                    { color: 'bg-red-700', label: 'SELL' },
                    { color: 'bg-rose-500', label: 'STRONG SELL' },
                ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                        <span>{l.label}</span>
                    </div>
                ))}
                <div className="ml-auto flex items-center gap-1.5 text-dark-text-secondary">
                    <div className="w-16 h-1 bg-gradient-to-r from-white/10 to-white/60 rounded-full" />
                    <span>Signal Strength</span>
                </div>
            </div>
        </div>
    );
}

export default MarketHeatmap;
