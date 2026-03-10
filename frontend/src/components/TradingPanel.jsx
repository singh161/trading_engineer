import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { tradingAPI } from '../services/api';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingCart, X,
    Target, Shield, ArrowUpRight, ArrowDownRight, RefreshCw,
    Clock, BarChart3, Wallet, AlertTriangle, CircleDot,
    ChevronDown, ChevronUp, Trash2, Edit3, Check, RotateCcw,
    Plus, Minus, Award, Flame, PieChart, Percent, Search
} from 'lucide-react';

function TradingPanel({ stocks = [], analyses = {}, onStockClick }) {
    const [dashboard, setDashboard] = useState(null);
    const [positions, setPositions] = useState([]);
    const [tradeHistory, setTradeHistory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('positions');
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [orderForm, setOrderForm] = useState({
        symbol: '', orderType: 'BUY', quantity: 1, price: 0, stopLoss: '', target: '',
        instrumentType: 'EQUITY', strikePrice: '', expiry: '', optionType: 'CE'
    });
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderMessage, setOrderMessage] = useState(null);
    const [editingPosition, setEditingPosition] = useState(null);
    const [editSL, setEditSL] = useState('');
    const [editTarget, setEditTarget] = useState('');
    const [sortBy, setSortBy] = useState('pnl_pct');
    const [sortDir, setSortDir] = useState('desc');
    const [priceType, setPriceType] = useState('LIMIT'); // LIMIT or MARKET

    const getLotSize = (symbol) => {
        const s = symbol?.toUpperCase() || '';
        if (s.includes('BANKNIFTY')) return 15;
        if (s.includes('FINNIFTY')) return 40;
        if (s.includes('MIDCPNIFTY')) return 75;
        if (s.includes('NIFTY')) return 50;
        return 1;
    };

    const changeQty = (delta) => {
        const lot = getLotSize(orderForm.symbol);
        setOrderForm(p => ({ ...p, quantity: Math.max(lot, p.quantity + (delta * lot)) }));
    };

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [dashData, posData, histData, ordData] = await Promise.all([
                tradingAPI.getDashboard(), tradingAPI.getPositions(),
                tradingAPI.getHistory(50), tradingAPI.getOrders(50),
            ]);
            setDashboard(dashData);
            setPositions(posData?.positions || []);
            setTradeHistory(histData?.trades || []);
            setOrders(ordData?.orders || []);
        } catch (err) { console.error('Error loading trading data:', err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        loadData();
        const i = setInterval(loadData, 30000);

        // Listen for system-wide trading updates
        const handleUpdate = () => loadData();
        window.addEventListener('trading-update', handleUpdate);

        return () => {
            clearInterval(i);
            window.removeEventListener('trading-update', handleUpdate);
        };
    }, [loadData]);

    useEffect(() => {
        if (searchTerm.length < 1) { setSearchResults([]); return; }
        const term = searchTerm.toUpperCase();
        setSearchResults(stocks.filter(s => {
            const sym = (s.symbol || '').toUpperCase();
            const name = (s.name || '').toUpperCase();
            return sym.includes(term) || name.includes(term);
        }).slice(0, 8));
    }, [searchTerm, stocks]);

    const selectStock = (stock) => {
        const sym = (stock.symbol || '').toUpperCase();
        if (orderForm.instrumentType === 'OPTION') {
            setOrderForm(p => ({ ...p, symbol: sym }));
        } else {
            const price = analyses[sym]?.price || stock.price || 0;
            setOrderForm(p => ({ ...p, symbol: sym, price: parseFloat(price) || 0 }));
        }
        setSearchTerm(''); setSearchResults([]);
    };

    const placeOrder = async () => {
        if (!orderForm.symbol || orderForm.quantity <= 0 || orderForm.price <= 0) {
            setOrderMessage({ type: 'error', text: 'Fill all required fields.' }); return;
        }
        try {
            setOrderLoading(true); setOrderMessage(null);
            const result = await tradingAPI.placeOrder(
                orderForm.symbol, orderForm.orderType, orderForm.quantity, orderForm.price,
                orderForm.stopLoss ? parseFloat(orderForm.stopLoss) : null,
                orderForm.target ? parseFloat(orderForm.target) : null,
                orderForm.instrumentType,
                orderForm.strikePrice ? parseFloat(orderForm.strikePrice) : null,
                orderForm.expiry,
                orderForm.instrumentType === 'OPTION' ? orderForm.optionType : null,
            );
            setOrderMessage({ type: 'success', text: result.message });
            setOrderForm({
                symbol: '', orderType: 'BUY', quantity: 1, price: 0, stopLoss: '', target: '',
                instrumentType: 'EQUITY', strikePrice: '', expiry: '', optionType: 'CE'
            });
            setTimeout(() => { setShowOrderForm(false); setOrderMessage(null); }, 1500);
            loadData();
        } catch (err) {
            setOrderMessage({ type: 'error', text: err.response?.data?.detail || 'Order failed.' });
        } finally { setOrderLoading(false); }
    };

    const handleExit = async (symbol, currentPrice) => {
        if (!window.confirm(`Exit ${symbol} at ₹${currentPrice}?`)) return;
        try { await tradingAPI.exitPosition(symbol, currentPrice, 'MANUAL'); loadData(); }
        catch (err) { console.error('Exit error:', err); }
    };

    const handleUpdateSLTarget = async (symbol) => {
        try {
            await tradingAPI.updateSLTarget(symbol, editSL ? parseFloat(editSL) : null, editTarget ? parseFloat(editTarget) : null);
            setEditingPosition(null); loadData();
        } catch (err) { console.error('SL/Target update error:', err); }
    };

    const handleReset = async () => {
        if (!window.confirm('⚠️ Reset trading account? All data will be cleared!')) return;
        try { await tradingAPI.resetAccount(); loadData(); } catch (err) { console.error(err); }
    };

    const applySLPreset = (pct) => {
        if (!orderForm.price) return;
        setOrderForm(p => ({ ...p, stopLoss: (p.price * (1 - pct / 100)).toFixed(2) }));
    };
    const applyTargetPreset = (pct) => {
        if (!orderForm.price) return;
        setOrderForm(p => ({ ...p, target: (p.price * (1 + pct / 100)).toFixed(2) }));
    };

    // Calculate dynamic strikes and premiums
    const optionChain = useMemo(() => {
        if (orderForm.instrumentType !== 'OPTION' || !orderForm.symbol) return [];
        const spot = analyses[orderForm.symbol]?.price || 0;
        if (!spot) return [];

        let step = 50;
        if (orderForm.symbol.includes('BANKNIFTY')) step = 100;
        else if (orderForm.symbol.includes('FINNIFTY')) step = 50;
        else if (spot > 1000) step = 20;
        else step = 5;

        const atm = Math.round(spot / step) * step;
        const strikes = [];
        for (let i = -5; i <= 5; i++) {
            const strike = atm + (i * step);
            // Refined Premium Calculation
            // Time Value (Extrinsic) is highest at ATM and decays as we move OTM/ITM
            const distFromSpot = Math.abs(spot - strike);
            const extrinsicBase = spot * 0.02; // Adjusted to 2% for matching current volatility better
            const decay = Math.exp(- (distFromSpot / (spot * 0.1))); // Bell curve decay
            const timeValue = extrinsicBase * decay;

            let coreValue = 0;
            if (orderForm.optionType === 'CE') coreValue = Math.max(0, spot - strike);
            else coreValue = Math.max(0, strike - spot);

            const premium = (coreValue + timeValue).toFixed(2);
            strikes.push({
                strike,
                premium,
                isATM: strike === atm,
                intrinsic: coreValue.toFixed(2),
                timeValue: timeValue.toFixed(2)
            });
        }
        return strikes;
    }, [orderForm.symbol, orderForm.instrumentType, orderForm.optionType, analyses]);

    const breakEven = useMemo(() => {
        if (orderForm.instrumentType !== 'OPTION' || !orderForm.strikePrice || !orderForm.price) return null;
        const strike = parseFloat(orderForm.strikePrice);
        const premium = parseFloat(orderForm.price);
        return orderForm.optionType === 'CE' ? (strike + premium).toFixed(2) : (strike - premium).toFixed(2);
    }, [orderForm.instrumentType, orderForm.strikePrice, orderForm.price, orderForm.optionType]);

    const sortedPositions = useMemo(() => {
        return [...positions].sort((a, b) => {
            const aVal = a[sortBy] ?? 0, bVal = b[sortBy] ?? 0;
            return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
        });
    }, [positions, sortBy, sortDir]);

    const holdingsAllocation = useMemo(() => {
        const total = positions.reduce((s, p) => s + (p.invested || 0), 0);
        const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#f97316'];
        return positions.map((p, i) => ({
            symbol: p.symbol, pct: total > 0 ? ((p.invested / total) * 100).toFixed(1) : 0,
            invested: p.invested, color: colors[i % colors.length],
        }));
    }, [positions]);

    const fmt = (v) => v == null ? '—' : `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const pnlC = (v) => (!v && v !== 0) ? 'text-dark-text-secondary' : v >= 0 ? 'text-emerald-400' : 'text-red-400';
    const pnlBg = (v) => (!v && v !== 0) ? '' : v >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20';

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* ═══ STATS ROW ═══ */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {[
                    { icon: <Wallet className="w-4 h-4" />, label: 'Available', value: fmt(dashboard?.balance), color: 'text-blue-400', iconBg: 'bg-blue-500/10' },
                    { icon: <BarChart3 className="w-4 h-4" />, label: 'Invested', value: fmt(dashboard?.invested), color: 'text-purple-400', iconBg: 'bg-purple-500/10' },
                    { icon: <DollarSign className="w-4 h-4" />, label: 'Current Value', value: fmt(dashboard?.current_value), color: 'text-cyan-400', iconBg: 'bg-cyan-500/10' },
                    {
                        icon: dashboard?.overall_pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
                        label: 'Overall P&L', value: fmt(dashboard?.overall_pnl), sub: dashboard ? `${dashboard.overall_pnl_pct >= 0 ? '+' : ''}${dashboard.overall_pnl_pct}%` : '',
                        color: pnlC(dashboard?.overall_pnl), iconBg: pnlBg(dashboard?.overall_pnl).replace('border-', 'bg-').split(' ')[0] || 'bg-dark-border'
                    },
                    {
                        icon: <Target className="w-4 h-4" />, label: 'Win Rate', value: dashboard ? `${dashboard.win_rate}%` : '—',
                        sub: dashboard ? `${dashboard.winning_trades}W / ${dashboard.losing_trades}L` : '', color: 'text-amber-400', iconBg: 'bg-amber-500/10'
                    },
                    {
                        icon: <Clock className="w-4 h-4" />, label: 'Total Trades', value: dashboard?.total_trades ?? '—',
                        sub: dashboard ? `${dashboard.open_positions} open` : '', color: 'text-orange-400', iconBg: 'bg-orange-500/10'
                    },
                ].map((card, i) => (
                    <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-dark-text-secondary/30 transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-lg ${card.iconBg} ${card.color}`}>{card.icon}</div>
                            <span className="text-[11px] text-dark-text-secondary uppercase tracking-wider font-medium">{card.label}</span>
                        </div>
                        <div className={`text-lg font-bold ${card.color === 'text-blue-400' || card.color === 'text-purple-400' || card.color === 'text-cyan-400' || card.color === 'text-amber-400' || card.color === 'text-orange-400' ? 'text-dark-text' : card.color}`}>
                            {card.value}
                        </div>
                        {card.sub && <div className={`text-xs mt-0.5 ${card.color}`}>{card.sub}</div>}
                    </div>
                ))}
            </div>

            {/* ═══ REALIZED vs UNREALIZED + BEST/WORST ═══ */}
            {dashboard && (dashboard.realized_pnl !== 0 || dashboard.unrealized_pnl !== 0 || dashboard.best_trade || dashboard.worst_trade) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`rounded-xl p-3 border ${pnlBg(dashboard.realized_pnl)}`}>
                        <div className="text-[11px] text-dark-text-secondary uppercase tracking-wider mb-1">Realized P&L</div>
                        <div className={`text-base font-bold ${pnlC(dashboard.realized_pnl)}`}>{fmt(dashboard.realized_pnl)}</div>
                    </div>
                    <div className={`rounded-xl p-3 border ${pnlBg(dashboard.unrealized_pnl)}`}>
                        <div className="text-[11px] text-dark-text-secondary uppercase tracking-wider mb-1">Unrealized P&L</div>
                        <div className={`text-base font-bold ${pnlC(dashboard.unrealized_pnl)}`}>{fmt(dashboard.unrealized_pnl)}</div>
                    </div>
                    {dashboard.best_trade && (
                        <div className="rounded-xl p-3 border border-emerald-500/20 bg-emerald-500/5">
                            <div className="text-[11px] text-dark-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1"><Award className="w-3 h-3 text-emerald-400" />Best Trade</div>
                            <div className="font-bold text-emerald-400 text-sm">{dashboard.best_trade.symbol}</div>
                            <div className="text-xs text-emerald-400/70">+{fmt(dashboard.best_trade.pnl)} ({dashboard.best_trade.pnl_pct}%)</div>
                        </div>
                    )}
                    {dashboard.worst_trade && (
                        <div className="rounded-xl p-3 border border-red-500/20 bg-red-500/5">
                            <div className="text-[11px] text-dark-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1"><Flame className="w-3 h-3 text-red-400" />Worst Trade</div>
                            <div className="font-bold text-red-400 text-sm">{dashboard.worst_trade.symbol}</div>
                            <div className="text-xs text-red-400/70">{fmt(dashboard.worst_trade.pnl)} ({dashboard.worst_trade.pnl_pct}%)</div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ ACTION BAR ═══ */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-dark-card border border-dark-border rounded-xl p-3">
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowOrderForm(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm">
                        <ShoppingCart className="w-4 h-4" /> New Order
                    </button>
                    <button onClick={loadData} className="p-2.5 bg-dark-bg hover:bg-dark-border text-dark-text-secondary hover:text-dark-text rounded-lg transition-all" title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="flex bg-dark-bg rounded-lg p-1">
                    {[
                        { id: 'positions', label: 'Positions', count: positions.length },
                        { id: 'history', label: 'History', count: tradeHistory.length },
                        { id: 'orders', label: 'Orders', count: orders.length },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveView(tab.id)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === tab.id ? 'bg-blue-accent text-white shadow-md' : 'text-dark-text-secondary hover:text-dark-text'}`}>
                            {tab.label}
                            {tab.count > 0 && <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${activeView === tab.id ? 'bg-white/20' : 'bg-dark-border'}`}>{tab.count}</span>}
                        </button>
                    ))}
                </div>
                <button onClick={handleReset} className="px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
            </div>

            {/* ═══ ORDER FORM MODAL ═══ */}
            {showOrderForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowOrderForm(false)}>
                    <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md shadow-2xl animate-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
                            <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-blue-accent" /> Place Order
                            </h3>
                            <button onClick={() => setShowOrderForm(false)} className="text-dark-text-secondary hover:text-dark-text"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* BUY/SELL Toggle */}
                            <div className="flex bg-dark-bg rounded-xl p-1">
                                {['BUY', 'SELL'].map(t => (
                                    <button key={t} onClick={() => setOrderForm(p => ({ ...p, orderType: t }))}
                                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${orderForm.orderType === t
                                            ? (t === 'BUY' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-red-500 text-white shadow-lg shadow-red-500/30')
                                            : 'text-dark-text-secondary hover:text-dark-text'}`}>{t}</button>
                                ))}
                            </div>

                            {/* Instrument Type Toggle */}
                            <div className="flex bg-dark-bg rounded-xl p-1 gap-1">
                                {['EQUITY', 'OPTION'].map(t => (
                                    <button key={t} onClick={() => setOrderForm(p => ({ ...p, instrumentType: t }))}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${orderForm.instrumentType === t
                                            ? 'bg-blue-accent text-white shadow-md'
                                            : 'text-dark-text-secondary hover:text-dark-text'}`}>{t}</button>
                                ))}
                            </div>
                            {/* Stock Search */}
                            <div className="relative">
                                <label className="text-xs text-dark-text-secondary mb-1 block">Stock Symbol</label>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" />
                                    <input type="text" value={orderForm.symbol || searchTerm}
                                        onChange={(e) => { const v = e.target.value.toUpperCase(); setOrderForm(p => ({ ...p, symbol: v })); setSearchTerm(v); }}
                                        placeholder={orderForm.instrumentType === 'EQUITY' ? "Search RELIANCE, TCS..." : "Enter Option Symbol (e.g. NIFTY24MAR22000CE)"}
                                        className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text placeholder-dark-text-secondary/50 focus:border-blue-accent focus:outline-none transition-all font-semibold text-lg" />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-dark-card border border-dark-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                        {searchResults.map((s, i) => {
                                            const sym = (s.symbol || '').toUpperCase(); const price = analyses[sym]?.price;
                                            return (
                                                <button key={i} onClick={() => selectStock(s)} className="w-full px-4 py-3 text-left hover:bg-dark-border transition-all flex items-center justify-between">
                                                    <div><div className="font-semibold text-dark-text">{sym}</div><div className="text-xs text-dark-text-secondary">{s.name}</div></div>
                                                    {price && <span className="text-sm text-dark-text-secondary">₹{price}</span>}
                                                </button>);
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Option Specific Fields */}
                            {orderForm.instrumentType === 'OPTION' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-dark-text-secondary mb-1 block">Option Type</label>
                                            <div className="flex bg-dark-bg rounded-xl p-1">
                                                {['CE', 'PE'].map(t => (
                                                    <button key={t} onClick={() => setOrderForm(p => ({ ...p, optionType: t }))}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${orderForm.optionType === t
                                                            ? (t === 'CE' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')
                                                            : 'text-dark-text-secondary hover:text-dark-text'}`}>{t}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs text-dark-text-secondary block">Select Strike Price</label>
                                                <span className="text-[10px] text-blue-accent font-bold">Spot: ₹{analyses[orderForm.symbol]?.price || '—'}</span>
                                            </div>
                                            <select
                                                value={orderForm.strikePrice}
                                                onChange={(e) => {
                                                    const selected = optionChain.find(o => o.strike === parseFloat(e.target.value));
                                                    if (selected) {
                                                        setOrderForm(p => ({ ...p, strikePrice: selected.strike, price: parseFloat(selected.premium) }));
                                                    }
                                                }}
                                                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:border-blue-accent focus:outline-none font-semibold text-sm"
                                            >
                                                <option value="">Select Strike</option>
                                                {optionChain.map(o => (
                                                    <option key={o.strike} value={o.strike}>
                                                        {o.strike} {o.isATM ? '— (ATM/Spot)' : ''} (Premium: ₹{o.premium})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-dark-text-secondary mb-1 block">Expiry Date</label>
                                        <input type="text" value={orderForm.expiry}
                                            onChange={e => setOrderForm(p => ({ ...p, expiry: e.target.value }))}
                                            placeholder="e.g. 28-MAR-2024"
                                            className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:border-blue-accent focus:outline-none font-semibold" />
                                    </div>
                                </div>
                            )}
                            {/* Price & Qty */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs text-dark-text-secondary">Price (₹)</label>
                                        <button onClick={() => setPriceType(p => p === 'LIMIT' ? 'MARKET' : 'LIMIT')}
                                            className={`text-[9px] px-1.5 py-0.5 rounded font-black transition-all ${priceType === 'MARKET' ? 'bg-blue-accent text-white' : 'bg-dark-border text-dark-text-secondary hover:text-dark-text'}`}>
                                            {priceType}
                                        </button>
                                    </div>
                                    <input type="number" step="0.05" value={priceType === 'MARKET' ? (analyses[orderForm.symbol]?.price || 0) : orderForm.price}
                                        disabled={priceType === 'MARKET'}
                                        onChange={e => setOrderForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                                        className={`w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:border-blue-accent focus:outline-none font-semibold ${priceType === 'MARKET' ? 'opacity-50' : ''}`} />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs text-dark-text-secondary">Quantity</label>
                                        <span className="text-[9px] text-blue-accent font-bold">Lot: {getLotSize(orderForm.symbol)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => changeQty(-1)}
                                            className="p-3 bg-dark-bg border border-dark-border rounded-l-xl text-dark-text-secondary hover:text-dark-text hover:bg-dark-border transition-all"><Minus className="w-4 h-4" /></button>
                                        <input type="number" min="1" value={orderForm.quantity}
                                            onChange={e => setOrderForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                                            className="w-full px-2 py-3 bg-dark-bg border-y border-dark-border text-dark-text text-center focus:outline-none font-semibold" />
                                        <button onClick={() => changeQty(1)}
                                            className="p-3 bg-dark-bg border border-dark-border rounded-r-xl text-dark-text-secondary hover:text-dark-text hover:bg-dark-border transition-all"><Plus className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                            {/* SL with presets */}
                            <div>
                                <label className="text-xs text-dark-text-secondary mb-1 flex items-center gap-1"><Shield className="w-3 h-3 text-red-400" /> Stop Loss (₹)</label>
                                <div className="flex gap-2">
                                    <input type="number" step="0.05" value={orderForm.stopLoss} onChange={e => setOrderForm(p => ({ ...p, stopLoss: e.target.value }))}
                                        placeholder="Optional" className="flex-1 px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text placeholder-dark-text-secondary/50 focus:border-red-400 focus:outline-none" />
                                    <div className="flex gap-1">
                                        {[2, 5, 10].map(p => (
                                            <button key={p} onClick={() => applySLPreset(p)}
                                                className="px-2 py-1 text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-semibold transition-all whitespace-nowrap">-{p}%</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Target with presets */}
                            <div>
                                <label className="text-xs text-dark-text-secondary mb-1 flex items-center gap-1"><Target className="w-3 h-3 text-emerald-400" /> Target (₹)</label>
                                <div className="flex gap-2">
                                    <input type="number" step="0.05" value={orderForm.target} onChange={e => setOrderForm(p => ({ ...p, target: e.target.value }))}
                                        placeholder="Optional" className="flex-1 px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text placeholder-dark-text-secondary/50 focus:border-emerald-400 focus:outline-none" />
                                    <div className="flex gap-1">
                                        {[5, 10, 20].map(p => (
                                            <button key={p} onClick={() => applyTargetPreset(p)}
                                                className="px-2 py-1 text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg font-semibold transition-all whitespace-nowrap">+{p}%</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Order Summary */}
                            <div className="bg-dark-bg rounded-xl p-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-dark-text-secondary">Total Value</span>
                                    <span className="font-bold text-dark-text">{fmt(orderForm.price * orderForm.quantity)}</span></div>
                                {orderForm.stopLoss && orderForm.price > 0 && (
                                    <div className="flex justify-between"><span className="text-dark-text-secondary">Max Risk</span>
                                        <span className="font-semibold text-red-400">{fmt((orderForm.price - parseFloat(orderForm.stopLoss)) * orderForm.quantity)}
                                            <span className="text-xs ml-1">({(((orderForm.price - parseFloat(orderForm.stopLoss)) / orderForm.price) * 100).toFixed(1)}%)</span></span></div>)}
                                {orderForm.target && orderForm.price > 0 && (
                                    <div className="flex justify-between"><span className="text-dark-text-secondary">Potential Profit</span>
                                        <span className="font-semibold text-emerald-400">{fmt((parseFloat(orderForm.target) - orderForm.price) * orderForm.quantity)}
                                            <span className="text-xs ml-1">({(((parseFloat(orderForm.target) - orderForm.price) / orderForm.price) * 100).toFixed(1)}%)</span></span></div>)}
                                {orderForm.stopLoss && orderForm.target && orderForm.price > parseFloat(orderForm.stopLoss) && (
                                    <div className="flex justify-between border-t border-dark-border pt-2"><span className="text-dark-text-secondary">Risk : Reward</span>
                                        <span className="font-bold text-blue-400">1 : {((parseFloat(orderForm.target) - orderForm.price) / (orderForm.price - parseFloat(orderForm.stopLoss))).toFixed(1)}</span></div>)}
                                {breakEven && (
                                    <div className="flex justify-between border-t border-dark-border pt-2">
                                        <span className="text-dark-text-secondary">Break-Even (at expiry)</span>
                                        <span className="font-bold text-dark-text">₹{breakEven}</span>
                                    </div>
                                )}
                            </div>
                            {orderMessage && (
                                <div className={`text-sm px-4 py-3 rounded-xl ${orderMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {orderMessage.text}</div>)}
                            <button onClick={placeOrder} disabled={orderLoading || !orderForm.symbol}
                                className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all shadow-lg ${orderForm.orderType === 'BUY'
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/20'
                                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/20'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}>
                                {orderLoading ? '⏳ Processing...' : `${orderForm.orderType} ${orderForm.symbol || 'Stock'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ POSITIONS + ALLOCATION SIDE BY SIDE ═══ */}
            {activeView === 'positions' && (
                <div className={`grid gap-4 ${positions.length > 0 ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1'}`}>
                    {/* Positions List */}
                    <div className={`bg-dark-card border border-dark-border rounded-xl overflow-hidden ${positions.length > 0 ? 'xl:col-span-3' : ''}`}>
                        <div className="px-5 py-3 border-b border-dark-border flex items-center justify-between">
                            <h3 className="font-bold text-dark-text flex items-center gap-2 text-sm">
                                <CircleDot className="w-4 h-4 text-blue-accent" /> Open Positions
                                <span className="text-xs bg-blue-accent/20 text-blue-accent px-2 py-0.5 rounded-full">{positions.length}</span>
                            </h3>
                            {positions.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-dark-text-secondary">Sort:</span>
                                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                        className="text-xs bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-dark-text focus:outline-none">
                                        <option value="pnl_pct">P&L %</option><option value="pnl">P&L ₹</option><option value="invested">Invested</option>
                                    </select>
                                    <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} className="text-dark-text-secondary hover:text-dark-text">
                                        {sortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                    </button>
                                </div>
                            )}
                        </div>
                        {positions.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-16 h-16 bg-dark-border/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ShoppingCart className="w-8 h-8 text-dark-text-secondary/40" />
                                </div>
                                <p className="text-dark-text-secondary text-sm font-medium">No open positions</p>
                                <p className="text-dark-text-secondary/50 text-xs mt-1">Click "New Order" to start trading</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-dark-border">
                                {sortedPositions.map((pos) => {
                                    const pnlBar = pos.pnl_pct != null ? Math.min(Math.abs(pos.pnl_pct), 100) : 0;
                                    return (
                                        <div key={pos.symbol} className="px-5 py-4 hover:bg-dark-bg/30 transition-all group">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <button onClick={() => onStockClick?.(pos.symbol)} className="font-bold text-dark-text hover:text-blue-accent transition-colors">{pos.symbol}</button>
                                                        {pos.instrument_type === 'OPTION' && (
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${pos.option_type === 'CE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                {pos.option_type}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] bg-blue-accent/10 text-blue-accent px-2 py-0.5 rounded-full font-medium">{pos.quantity} qty</span>
                                                    </div>
                                                    {pos.instrument_type === 'OPTION' && (
                                                        <div className="text-[10px] text-dark-text-secondary mb-1 flex gap-2">
                                                            <span>Strike: <span className="text-dark-text">{pos.strike_price}</span></span>
                                                            {pos.expiry && <span>Expiry: <span className="text-dark-text">{pos.expiry}</span></span>}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3 text-xs text-dark-text-secondary">
                                                        <span>Avg <span className="text-dark-text font-medium">{fmt(pos.avg_price)}</span></span>
                                                        <span>LTP <span className="text-dark-text font-medium">{pos.current_price ? fmt(pos.current_price) : '—'}</span></span>
                                                        <span>Inv <span className="text-dark-text font-medium">{fmt(pos.invested)}</span></span>
                                                    </div>
                                                    {/* P&L Progress Bar */}
                                                    {pos.pnl_pct != null && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all duration-500 ${pos.pnl_pct >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                                    style={{ width: `${pnlBar}%` }} />
                                                            </div>
                                                            <span className={`text-[10px] font-semibold ${pnlC(pos.pnl_pct)}`}>{pos.pnl_pct >= 0 ? '+' : ''}{pos.pnl_pct}%</span>
                                                        </div>
                                                    )}
                                                    {/* SL/Target */}
                                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                        {editingPosition === pos.symbol ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <input type="number" step="0.05" value={editSL} onChange={e => setEditSL(e.target.value)} placeholder="SL"
                                                                    className="w-20 px-2 py-1 bg-dark-bg border border-red-500/30 rounded text-xs text-dark-text focus:outline-none" />
                                                                <input type="number" step="0.05" value={editTarget} onChange={e => setEditTarget(e.target.value)} placeholder="Target"
                                                                    className="w-20 px-2 py-1 bg-dark-bg border border-emerald-500/30 rounded text-xs text-dark-text focus:outline-none" />
                                                                <button onClick={() => handleUpdateSLTarget(pos.symbol)} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"><Check className="w-3.5 h-3.5" /></button>
                                                                <button onClick={() => setEditingPosition(null)} className="p-1 text-dark-text-secondary hover:bg-dark-border rounded"><X className="w-3.5 h-3.5" /></button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {pos.stop_loss && (
                                                                    <span className="flex items-center gap-1 text-[11px]">
                                                                        <Shield className="w-3 h-3 text-red-400" />
                                                                        <span className="text-red-400 font-medium">SL: {fmt(pos.stop_loss)}</span>
                                                                        {pos.sl_status && <span className={`px-1 py-0.5 rounded text-[9px] font-semibold ${pos.sl_status === 'HIT' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-dark-bg text-dark-text-secondary'}`}>{pos.sl_status}</span>}
                                                                    </span>
                                                                )}
                                                                {pos.target && (
                                                                    <span className="flex items-center gap-1 text-[11px]">
                                                                        <Target className="w-3 h-3 text-emerald-400" />
                                                                        <span className="text-emerald-400 font-medium">TGT: {fmt(pos.target)}</span>
                                                                        {pos.target_status && <span className={`px-1 py-0.5 rounded text-[9px] font-semibold ${pos.target_status === 'HIT' ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-dark-bg text-dark-text-secondary'}`}>{pos.target_status}</span>}
                                                                    </span>
                                                                )}
                                                                <button onClick={() => { setEditingPosition(pos.symbol); setEditSL(pos.stop_loss || ''); setEditTarget(pos.target || ''); }}
                                                                    className="p-1 text-dark-text-secondary hover:text-blue-accent hover:bg-dark-border rounded transition-all opacity-0 group-hover:opacity-100"><Edit3 className="w-3 h-3" /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* P&L + Actions */}
                                                <div className="text-right ml-3 flex items-center gap-3">
                                                    <div>
                                                        <div className={`text-base font-bold ${pnlC(pos.pnl)}`}>{pos.pnl != null ? fmt(pos.pnl) : '—'}</div>
                                                        {pos.current_value != null && <div className="text-[10px] text-dark-text-secondary">{fmt(pos.current_value)}</div>}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <button onClick={() => { setOrderForm({ symbol: pos.symbol, orderType: 'BUY', quantity: 1, price: pos.current_price || pos.avg_price, stopLoss: '', target: '' }); setShowOrderForm(true); }}
                                                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-semibold transition-all">ADD</button>
                                                        <button onClick={() => handleExit(pos.symbol, pos.current_price || pos.avg_price)}
                                                            className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] font-semibold transition-all">EXIT</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Allocation Chart */}
                    {positions.length > 0 && (
                        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                            <h4 className="text-sm font-bold text-dark-text flex items-center gap-2 mb-4"><PieChart className="w-4 h-4 text-purple-400" /> Allocation</h4>
                            {/* Simple CSS Donut */}
                            <div className="relative w-32 h-32 mx-auto mb-4">
                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                    {holdingsAllocation.reduce((acc, h, i) => {
                                        const offset = acc.offset;
                                        acc.elements.push(
                                            <circle key={i} cx="18" cy="18" r="15.92" fill="none" stroke={h.color} strokeWidth="3"
                                                strokeDasharray={`${h.pct} ${100 - h.pct}`} strokeDashoffset={`-${offset}`} className="transition-all duration-500" />
                                        );
                                        acc.offset += parseFloat(h.pct);
                                        return acc;
                                    }, { elements: [], offset: 0 }).elements}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <div className="text-lg font-bold text-dark-text">{positions.length}</div>
                                    <div className="text-[9px] text-dark-text-secondary">stocks</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {holdingsAllocation.map(h => (
                                    <div key={h.symbol} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: h.color }} />
                                            <span className="text-dark-text font-medium">{h.symbol}</span>
                                        </div>
                                        <span className="text-dark-text-secondary">{h.pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ TRADE HISTORY ═══ */}
            {activeView === 'history' && (
                <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-dark-border">
                        <h3 className="font-bold text-dark-text flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-purple-400" /> Trade History
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{tradeHistory.length}</span></h3>
                    </div>
                    {tradeHistory.length === 0 ? (
                        <div className="py-16 text-center"><Clock className="w-10 h-10 text-dark-text-secondary/30 mx-auto mb-3" /><p className="text-dark-text-secondary text-sm">No trade history yet</p></div>
                    ) : (
                        <div className="overflow-x-auto"><table className="w-full"><thead>
                            <tr className="text-[11px] text-dark-text-secondary border-b border-dark-border uppercase tracking-wider">
                                <th className="px-4 py-3 text-left">Symbol</th><th className="px-4 py-3 text-right">Qty</th>
                                <th className="px-4 py-3 text-right">Buy</th><th className="px-4 py-3 text-right">Sell</th>
                                <th className="px-4 py-3 text-right">P&L</th><th className="px-4 py-3 text-right">P&L %</th>
                                <th className="px-4 py-3 text-center">Reason</th><th className="px-4 py-3 text-right">Date</th>
                            </tr></thead><tbody className="divide-y divide-dark-border">
                                {tradeHistory.map((t, i) => (
                                    <tr key={t.id || i} className="hover:bg-dark-bg/30 transition-all text-sm">
                                        <td className="px-4 py-3 font-semibold text-dark-text">{t.symbol}</td>
                                        <td className="px-4 py-3 text-right text-dark-text-secondary">{t.quantity}</td>
                                        <td className="px-4 py-3 text-right text-dark-text-secondary">{fmt(t.buy_price)}</td>
                                        <td className="px-4 py-3 text-right text-dark-text-secondary">{fmt(t.sell_price)}</td>
                                        <td className={`px-4 py-3 text-right font-semibold ${pnlC(t.pnl)}`}>{fmt(t.pnl)}</td>
                                        <td className={`px-4 py-3 text-right font-semibold ${pnlC(t.pnl_pct)}`}>{t.pnl_pct >= 0 ? '+' : ''}{t.pnl_pct}%</td>
                                        <td className="px-4 py-3 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${t.exit_reason === 'SL_HIT' ? 'bg-red-500/20 text-red-400' : t.exit_reason === 'TARGET_HIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-dark-border text-dark-text-secondary'}`}>{t.exit_reason}</span></td>
                                        <td className="px-4 py-3 text-right text-xs text-dark-text-secondary">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                    </tr>))}
                            </tbody></table></div>
                    )}
                </div>
            )}

            {/* ═══ ORDERS ═══ */}
            {activeView === 'orders' && (
                <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-dark-border">
                        <h3 className="font-bold text-dark-text flex items-center gap-2 text-sm"><BarChart3 className="w-4 h-4 text-cyan-400" /> Order Book
                            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">{orders.length}</span></h3>
                    </div>
                    {orders.length === 0 ? (
                        <div className="py-16 text-center"><BarChart3 className="w-10 h-10 text-dark-text-secondary/30 mx-auto mb-3" /><p className="text-dark-text-secondary text-sm">No orders yet</p></div>
                    ) : (
                        <div className="overflow-x-auto"><table className="w-full"><thead>
                            <tr className="text-[11px] text-dark-text-secondary border-b border-dark-border uppercase tracking-wider">
                                <th className="px-4 py-3 text-left">Time</th><th className="px-4 py-3 text-left">Symbol</th>
                                <th className="px-4 py-3 text-center">Type</th><th className="px-4 py-3 text-right">Qty</th>
                                <th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Value</th>
                                <th className="px-4 py-3 text-right">SL</th><th className="px-4 py-3 text-right">Target</th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr></thead><tbody className="divide-y divide-dark-border">
                                {orders.map((o, i) => (
                                    <tr key={o.id || i} className="hover:bg-dark-bg/30 transition-all text-sm">
                                        <td className="px-4 py-3 text-xs text-dark-text-secondary">{new Date(o.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="px-4 py-3 font-semibold text-dark-text">{o.symbol}</td>
                                        <td className="px-4 py-3 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${o.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{o.type}</span></td>
                                        <td className="px-4 py-3 text-right text-dark-text-secondary">{o.quantity}</td>
                                        <td className="px-4 py-3 text-right text-dark-text">{fmt(o.price)}</td>
                                        <td className="px-4 py-3 text-right text-dark-text font-medium">{fmt(o.total_value)}</td>
                                        <td className="px-4 py-3 text-right text-xs text-red-400">{o.stop_loss ? fmt(o.stop_loss) : '—'}</td>
                                        <td className="px-4 py-3 text-right text-xs text-emerald-400">{o.target ? fmt(o.target) : '—'}</td>
                                        <td className="px-4 py-3 text-center"><span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">{o.status}</span></td>
                                    </tr>))}
                            </tbody></table></div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TradingPanel;
