import React, { useState, useEffect } from 'react';
import { stockAPI } from '../services/api';

function Watchlist({ onStockClick }) {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stocksData, setStocksData] = useState({});

    useEffect(() => {
        const savedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        setWatchlist(savedWatchlist);
        loadWatchlistData(savedWatchlist);
    }, []);

    const loadWatchlistData = async (symbols) => {
        if (symbols.length === 0) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const data = {};
        try {
            // Fetch latest analysis for each watchlist item
            for (const symbol of symbols) {
                try {
                    const result = await stockAPI.analyzeStock(symbol, 'swing');
                    data[symbol] = result;
                } catch (err) {
                    console.error(`Failed to load data for ${symbol}`, err);
                }
            }
            setStocksData(data);
        } catch (err) {
            console.error('Failed to load watchlist data', err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWatchlist = (symbol) => {
        const newWatchlist = watchlist.filter(s => s !== symbol);
        setWatchlist(newWatchlist);
        localStorage.setItem('watchlist', JSON.stringify(newWatchlist));

        // Cleanup data
        const newData = { ...stocksData };
        delete newData[symbol];
        setStocksData(newData);
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-accent mx-auto mb-4"></div>
                <p className="text-dark-text-secondary">Loading your watchlist data...</p>
            </div>
        );
    }

    if (watchlist.length === 0) {
        return (
            <div className="text-center py-12 bg-dark-bg border border-dark-border rounded-xl">
                <div className="text-5xl mb-4">⭐</div>
                <h3 className="text-xl font-bold text-dark-text mb-2">Your Watchlist is Empty</h3>
                <p className="text-dark-text-secondary mb-6">Start adding stocks to track them in real-time.</p>
                <p className="text-sm text-dark-text-secondary">Go to "Stocks" or "AI Research" to add stocks.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-dark-text">Tracked Stocks ({watchlist.length})</h2>
                <button
                    onClick={() => loadWatchlistData(watchlist)}
                    className="text-sm text-blue-accent hover:underline flex items-center gap-1"
                >
                    🔄 Refresh All
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {watchlist.map(symbol => {
                    const data = stocksData[symbol];
                    return (
                        <div
                            key={symbol}
                            className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-blue-accent transition-all relative group"
                        >
                            <button
                                onClick={() => removeFromWatchlist(symbol)}
                                className="absolute top-2 right-2 p-1 text-dark-text-secondary hover:text-red-sell opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove from Watchlist"
                            >
                                ✕
                            </button>

                            <div
                                className="cursor-pointer"
                                onClick={() => onStockClick && onStockClick(symbol)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-dark-text">{symbol}</h3>
                                        <p className="text-sm text-dark-text-secondary">
                                            {data?.price ? `₹${data.price.toLocaleString('en-IN')}` : 'Loading...'}
                                        </p>
                                    </div>
                                    {data?.final_verdict && (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${data.final_verdict.includes('BUY') ? 'bg-green-buy/20 text-green-buy' :
                                                data.final_verdict.includes('SELL') ? 'bg-red-sell/20 text-red-sell' :
                                                    'bg-yellow-neutral/20 text-yellow-neutral'
                                            }`}>
                                            {data.final_verdict}
                                        </span>
                                    )}
                                </div>

                                {data?.ai_recommendation?.confidence_score && (
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs text-dark-text-secondary mb-1">
                                            <span>AI Confidence</span>
                                            <span>{data.ai_recommendation.confidence_score}%</span>
                                        </div>
                                        <div className="w-full bg-dark-bg rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-blue-accent h-full transition-all"
                                                style={{ width: `${data.ai_recommendation.confidence_score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {data?.trend && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="text-xs text-dark-text-secondary">Trend:</span>
                                        <span className={`text-xs font-semibold ${data.trend === 'UP' ? 'text-green-buy' :
                                                data.trend === 'DOWN' ? 'text-red-sell' :
                                                    'text-yellow-neutral'
                                            }`}>
                                            {data.trend}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Watchlist;
