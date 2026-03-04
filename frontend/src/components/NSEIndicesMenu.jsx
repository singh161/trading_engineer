import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Zap, BarChart2, TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, Loader2, ChevronDown } from 'lucide-react';

// All the indices options
const INDICES_LIST = [
    ["NIFTY 50", "NIFTY 50"],
    ["NIFTY BANK", "NIFTY BANK"],
    ["NIFTY COMMODITIES", "NIFTY COMMODITIES"],
    ["NIFTY CONSUMPTION", "NIFTY INDIA CONSUMPTION"],
    ["NIFTY DIV OPPS 50", "NIFTY DIVIDEND OPPORTUNITIES 50"],
    ["NIFTY ENERGY", "NIFTY ENERGY"],
    ["NIFTY FIN SERVICE", "NIFTY FINANCIAL SERVICES"],
    ["NIFTY FMCG", "NIFTY FMCG"],
    ["NIFTY GROWSECT 15", "NIFTY GROWTH SECTORS 15"],
    ["NIFTY INFRA", "NIFTY INFRASTRUCTURE"],
    ["NIFTY IT", "NIFTY IT"],
    ["NIFTY MEDIA", "NIFTY MEDIA"],
    ["NIFTY METAL", "NIFTY METAL"],
    ["NIFTY MIDCAP 100", "NIFTY MIDCAP 100"],
    ["NIFTY MIDCAP 150", "NIFTY MIDCAP 150"],
    ["NIFTY MID LIQ 15", "NIFTY MIDCAP LIQUID 15"],
    ["NIFTY MIDSML 400", "NIFTY MIDSMALLCAP 400"],
    ["NIFTY M150 QLTY50", "NIFTY MIDCAP150 QUALITY 50"],
    ["NIFTY INDIA MFG", "NIFTY INDIA MANUFACTURING"],
    ["NIFTY200 ALPHA 30", "NIFTY200 ALPHA 30"],
    ["NIFTYM150MOMNTM50", "NIFTY MIDCAP150 MOMENTUM 50"],
    ["NIFTY MIDSML HLTH", "NIFTY MIDSMALL HEALTHCARE"],
    ["NIFTY IND DEFENCE", "NIFTY INDIA DEFENCE"],
    ["NIFTY IND TOURISM", "NIFTY INDIA TOURISM"],
    ["NIFTY CAPITAL MKT", "NIFTY CAPITAL MARKETS"],
    ["NIFTY500MOMENTM50", "NIFTY500 MOMENTUM 50"],
    ["NIFTY AQLV 30", "NIFTY ALPHA QUALITY VALUE LOW-VOLATILITY 30"],
    ["NIFTY 100", "NIFTY 100"],
    ["NIFTY 200", "NIFTY 200"],
    ["NIFTY 500", "NIFTY 500"],
    ["NIFTY ALPHA 50", "NIFTY ALPHA 50"],
    ["NIFTY AUTO", "NIFTY AUTO"],
    ["NIFTY CPSE", "NIFTY CPSE"],
    ["NIFTY MIDCAP 50", "NIFTY MIDCAP 50"],
    ["NIFTY SMLCAP 250", "NIFTY SMALLCAP 250"],
    ["INDIA VIX", "INDIA VIX"],
    ["NIFTY LARGEMID250", "NIFTY LARGEMIDCAP 250"],
    ["NIFTY TOP 10 EW", "NIFTY TOP 10 EQUAL WEIGHT"],
    ["NIFTY AQL 30", "NIFTY ALPHA QUALITY LOW-VOLATILITY 30"],
    ["NIFTY SML250 Q50", "NIFTY SMALLCAP250 QUALITY 50"],
    ["NIFTY COREHOUSING", "NIFTY CORE HOUSING"],
    ["NIFTY TRANS LOGIS", "NIFTY TRANSPORTATION & LOGISTICS"],
    ["NIFTY500 QLTY50", "NIFTY500 QUALITY 50"],
    ["NIFTY500 LOWVOL50", "NIFTY500 LOW VOLATILITY 50"],
    ["NIFTY MNC", "NIFTY MNC"],
    ["NIFTY NEXT 50", "NIFTY NEXT 50"],
    ["NIFTY PHARMA", "NIFTY PHARMA"],
    ["NIFTY PSE", "NIFTY PSE"],
    ["NIFTY PSU BANK", "NIFTY PSU BANK"],
    ["NIFTY PVT BANK", "NIFTY PRIVATE BANK"],
    ["NIFTY REALTY", "NIFTY REALTY"],
    ["NIFTY SERV SECTOR", "NIFTY SERVICES SECTOR"],
    ["NIFTY SMLCAP 100", "NIFTY SMALLCAP 100"],
    ["NIFTY SMLCAP 50", "NIFTY SMALLCAP 50"],
    ["NIFTY100 EQL WGT", "NIFTY100 EQUAL WEIGHT"],
    ["NIFTY100 LIQ 15", "NIFTY100 LIQUID 15"],
    ["NIFTY100 LOWVOL30", "NIFTY100 LOW VOLATILITY 30"],
    ["NIFTY100 QUALTY30", "NIFTY100 QUALITY 30"],
    ["NIFTY200 QUALTY30", "NIFTY200 QUALITY 30"],
    ["NIFTY50 EQL WGT", "NIFTY50 EQUAL WEIGHT"],
    ["NIFTY50 VALUE 20", "NIFTY50 VALUE 20"],
    ["NIFTY ALPHALOWVOL", "NIFTY ALPHA LOW-VOLATILITY 30"],
    ["NIFTY FINSRV25 50", "NIFTY FINANCIAL SERVICES 25/50"],
    ["NIFTY200MOMENTM30", "NIFTY200 MOMENTUM 30"],
    ["NIFTY CONSR DURBL", "NIFTY CONSUMER DURABLES"],
    ["NIFTY OIL AND GAS", "NIFTY OIL & GAS"],
    ["NIFTY HEALTHCARE", "NIFTY HEALTHCARE INDEX"],
    ["NIFTY500 MULTICAP", "NIFTY500 MULTICAP 50:25:25"],
    ["NIFTY MID SELECT", "NIFTY MIDCAP SELECT"],
    ["NIFTY TOTAL MKT", "NIFTY TOTAL MARKET"],
    ["NIFTY MICROCAP250", "NIFTY MICROCAP 250"],
    ["NIFTY IND DIGITAL", "NIFTY INDIA DIGITAL"],
    ["NIFTY EV", "NIFTY EV & NEW AGE AUTOMOTIVE"],
    ["NIFTY HIGHBETA 50", "NIFTY HIGH BETA 50"],
    ["NIFTY LOW VOL 50", "NIFTY LOW VOLATILITY 50"],
    ["NIFTY CHEMICALS", "NIFTY CHEMICALS"],
    ["NIFTY RAILWAYSPSU", "NIFTY INDIA RAILWAYS PSU"],
    ["NIFTYCONGLOMERATE", "NIFTY CONGLOMERATE 50"],
    ["Securities in F&O", "SECURITIES IN F&O"],
    ["Permitted to Trade", "PERMITTED TO TRADE"],
];

