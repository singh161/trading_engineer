import React, { useState, useEffect } from 'react';
import { stockAPI } from '../services/api';

/**
 * BacktestPanel Component
 * Shows historical backtest results of the 9-point strategy for a specific stock
 */
function BacktestPanel({ symbol }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('6mo'); // 6mo, 1y, 2y

    const runBacktest = async (selectedPeriod) => {
        try {
            setLoading(true);
            setError(null);
            const result = await stockAPI.runBacktest(symbol, 'daily', selectedPeriod);
            if (result.error) {
                setError(result.error);
            } else {
                setData(result);
            }
        } catch (err) {
            setError('Failed to run historical backtest.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (symbol) {
            runBacktest(period);
        }
    }, [symbol, period]);

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-accent/20 border-t-blue-accent rounded-full animate-spin mb-4"></div>
                <p className="text-dark-text-secondary animate-pulse">Running Historical Simulation...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-sell/10 border border-red-sell/30 p-6 rounded-2xl text-center">
                <span className="text-3xl mb-4 block">⚠️</span>
                <h4 className="text-red-sell font-bold mb-2">Simulation Failed</h4>
                <p className="text-dark-text-secondary text-sm">{error}</p>
                <button
                    onClick={() => runBacktest(period)}
                    className="mt-4 px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg text-sm hover:bg-dark-border transition-all"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header and Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-dark-bg/40 border border-dark-border/50 p-6 rounded-[2rem]">
                <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <span className="text-blue-accent">⏱️</span> Strategy Time Machine
                    </h3>
                    <p className="text-sm text-dark-text-secondary mt-1">If you followed our 9-point rule in the past, here's what would have happened.</p>
                </div>
                <div className="flex bg-dark-bg border border-dark-border rounded-xl overflow-hidden p-1">
                    {['6mo', '1y', '2y'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            disabled={loading}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${period === p
                                    ? 'bg-blue-accent text-white shadow-lg'
                                    : 'text-dark-text-secondary hover:text-white'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {p.replace('mo', ' MONTHS').replace('y', ' YEARS')}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="text-center text-xs text-blue-accent animate-pulse font-bold tracking-widest uppercase">
                    Updating Simulation...
                </div>
            )}

            {/* Main Beginner Friendly Summary */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/20 border border-blue-500/30 p-8 rounded-[2rem] text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                <p className="text-dark-text-secondary font-medium mb-4 relative z-10">Imagine you started with ₹10,000</p>
                <div className="flex flex-col items-center justify-center gap-2 relative z-10">
                    <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                        ₹{data.final_equity.toLocaleString('en-IN')}
                    </h2>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${data.profit_loss_rs >= 0 ? 'bg-green-buy/20 text-green-buy border-green-buy/30' : 'bg-red-sell/20 text-red-sell border-red-sell/30'}`}>
                        {data.profit_loss_rs >= 0 ? '+' : ''}₹{data.profit_loss_rs.toLocaleString('en-IN')} Profit/Loss
                    </div>
                </div>
            </div>

            {/* Key Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-dark-bg/40 border border-dark-border/50 p-6 rounded-2xl flex flex-col items-center text-center hover:border-blue-500/30 transition-all">
                    <p className="text-[10px] text-dark-text-secondary uppercase font-black tracking-widest mb-2">Win Rate</p>
                    <p className="text-3xl font-black text-white">{data.win_rate_percent}%</p>
                    <p className="text-[10px] text-dark-text-secondary mt-2">Trades won vs lost</p>
                </div>

                <div className="bg-dark-bg/40 border border-dark-border/50 p-6 rounded-2xl flex flex-col items-center text-center hover:border-blue-500/30 transition-all">
                    <p className="text-[10px] text-dark-text-secondary uppercase font-black tracking-widest mb-2">Total Trades</p>
                    <p className="text-3xl font-black text-white">{data.total_trades}</p>
                    <p className="text-[10px] text-dark-text-secondary mt-2">Opportunities found</p>
                </div>

                <div className="bg-dark-bg/40 border border-dark-border/50 p-6 rounded-2xl flex flex-col items-center text-center hover:border-blue-500/30 transition-all">
                    <p className="text-[10px] text-dark-text-secondary uppercase font-black tracking-widest mb-2">Avg Profit</p>
                    <p className={`text-3xl font-black ${data.avg_profit_percent >= 0 ? 'text-green-buy' : 'text-red-sell'}`}>
                        {data.avg_profit_percent > 0 ? '+' : ''}{data.avg_profit_percent}%
                    </p>
                    <p className="text-[10px] text-dark-text-secondary mt-2">Per trade</p>
                </div>

                <div className="bg-dark-bg/40 border border-dark-border/50 p-6 rounded-2xl flex flex-col items-center text-center hover:border-blue-500/30 transition-all">
                    <p className="text-[10px] text-dark-text-secondary uppercase font-black tracking-widest mb-2">Best Trade</p>
                    <p className="text-2xl font-black text-green-buy">+{data.best_trade_percent}%</p>
                </div>

                <div className="bg-dark-bg/40 border border-dark-border/50 p-6 rounded-2xl flex flex-col items-center text-center hover:border-blue-500/30 transition-all">
                    <p className="text-[10px] text-dark-text-secondary uppercase font-black tracking-widest mb-2">Worst Trade</p>
                    <p className="text-2xl font-black text-red-sell">{data.worst_trade_percent}%</p>
                </div>

                <div className="bg-dark-bg/40 border border-dark-border/50 p-6 rounded-2xl flex flex-col items-center text-center hover:border-blue-500/30 transition-all">
                    <p className="text-[10px] text-dark-text-secondary uppercase font-black tracking-widest mb-2">Max Drawdown</p>
                    <p className="text-2xl font-black text-red-sell">-{data.max_drawdown_percent}%</p>
                    <p className="text-[9px] text-dark-text-secondary mt-1">Biggest historical drop</p>
                </div>
            </div>
        </div>
    );
}

export default BacktestPanel;
