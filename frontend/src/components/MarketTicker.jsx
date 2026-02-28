import React from 'react';

/**
 * MarketTicker Component
 * Displays a smooth horizontal scrolling ticker of stock signals
 */
function MarketTicker({ stocks, analyses }) {
    if (!stocks || stocks.length === 0) return null;

    // Filter interesting stocks (those with BUY/SELL signals)
    const activeSingals = stocks.filter(s => {
        const sym = s.symbol || s.SYMBOL || s.name;
        const verdict = analyses[sym]?.final_verdict;
        return verdict === 'STRONG BUY' || verdict === 'STRONG SELL';
    }).slice(0, 15);

    // If not enough signals, just take top stocks
    const displayStocks = activeSingals.length > 5 ? activeSingals : stocks.slice(0, 15);

    return (
        <div className="bg-dark-card/30 backdrop-blur-md border-b border-white/5 overflow-hidden py-1.5 h-8 flex items-center">
            <div className="flex whitespace-nowrap animate-ticker group">
                {/* Duplicate items for infinite scroll effect */}
                {[...displayStocks, ...displayStocks].map((stock, idx) => {
                    const symbol = stock.symbol || stock.SYMBOL || stock.name;
                    const analysis = analyses[symbol];
                    const change = analysis?.price_change_pct || 0;
                    const isPositive = change >= 0;

                    return (
                        <div key={`${symbol}-${idx}`} className="flex items-center gap-2 px-6">
                            <span className="text-[10px] font-black text-dark-text tracking-tighter uppercase">{symbol}</span>
                            <span className={`text-[10px] font-black ${isPositive ? 'text-green-buy' : 'text-red-sell'}`}>
                                {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
                            </span>
                            {analysis?.final_verdict && (
                                <span className={`text-[8px] px-1 rounded-sm font-black ${analysis.final_verdict === 'STRONG BUY' ? 'bg-green-buy/20 text-green-buy' :
                                        analysis.final_verdict === 'STRONG SELL' ? 'bg-red-sell/20 text-red-sell' :
                                            'bg-white/10 text-dark-text-secondary'
                                    }`}>
                                    {analysis.final_verdict}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <style jsx="true">{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-ticker {
                    animation: ticker 40s linear infinite;
                }
                .animate-ticker:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}

export default MarketTicker;
