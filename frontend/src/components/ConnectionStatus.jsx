import React from 'react';

const ConnectionStatus = ({ connected, stocksCount }) => {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-buy animate-pulse' : 'bg-red-sell'}`}></div>
      <span className="text-dark-text-secondary">
        {connected ? 'API Connected' : 'API Disconnected'} • {stocksCount} stocks
      </span>
    </div>
  );
};

export default ConnectionStatus;
