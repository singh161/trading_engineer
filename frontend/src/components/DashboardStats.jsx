import React from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, AlertCircle } from 'lucide-react';

/**
 * Dashboard Stats Cards
 * Modern metric cards with icons and trends
 */
function DashboardStats({ stocks, analyses }) {
    // Calculate stats
    const totalStocks = stocks.length;
    const analyzedStocks = Object.keys(analyses).length;

    const buySignals = stocks.filter((s) => {
        const symbol = s.symbol || s.SYMBOL || s.symbal_name || s.name || s.identifier_name;
        const verdict = analyses[symbol]?.final_verdict;
        return verdict === 'STRONG BUY' || verdict === 'BUY';
    }).length;

    const sellSignals = stocks.filter((s) => {
        const symbol = s.symbol || s.SYMBOL || s.symbal_name || s.name || s.identifier_name;
        const verdict = analyses[symbol]?.final_verdict;
        return verdict === 'STRONG SELL' || verdict === 'SELL';
    }).length;

    const neutralSignals = stocks.filter((s) => {
        const symbol = s.symbol || s.SYMBOL || s.symbal_name || s.name || s.identifier_name;
        return analyses[symbol]?.final_verdict === 'NEUTRAL';
    }).length;

    const buyPercentage = analyzedStocks > 0 ? Math.round((buySignals / analyzedStocks) * 100) : 0;
    const sellPercentage = analyzedStocks > 0 ? Math.round((sellSignals / analyzedStocks) * 100) : 0;

    const stats = [
        {
            id: 'total',
            label: 'Total Analyzed',
            value: analyzedStocks,
            change: analyzedStocks > 0 ? `${Math.min(100, Math.round((analyzedStocks / Math.max(totalStocks, 1)) * 100))}% coverage` : null,
            icon: BarChart3,
            color: 'blue',
            bgColor: 'bg-blue-accent/10',
            textColor: 'text-blue-accent',
            borderColor: 'border-blue-accent/20',
        },
        {
            id: 'buy',
            label: 'Buy Signals',
            value: buySignals,
            change: analyzedStocks > 0 ? `${buyPercentage}% of total` : null,
            icon: TrendingUp,
            color: 'green',
            bgColor: 'bg-green-buy/10',
            textColor: 'text-green-buy',
            borderColor: 'border-green-buy/20',
        },
        {
            id: 'sell',
            label: 'Sell Signals',
            value: sellSignals,
            change: analyzedStocks > 0 ? `${sellPercentage}% of total` : null,
            icon: TrendingDown,
            color: 'red',
            bgColor: 'bg-red-sell/10',
            textColor: 'text-red-sell',
            borderColor: 'border-red-sell/20',
        },
        {
            id: 'neutral',
            label: 'Neutral',
            value: neutralSignals,
            change: null,
            icon: Activity,
            color: 'yellow',
            bgColor: 'bg-yellow-neutral/10',
            textColor: 'text-yellow-neutral',
            borderColor: 'border-yellow-neutral/20',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                    <div
                        key={stat.id}
                        className={`
              bg-dark-card border ${stat.borderColor} rounded-xl p-6
              hover:shadow-lg hover:shadow-${stat.color}-500/10
              transition-all duration-200
            `}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stat.bgColor} ${stat.textColor} p-3 rounded-lg`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            {stat.change && (
                                <span className={`text-sm font-semibold ${stat.textColor}`}>
                                    {stat.change}
                                </span>
                            )}
                        </div>

                        <div>
                            <p className="text-dark-text-secondary text-sm mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold text-dark-text">{stat.value}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default DashboardStats;
