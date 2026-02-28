import React from 'react';

const StockCard = ({ stock, analysis, onAnalyze, analyzing = false, onCardClick }) => {
  const [isInWatchlist, setIsInWatchlist] = React.useState(false);

  React.useEffect(() => {
    const symbol = analysis?.symbol || stock?.symbol || stock?.SYMBOL || stock?.symbal_name || stock?.name || stock?.identifier_name;
    if (!symbol) return;

    const checkWatchlist = () => {
      const savedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      setIsInWatchlist(savedWatchlist.includes(symbol));
    };

    checkWatchlist();
    window.addEventListener('watchlist-updated', checkWatchlist);
    return () => window.removeEventListener('watchlist-updated', checkWatchlist);
  }, [analysis, stock]);

  const getVerdictColor = (verdict) => {
    if (!verdict) return 'bg-yellow-neutral/20 border-yellow-neutral text-yellow-neutral';
    if (verdict === 'STRONG BUY') return 'bg-green-buy/20 border-green-buy text-green-buy';
    if (verdict === 'STRONG SELL') return 'bg-red-sell/20 border-red-sell text-red-sell';
    if (verdict === 'BUY') return 'bg-green-buy/10 border-green-buy/50 text-green-buy';
    if (verdict === 'SELL') return 'bg-red-sell/10 border-red-sell/50 text-red-sell';
    return 'bg-yellow-neutral/20 border-yellow-neutral text-yellow-neutral';
  };

  const getTrendColor = (trend) => {
    if (!trend) return 'text-yellow-neutral';
    if (trend === 'UP') return 'text-green-buy';
    if (trend === 'DOWN') return 'text-red-sell';
    return 'text-yellow-neutral';
  };

  if (!analysis) {
    const symbol = stock?.symbol || stock?.SYMBOL || stock?.symbal_name || stock?.name || stock?.identifier_name || 'N/A';
    return (
      <div
        className="bg-dark-card border border-dark-border rounded-lg p-4 animate-pulse cursor-pointer"
        onClick={() => onCardClick && onCardClick()}
      >
        <div className="h-6 bg-dark-bg rounded mb-2"></div>
        <div className="h-4 bg-dark-bg rounded w-2/3"></div>
        <div className="text-xs text-dark-text-secondary mt-2">{symbol}</div>
      </div>
    );
  }

  const symbol = analysis.symbol || stock?.symbol || stock?.SYMBOL || stock?.symbal_name || stock?.name || stock?.identifier_name || 'N/A';
  const verdict = analysis.final_verdict || 'NEUTRAL';

  return (
    <div
      onClick={() => onCardClick && onCardClick()}
      className={`bg-dark-card border-2 rounded-lg p-4 hover:shadow-xl transition-all duration-200 cursor-pointer ${getVerdictColor(verdict)}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-dark-text">{symbol}</h3>
          <p className="text-sm text-dark-text-secondary">
            {analysis.price ? `₹${analysis.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${getVerdictColor(verdict)}`}>
            {verdict}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const savedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
              if (savedWatchlist.includes(symbol)) {
                const newWatchlist = savedWatchlist.filter(s => s !== symbol);
                localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
              } else {
                savedWatchlist.push(symbol);
                localStorage.setItem('watchlist', JSON.stringify(savedWatchlist));
              }
              // Force re-render if needed, but for now just updating localStorage
              window.dispatchEvent(new Event('watchlist-updated'));
            }}
            className="p-1.5 rounded-full bg-dark-bg/50 border border-dark-border text-lg hover:scale-110 transition-all"
            title="Toggle Watchlist"
          >
            {isInWatchlist ? '⭐' : '☆'}
          </button>
        </div>
      </div>

      {/* Price Recommendations */}
      {(analysis.buy_price || analysis.sell_price) && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-green-buy/20 border border-green-buy/50 rounded p-2">
            <div className="text-xs text-green-buy mb-1 font-semibold">💰 Buy At</div>
            <div className="text-sm font-bold text-green-buy">
              {analysis.buy_price ? `₹${analysis.buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'}
            </div>
          </div>
          <div className="bg-red-sell/20 border border-red-sell/50 rounded p-2">
            <div className="text-xs text-red-sell mb-1 font-semibold">💸 Sell At</div>
            <div className="text-sm font-bold text-red-sell">
              {analysis.sell_price ? `₹${analysis.sell_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Indicators Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-dark-bg/50 rounded p-2">
          <div className="text-xs text-dark-text-secondary mb-1">RSI</div>
          <div className="text-sm font-semibold text-dark-text">
            {analysis.rsi ? analysis.rsi.toFixed(2) : 'N/A'}
          </div>
        </div>
        <div className="bg-dark-bg/50 rounded p-2">
          <div className="text-xs text-dark-text-secondary mb-1">Trend</div>
          <div className={`text-sm font-semibold ${getTrendColor(analysis.trend)}`}>
            {analysis.trend || 'NEUTRAL'}
          </div>
        </div>
        <div className="bg-dark-bg/50 rounded p-2">
          <div className="text-xs text-dark-text-secondary mb-1">EMA 20</div>
          <div className="text-sm font-semibold text-dark-text">
            {(analysis.ema20 || analysis.ema_20) ? (analysis.ema20 || analysis.ema_20).toFixed(2) : 'N/A'}
          </div>
        </div>
        <div className="bg-dark-bg/50 rounded p-2">
          <div className="text-xs text-dark-text-secondary mb-1">EMA 50</div>
          <div className="text-sm font-semibold text-dark-text">
            {(analysis.ema50 || analysis.ema_50) ? (analysis.ema50 || analysis.ema_50).toFixed(2) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Signals */}
      <div className="flex justify-between items-center pt-3 border-t border-dark-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-text-secondary">Buy:</span>
          <span className="text-sm font-semibold text-green-buy">{analysis.buy_count || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-text-secondary">Sell:</span>
          <span className="text-sm font-semibold text-red-sell">{analysis.sell_count || 0}</span>
        </div>
        {analysis.macd && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-dark-text-secondary">MACD:</span>
            <span className="text-sm font-semibold text-dark-text">
              {analysis.macd > 0 ? '+' : ''}{analysis.macd.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Analyze Button */}
      {onAnalyze && (
        <div className="mt-3 pt-3 border-t border-dark-border">
          <button
            onClick={() => onAnalyze(symbol)}
            disabled={analyzing}
            className="w-full px-4 py-2 bg-blue-accent hover:bg-blue-accent/90 text-white rounded-lg 
                     font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <span>🔄 Re-Analyze</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default StockCard;
