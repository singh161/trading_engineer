import React from 'react';

const MarketIndex = ({ marketData, loading }) => {
  if (loading) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-dark-text mb-4">Market Indices</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-dark-bg rounded"></div>
          <div className="h-16 bg-dark-bg rounded"></div>
        </div>
      </div>
    );
  }

  const getTrendColor = (trend) => {
    if (trend === 'UP') return 'text-green-buy';
    if (trend === 'DOWN') return 'text-red-sell';
    return 'text-yellow-neutral';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'UP') return '↗';
    if (trend === 'DOWN') return '↘';
    return '→';
  };

  const IndexCard = ({ name, data }) => {
    if (!data || data.error) {
      return (
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-dark-text-secondary font-semibold">{name}</span>
            <span className="text-red-sell text-sm">No data</span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-dark-bg border border-dark-border rounded-lg p-4 hover:border-blue-accent transition-colors">
        <div className="flex justify-between items-start mb-2">
          <span className="text-dark-text-secondary font-semibold">{name}</span>
          <span className={`text-lg font-bold ${getTrendColor(data.trend)}`}>
            {getTrendIcon(data.trend)}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-dark-text-secondary text-sm">Price:</span>
            <span className="text-dark-text font-semibold">
              {data.price ? `₹${data.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-text-secondary text-sm">Trend:</span>
            <span className={`font-semibold ${getTrendColor(data.trend)}`}>{data.trend || 'NEUTRAL'}</span>
          </div>
          {data.rsi && (
            <div className="flex justify-between">
              <span className="text-dark-text-secondary text-sm">RSI:</span>
              <span className="text-dark-text">{data.rsi.toFixed(2)}</span>
            </div>
          )}
          {(data.buy_price || data.sell_price) && (
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dark-border">
              <div className="bg-green-buy/20 rounded p-2">
                <div className="text-xs text-green-buy font-semibold mb-1">💰 Buy</div>
                <div className="text-xs font-bold text-green-buy">
                  {data.buy_price ? `₹${data.buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'}
                </div>
              </div>
              <div className="bg-red-sell/20 rounded p-2">
                <div className="text-xs text-red-sell font-semibold mb-1">💸 Sell</div>
                <div className="text-xs font-bold text-red-sell">
                  {data.sell_price ? `₹${data.sell_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'}
                </div>
              </div>
            </div>
          )}
          {data.final_verdict && (
            <div className="flex justify-between mt-2 pt-2 border-t border-dark-border">
              <span className="text-dark-text-secondary text-sm">Verdict:</span>
              <span className={`font-semibold ${
                data.final_verdict === 'STRONG BUY' ? 'text-green-buy' :
                data.final_verdict === 'STRONG SELL' ? 'text-red-sell' :
                'text-yellow-neutral'
              }`}>
                {data.final_verdict}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-6">
      <h2 className="text-xl font-bold text-dark-text mb-4 flex items-center gap-2">
        <span>📈</span>
        Market Indices
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IndexCard name="NIFTY" data={marketData?.NIFTY} />
        <IndexCard name="BANKNIFTY" data={marketData?.BANKNIFTY} />
      </div>
    </div>
  );
};

export default MarketIndex;
