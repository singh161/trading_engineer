import React, { useState, useEffect, useRef } from 'react';

const StockRow = ({ symbol, stock, analysis, getTrendColor, getVerdictColor, onClick }) => {
  const [flashClass, setFlashClass] = useState('');
  const prevPriceRef = useRef(analysis?.price);

  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    const checkWatchlist = () => {
      const savedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      setIsInWatchlist(savedWatchlist.includes(symbol));
    };

    checkWatchlist();
    window.addEventListener('watchlist-updated', checkWatchlist);
    return () => window.removeEventListener('watchlist-updated', checkWatchlist);
  }, [symbol]);

  useEffect(() => {
    if (analysis?.price && prevPriceRef.current !== undefined) {
      if (analysis.price > prevPriceRef.current) {
        setFlashClass('price-flash-up');
        setTimeout(() => setFlashClass(''), 1500);
      } else if (analysis.price < prevPriceRef.current) {
        setFlashClass('price-flash-down');
        setTimeout(() => setFlashClass(''), 1500);
      }
    }
    prevPriceRef.current = analysis?.price;
  }, [analysis?.price]);

  const toggleWatchlist = (e) => {
    e.stopPropagation();
    const savedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    let newWatchlist;
    if (isInWatchlist) {
      newWatchlist = savedWatchlist.filter(s => s !== symbol);
    } else {
      newWatchlist = [...savedWatchlist, symbol];
    }
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    window.dispatchEvent(new Event('watchlist-updated'));
  };

  return (
    <tr
      className="hover:bg-dark-bg/50 transition-colors duration-150 cursor-pointer"
      onClick={() => onClick && onClick(symbol)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={toggleWatchlist}
          className="text-lg hover:scale-120 transition-all p-1"
          title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          {isInWatchlist ? '⭐' : '☆'}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-semibold text-dark-text">
          {analysis?.symbol || symbol || 'N/A'}
        </div>
      </td>
      <td className={`px-6 py-4 whitespace-nowrap transition-all duration-300 ${flashClass}`}>
        <div className="text-sm text-dark-text font-mono font-bold">
          {analysis?.price
            ? `₹${analysis.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            : 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-dark-text">
          {analysis?.rsi ? analysis.rsi.toFixed(2) : 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-dark-text">
          {analysis?.macd ? analysis.macd.toFixed(4) : 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-dark-text">
          {(analysis?.ema20 || analysis?.ema_20) ? (analysis.ema20 || analysis.ema_20).toFixed(2) : 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-dark-text">
          {(analysis?.ema50 || analysis?.ema_50) ? (analysis.ema50 || analysis.ema_50).toFixed(2) : 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm font-semibold ${getTrendColor(analysis?.trend)}`}>
          {analysis?.trend || 'NEUTRAL'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-semibold text-green-buy">
          {analysis?.buy_count || 0}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-semibold text-red-sell">
          {analysis?.sell_count || 0}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-green-buy">
          {analysis?.buy_price
            ? `₹${analysis.buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            : 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-red-sell">
          {analysis?.sell_price
            ? `₹${analysis.sell_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            : 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${getVerdictColor(
            analysis?.final_verdict || 'NEUTRAL'
          )}`}
        >
          {analysis?.final_verdict || 'NEUTRAL'}
        </span>
      </td>
    </tr>
  );
};

const StockTable = ({ stocks, analyses, loading, onStockClick }) => {
  const getVerdictColor = (verdict) => {
    if (verdict === 'STRONG BUY') return 'text-green-buy bg-green-buy/10';
    if (verdict === 'STRONG SELL') return 'text-red-sell bg-red-sell/10';
    if (verdict === 'BUY') return 'text-green-buy bg-green-buy/5';
    if (verdict === 'SELL') return 'text-red-sell bg-red-sell/5';
    return 'text-yellow-neutral bg-yellow-neutral/10';
  };

  const getTrendColor = (trend) => {
    if (trend === 'UP') return 'text-green-buy';
    if (trend === 'DOWN') return 'text-red-sell';
    return 'text-yellow-neutral';
  };

  if (loading) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-dark-bg rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stocks || stocks.length === 0) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
        <p className="text-dark-text-secondary">No stocks found</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full">
          <thead className="bg-dark-bg border-b border-dark-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                ⭐
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                LTP
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                RSI
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                MACD
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                EMA 20
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                EMA 50
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                Trend
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                Buy
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                Sell
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                Buy Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                Sell Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                Verdict
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {stocks.map((stock, index) => {
              if (!stock) return null;

              const symbol = stock.symbol || stock.SYMBOL || stock.symbal_name || stock.name || stock.identifier_name || `stock-${index}`;
              const analysis = analyses[symbol] || analyses[index];

              return (
                <StockRow
                  key={symbol}
                  symbol={symbol}
                  stock={stock}
                  analysis={analysis}
                  onStockClick={onStockClick}
                  getTrendColor={getTrendColor}
                  getVerdictColor={getVerdictColor}
                  onClick={onStockClick}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockTable;
