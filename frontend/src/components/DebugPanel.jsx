import React, { useState } from 'react';

const DebugPanel = ({ stocks, analyses, marketData, apiConnected, error }) => {
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text-secondary hover:text-dark-text transition-all z-50"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-dark-card border-2 border-blue-accent rounded-lg p-4 max-w-md z-50 shadow-2xl">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-dark-text">Debug Information</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-dark-text-secondary hover:text-dark-text"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-dark-text-secondary">API Status:</span>
          <span className={apiConnected ? 'text-green-buy' : 'text-red-sell'}>
            {apiConnected ? '✅ Connected' : '❌ Disconnected'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-text-secondary">Stocks Count:</span>
          <span className="text-dark-text">{stocks.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-text-secondary">Analyses Count:</span>
          <span className="text-dark-text">{Object.keys(analyses).length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-text-secondary">Market Data:</span>
          <span className={marketData ? 'text-green-buy' : 'text-red-sell'}>
            {marketData ? '✅ Loaded' : '❌ Not Loaded'}
          </span>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-sell/20 rounded text-red-sell text-xs">
            <strong>Error:</strong> {error}
          </div>
        )}
        {stocks.length > 0 && (
          <div className="mt-2">
            <div className="text-dark-text-secondary mb-1">Sample Stocks:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {stocks.slice(0, 5).map((stock, i) => (
                <div key={i} className="text-xs text-dark-text">
                  {stock.symbol || stock.SYMBOL || stock.name || 'Unknown'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
