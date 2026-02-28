import React from 'react';

function MarketMood({ buyCount, sellCount, total }) {
    const sentimentScore = total > 0 ? ((buyCount - sellCount) / total) * 100 : 0;

    // -100 to -50: Extreme Fear
    // -50 to -10: Fear
    // -10 to 10: Neutral
    // 10 to 50: Greed
    // 50 to 100: Extreme Greed

    let mood = "Neutral";
    let color = "text-yellow-neutral";
    let emoji = "⚖️";
    let description = "Market is in balance. No clear trend.";

    if (sentimentScore > 50) {
        mood = "Extreme Greed";
        color = "text-green-buy";
        emoji = "🚀";
        description = "Extremely bullish sentiment. High confidence in many stocks.";
    } else if (sentimentScore > 10) {
        mood = "Bullish";
        color = "text-green-buy";
        emoji = "📈";
        description = "Majority of stocks show buy signals. Positive momentum.";
    } else if (sentimentScore < -50) {
        mood = "Extreme Fear";
        color = "text-red-sell";
        emoji = "📉";
        description = "Widespread selling pressure. High risk environment.";
    } else if (sentimentScore < -10) {
        mood = "Bearish";
        color = "text-red-sell";
        emoji = "🐻";
        description = "Selling signals are dominating. Caution advised.";
    }

    // Calculate pointer position (0-100)
    // sentimentScore is -100 to 100. Map it to 0-100.
    const pointerPos = ((sentimentScore + 100) / 200) * 100;

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-dark-text">Market Sentiment Mood</h3>
                <span className={`text-2xl`}>{emoji}</span>
            </div>

            <div className="relative pt-10 pb-4">
                {/* Gauge Background */}
                <div className="h-4 w-full bg-dark-bg rounded-full flex overflow-hidden">
                    <div className="h-full bg-red-sell/80" style={{ width: '25%' }}></div>
                    <div className="h-full bg-red-sell/30" style={{ width: '15%' }}></div>
                    <div className="h-full bg-yellow-neutral/30" style={{ width: '20%' }}></div>
                    <div className="h-full bg-green-buy/30" style={{ width: '15%' }}></div>
                    <div className="h-full bg-green-buy/80" style={{ width: '25%' }}></div>
                </div>

                {/* Gauge Pointer */}
                <div
                    className="absolute top-8 transition-all duration-1000 ease-out"
                    style={{ left: `${pointerPos}%`, transform: 'translateX(-50%)' }}
                >
                    <div className="w-4 h-4 bg-white rounded-full border-4 border-dark-card shadow-lg"></div>
                    <div className="w-1 h-3 bg-white mx-auto -mt-1"></div>
                </div>

                {/* Labels */}
                <div className="flex justify-between text-[10px] text-dark-text-secondary mt-2 px-1">
                    <span>EXTREME FEAR</span>
                    <span>NEUTRAL</span>
                    <span>EXTREME GREED</span>
                </div>
            </div>

            <div className="mt-6 text-center">
                <div className={`text-2xl font-bold uppercase tracking-wider ${color}`}>
                    {mood}
                </div>
                <p className="text-sm text-dark-text-secondary mt-2">
                    {description}
                </p>
            </div>

            <div className="mt-6 pt-4 border-t border-dark-border grid grid-cols-2 gap-4">
                <div className="text-center">
                    <div className="text-xs text-dark-text-secondary uppercase">Buy Pressure</div>
                    <div className="text-lg font-bold text-green-buy">{buyCount}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-dark-text-secondary uppercase">Sell Pressure</div>
                    <div className="text-lg font-bold text-red-sell">{sellCount}</div>
                </div>
            </div>
        </div>
    );
}

export default MarketMood;
