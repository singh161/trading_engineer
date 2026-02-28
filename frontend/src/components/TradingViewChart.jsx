import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PERIODS = [
    { label: '1D', period: '1d', mode: 'intraday', interval: '15m' },
    { label: '1M', period: '1mo', mode: 'swing' },
    { label: '3M', period: '3mo', mode: 'swing' },
    { label: '6M', period: '6mo', mode: 'swing' },
    { label: '1Y', period: '1y', mode: 'longterm' },
    { label: '5Y', period: '5y', mode: 'longterm' },
];

/**
 * Self-hosted Stock Chart using Lightweight Charts v5
 * No TradingView restrictions — works with all NSE stocks
 */
function TradingViewChart({ symbol, height = 500 }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);
    const ema20SeriesRef = useRef(null);
    const ema50SeriesRef = useRef(null);

    const [activePeriod, setActivePeriod] = useState('6M');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stockInfo, setStockInfo] = useState(null);

    // Calculate EMA from candle data
    const calculateEMA = useCallback((candles, period) => {
        const k = 2 / (period + 1);
        const emaData = [];
        let ema = candles[0]?.close || 0;

        for (let i = 0; i < candles.length; i++) {
            if (i === 0) {
                ema = candles[i].close;
            } else {
                ema = candles[i].close * k + ema * (1 - k);
            }
            if (i >= period - 1) {
                emaData.push({ time: candles[i].time, value: Math.round(ema * 100) / 100 });
            }
        }
        return emaData;
    }, []);

    // Fetch chart data
    const fetchData = useCallback(async (periodConfig) => {
        try {
            setLoading(true);
            setError(null);
            const params = { mode: periodConfig.mode };
            if (periodConfig.period) params.period = periodConfig.period;
            if (periodConfig.interval) params.interval = periodConfig.interval;

            const res = await axios.get(`${API_BASE}/api/chart-data/${symbol}`, { params });
            const { candles, volumes } = res.data;

            if (!candles || candles.length === 0) {
                setError('No data available');
                return;
            }

            // Set candle data
            if (candleSeriesRef.current) {
                candleSeriesRef.current.setData(candles);
            }

            // Set volume data
            if (volumeSeriesRef.current) {
                volumeSeriesRef.current.setData(volumes);
            }

            // Calculate and set EMAs
            if (ema20SeriesRef.current && candles.length >= 20) {
                ema20SeriesRef.current.setData(calculateEMA(candles, 20));
            }
            if (ema50SeriesRef.current && candles.length >= 50) {
                ema50SeriesRef.current.setData(calculateEMA(candles, 50));
            }

            // Update timeScale for intraday vs daily
            const isIntraday = periodConfig.mode === 'intraday';
            if (chartRef.current) {
                chartRef.current.timeScale().applyOptions({
                    timeVisible: true,
                    secondsVisible: false,
                    barSpacing: isIntraday ? 6 : 8,
                });
                chartRef.current.timeScale().fitContent();
            }

            // Stock info for header
            const last = candles[candles.length - 1];
            const prev = candles.length > 1 ? candles[candles.length - 2] : last;
            const change = last.close - prev.close;
            const changePct = prev.close ? (change / prev.close * 100) : 0;
            setStockInfo({
                price: last.close,
                change,
                changePct,
                high: last.high,
                low: last.low,
                open: last.open,
            });

        } catch (err) {
            console.error('Chart data error:', err);
            setError('Failed to load chart data');
        } finally {
            setLoading(false);
        }
    }, [symbol, calculateEMA]);

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Clear any existing chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const chartHeight = height - 60;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartHeight > 0 ? chartHeight : 400,
            layout: {
                background: { color: 'transparent' },
                textColor: '#8b95a5',
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: 11,
            },
            grid: {
                vertLines: { color: 'rgba(255,255,255,0.03)' },
                horzLines: { color: 'rgba(255,255,255,0.03)' },
            },
            crosshair: {
                vertLine: {
                    color: 'rgba(99,133,255,0.3)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#2962FF',
                },
                horzLine: {
                    color: 'rgba(99,133,255,0.3)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#2962FF',
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(255,255,255,0.06)',
                scaleMargins: { top: 0.1, bottom: 0.25 },
            },
            timeScale: {
                borderColor: 'rgba(255,255,255,0.06)',
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 5,
                barSpacing: 8,
                minBarSpacing: 4,
                fixLeftEdge: true,
                fixRightEdge: true,
            },
        });

        chartRef.current = chart;

        // Candlestick series (v5 API)
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderUpColor: '#26a69a',
            borderDownColor: '#ef5350',
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });
        candleSeriesRef.current = candleSeries;

        // Volume series (v5 API)
        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });
        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });
        volumeSeriesRef.current = volumeSeries;

        // EMA 20 line (v5 API)
        const ema20 = chart.addSeries(LineSeries, {
            color: '#2962FF',
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });
        ema20SeriesRef.current = ema20;

        // EMA 50 line (v5 API)
        const ema50 = chart.addSeries(LineSeries, {
            color: '#FF6D00',
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });
        ema50SeriesRef.current = ema50;

        // Resize observer
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0] && chartRef.current) {
                const { width } = entries[0].contentRect;
                chartRef.current.applyOptions({ width });
            }
        });
        resizeObserver.observe(chartContainerRef.current);

        // Load initial data
        const initialPeriod = PERIODS.find(p => p.label === activePeriod) || PERIODS[2];
        fetchData(initialPeriod);

        return () => {
            resizeObserver.disconnect();
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [symbol]);

    // Handle period change
    const handlePeriodChange = (period) => {
        setActivePeriod(period.label);
        fetchData(period);
    };

    return (
        <div style={{ height: `${height}px`, width: '100%' }} className="flex flex-col bg-[#0d1117] rounded-2xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">NSE:{symbol}</span>
                        {stockInfo && (
                            <>
                                <span className="text-sm font-bold text-white">₹{stockInfo.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                <span className={`text-xs font-bold ${stockInfo.change >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                                    {stockInfo.change >= 0 ? '+' : ''}{stockInfo.change.toFixed(2)} ({stockInfo.changePct.toFixed(2)}%)
                                </span>
                            </>
                        )}
                    </div>
                    {/* EMA Legend */}
                    <div className="hidden md:flex items-center gap-3 ml-4">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#8b95a5]">
                            <span className="w-3 h-[2px] bg-[#2962FF] rounded-full inline-block"></span> EMA 20
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#8b95a5]">
                            <span className="w-3 h-[2px] bg-[#FF6D00] rounded-full inline-block"></span> EMA 50
                        </span>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                    {PERIODS.map(p => (
                        <button
                            key={p.label}
                            onClick={() => handlePeriodChange(p)}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${activePeriod === p.label
                                ? 'bg-[#2962FF] text-white shadow-md shadow-blue-500/20'
                                : 'text-[#8b95a5] hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1117]/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-[3px] border-[#2962FF]/20 border-t-[#2962FF] rounded-full animate-spin"></div>
                            <span className="text-xs font-bold text-[#8b95a5]">Loading chart data...</span>
                        </div>
                    </div>
                )}
                {error && !loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1117]">
                        <div className="text-center space-y-3">
                            <p className="text-sm font-bold text-[#ef5350]">⚠️ {error}</p>
                            <button
                                onClick={() => {
                                    const periodConfig = PERIODS.find(p => p.label === activePeriod) || PERIODS[2];
                                    fetchData(periodConfig);
                                }}
                                className="px-4 py-2 bg-[#2962FF] hover:bg-[#2962FF]/80 text-white rounded-lg text-xs font-bold transition-all"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}
                <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            </div>
        </div>
    );
}

export default TradingViewChart;