// Verdict badge
const VerdictBadge = ({ verdict }) => {
    if (!verdict) return <span className="text-dark-text-secondary text-xs">—</span>;
    const map = {
        'STRONG BUY': { cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '🚀' },
        'BUY': { cls: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '📈' },
        'NEUTRAL': { cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: '➖' },
        'SELL': { cls: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '📉' },
        'STRONG SELL': { cls: 'bg-rose-600/20 text-rose-400 border-rose-500/30', icon: '🔻' },
    };
    const style = map[verdict] || map['NEUTRAL'];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black tracking-wide ${style.cls}`}>
            {style.icon} {verdict}
        </span>
    );
};

const NSEIndicesMenu = () => {
    const [selectedIndex, setSelectedIndex] = useState("NIFTY 50");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Analysis state
    const [analyses, setAnalyses] = useState({}); // { symbol: analysisResult }
    const [analyzing, setAnalyzing] = useState(false);
    const [analyzeProgress, setAnalyzeProgress] = useState({ done: 0, total: 0 });
    const [analyzeMode, setAnalyzeMode] = useState('swing');
    const cancelRef = useRef(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Fetch index constituents
    useEffect(() => {
        const fetchIndexData = async () => {
            setLoading(true);
            setError(null);
            setAnalyses({});
            setAnalyzeProgress({ done: 0, total: 0 });
            try {
                const url = `${API_BASE_URL}/market-index-constituents?index=${encodeURIComponent(selectedIndex)}`;
                const response = await axios.get(url);
                setData(response.data);
            } catch (err) {
                console.error("API fetching error:", err);
                setError("Could not fetch data. NSE CORS protection ya rate limits ho sakti hai.");
            } finally {
                setLoading(false);
            }
        };
        if (selectedIndex) fetchIndexData();
    }, [selectedIndex]);

    // ── Total Analysis ──
    const handleTotalAnalyze = async () => {
        if (!data?.data || analyzing) return;

        // Extract valid symbols (filter out index rows, bonds, etc.)
        const symbols = data.data
            .map(s => s.symbol?.trim())
            .filter(s => s && /^[A-Z0-9&\-\.]{1,20}$/.test(s) && !s.includes(' '));

        if (symbols.length === 0) return;

        cancelRef.current = false;
        setAnalyzing(true);
        setAnalyses({});
        setAnalyzeProgress({ done: 0, total: symbols.length });

        const CHUNK_SIZE = 5; // Process 5 at a time to avoid overwhelming backend

        for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
            if (cancelRef.current) break;

            const chunk = symbols.slice(i, i + CHUNK_SIZE);

            try {
                const res = await axios.post(
                    `${API_BASE_URL}/analyze/batch-chunked?mode=${analyzeMode}&chunk_size=${CHUNK_SIZE}`,
                    chunk
                );

                const results = res.data?.results || [];
                const newBatch = {};
                results.forEach(r => {
                    if (r?.symbol) newBatch[r.symbol] = r;
                });

                setAnalyses(prev => ({ ...prev, ...newBatch }));
                setAnalyzeProgress(prev => ({
                    done: Math.min(prev.done + chunk.length, symbols.length),
                    total: symbols.length
                }));
            } catch (err) {
                console.error(`Chunk ${i}-${i + CHUNK_SIZE} error:`, err);
                // Continue with next chunk even on error
                setAnalyzeProgress(prev => ({
                    done: Math.min(prev.done + chunk.length, symbols.length),
                    total: symbols.length
                }));
            }

            // Small delay between chunks (rate limit protection)
            if (i + CHUNK_SIZE < symbols.length) {
                await new Promise(r => setTimeout(r, 600));
            }
        }

        setAnalyzing(false);
    };

    const handleCancelAnalyze = () => {
        cancelRef.current = true;
        setAnalyzing(false);
    };

    // Summary counts from analysis
    const analysisSummary = Object.values(analyses).reduce((acc, a) => {
        const v = a?.final_verdict || '';
        if (v === 'STRONG BUY') acc.strongBuy++;
        else if (v === 'BUY') acc.buy++;
        else if (v === 'STRONG SELL') acc.strongSell++;
        else if (v === 'SELL') acc.sell++;
        else if (v === 'NEUTRAL') acc.neutral++;
        return acc;
    }, { strongBuy: 0, buy: 0, neutral: 0, sell: 0, strongSell: 0 });
    const totalAnalyzed = Object.keys(analyses).length;
    const progressPct = analyzeProgress.total > 0 ? Math.round((analyzeProgress.done / analyzeProgress.total) * 100) : 0;

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight italic">
                        <span className="text-2xl">📊</span> Real-Time Indices Menu
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">NSE Index select karein aur sab stocks analyze karein</p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Mode selector */}
                    <div className="relative">
                        <select
                            value={analyzeMode}
                            onChange={e => setAnalyzeMode(e.target.value)}
                            disabled={analyzing}
                            className="appearance-none bg-white/5 border border-white/10 rounded-xl text-slate-300 text-xs font-bold px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:opacity-50"
                        >
                            <option value="intraday">⚡ Intraday</option>
                            <option value="swing">📈 Swing</option>
                            <option value="longterm">🏔️ Longterm</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Index Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedIndex}
                            onChange={(e) => setSelectedIndex(e.target.value)}
                            disabled={analyzing}
                            className="appearance-none bg-white/5 border border-white/10 rounded-xl text-slate-300 px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full sm:w-64 font-medium text-sm cursor-pointer disabled:opacity-50"
                        >
                            {INDICES_LIST.map((item, idx) => (
                                <option className="bg-[#1e293b] text-slate-200" key={idx} value={item[0]}>
                                    {item[1]}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Total Analyze Button */}
                    {!analyzing ? (
                        <button
                            onClick={handleTotalAnalyze}
                            disabled={!data?.data || loading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black text-sm rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-200 active:scale-95"
                        >
                            <Zap className="w-4 h-4" />
                            Total Analyze
                        </button>
                    ) : (
                        <button
                            onClick={handleCancelAnalyze}
                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600/20 border border-rose-500/40 hover:bg-rose-600/30 text-rose-400 font-black text-sm rounded-xl transition-all"
                        >
                            <XCircle className="w-4 h-4" />
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* ── Progress Bar (while analyzing) ── */}
            {(analyzing || (totalAnalyzed > 0 && analyzeProgress.total > 0)) && (
                <div className="bg-[#0f172a]/95 border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {analyzing
                                ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                : <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            }
                            <span className="text-sm font-bold text-slate-200">
                                {analyzing
                                    ? `Analyzing... ${analyzeProgress.done} / ${analyzeProgress.total} stocks`
                                    : `Analysis Complete — ${totalAnalyzed} stocks analyzed`
                                }
                            </span>
                        </div>
                        <span className="text-xs font-black text-blue-400">{progressPct}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>

                    {/* Summary counts */}
                    {totalAnalyzed > 0 && (
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            {[
                                { label: 'Strong Buy', val: analysisSummary.strongBuy, cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                                { label: 'Buy', val: analysisSummary.buy, cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
                                { label: 'Neutral', val: analysisSummary.neutral, cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
                                { label: 'Sell', val: analysisSummary.sell, cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
                                { label: 'Strong Sell', val: analysisSummary.strongSell, cls: 'bg-rose-600/20 text-rose-400 border-rose-500/30' },
                            ].map(item => (
                                <span key={item.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-black ${item.cls}`}>
                                    {item.label}: <strong>{item.val}</strong>
                                </span>
                            ))}
                            <span className="ml-auto text-[10px] text-slate-500 font-bold">
                                Bull: {Math.round(((analysisSummary.strongBuy + analysisSummary.buy) / totalAnalyzed) * 100)}% |
                                Bear: {Math.round(((analysisSummary.strongSell + analysisSummary.sell) / totalAnalyzed) * 100)}%
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    <span className="ml-4 font-semibold text-slate-300">Fetching Index Data...</span>
                </div>
            )}

            {/* ── Error ── */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <h3 className="font-bold text-red-400">Data Fetch Error</h3>
                        <p className="text-slate-300 text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* ── Constituents Table ── */}
            {!loading && !error && data?.data && (
                <div className="bg-[#0f172a]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
                    {/* Table header */}
                    <div className="p-4 border-b border-white/5 flex flex-wrap justify-between items-center gap-3 bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <BarChart2 className="w-5 h-5 text-blue-400" />
                            <span className="font-black text-white">{data.name}</span>
                            <span className="text-slate-500 text-sm">Constituents</span>
                            <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-black border border-blue-500/20">
                                {data.data.length} Stocks
                            </span>
                        </div>
                        <span className="text-xs text-slate-500 font-bold">Updated: {data.timestamp || 'Live'}</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300 whitespace-nowrap">
                            <thead className="bg-white/[0.03] text-slate-500 text-[10px] uppercase tracking-widest font-black">
                                <tr>
                                    <th className="px-5 py-3">#</th>
                                    <th className="px-5 py-3">Symbol</th>
                                    <th className="px-5 py-3 text-right">Open</th>
                                    <th className="px-5 py-3 text-right">High</th>
                                    <th className="px-5 py-3 text-right">Low</th>
                                    <th className="px-5 py-3 text-right">LTP</th>
                                    <th className="px-5 py-3 text-right">Chng</th>
                                    <th className="px-5 py-3 text-right">% Chng</th>
                                    <th className="px-5 py-3 text-right">Volume</th>
                                    {/* Analysis columns */}
                                    <th className="px-5 py-3 text-center">Verdict</th>
                                    <th className="px-5 py-3 text-center">RSI</th>
                                    <th className="px-5 py-3 text-center">Buy/Sell Sig</th>
                                    <th className="px-5 py-3 text-center">Trend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {data.data.map((stock, idx) => {
                                    const analysis = analyses[stock.symbol];
                                    const isAnalyzed = !!analysis && !analysis.error;
                                    const isAnalyzing = analyzing;

                                    const rsi = analysis?.rsi;
                                    const rsiColor = rsi < 35 ? 'text-emerald-400' : rsi > 65 ? 'text-rose-400' : 'text-sky-400';

                                    const trendIcon = analysis?.trend === 'UP'
                                        ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        : analysis?.trend === 'DOWN'
                                            ? <TrendingDown className="w-4 h-4 text-rose-400" />
                                            : <Minus className="w-4 h-4 text-slate-500" />;

                                    return (
                                        <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-5 py-3 text-slate-600 text-xs">{idx + 1}</td>
                                            <td className="px-5 py-3 font-black text-blue-400 group-hover:text-blue-300">
                                                {stock.symbol}
                                            </td>
                                            <td className="px-5 py-3 text-right text-slate-400">{stock.open?.toLocaleString() || '—'}</td>
                                            <td className="px-5 py-3 text-right text-emerald-400 font-bold">{stock.dayHigh?.toLocaleString() || '—'}</td>
                                            <td className="px-5 py-3 text-right text-rose-400 font-bold">{stock.dayLow?.toLocaleString() || '—'}</td>
                                            <td className="px-5 py-3 text-right font-black text-white">{stock.lastPrice?.toLocaleString() || '—'}</td>
                                            <td className={`px-5 py-3 text-right font-bold ${stock.change > 0 ? 'text-emerald-400' : stock.change < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {stock.change > 0 ? '+' : ''}{stock.change?.toLocaleString() || '—'}
                                            </td>
                                            <td className={`px-5 py-3 text-right font-bold ${stock.pChange > 0 ? 'text-emerald-400' : stock.pChange < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {stock.pChange > 0 ? '+' : ''}{stock.pChange}%
                                            </td>
                                            <td className="px-5 py-3 text-right text-slate-500">
                                                {stock.totalTradedVolume?.toLocaleString() || '—'}
                                            </td>

                                            {/* Analysis columns */}
                                            <td className="px-5 py-3 text-center">
                                                {isAnalyzed
                                                    ? <VerdictBadge verdict={analysis.final_verdict} />
                                                    : isAnalyzing
                                                        ? <Loader2 className="w-3 h-3 text-blue-400/40 animate-spin mx-auto" />
                                                        : <span className="text-slate-700 text-xs">—</span>
                                                }
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {isAnalyzed && rsi
                                                    ? <span className={`text-xs font-black ${rsiColor}`}>{rsi.toFixed(1)}</span>
                                                    : <span className="text-slate-700 text-xs">—</span>
                                                }
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {isAnalyzed
                                                    ? (
                                                        <span className="text-xs font-bold">
                                                            <span className="text-emerald-400">B:{analysis.buy_count}</span>
                                                            <span className="text-slate-600 mx-1">/</span>
                                                            <span className="text-rose-400">S:{analysis.sell_count}</span>
                                                        </span>
                                                    )
                                                    : <span className="text-slate-700 text-xs">—</span>
                                                }
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {isAnalyzed
                                                    ? <div className="flex justify-center">{trendIcon}</div>
                                                    : <span className="text-slate-700 text-xs">—</span>
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NSEIndicesMenu;
