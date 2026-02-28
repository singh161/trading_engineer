import React from 'react';

const Filters = ({ filter, onFilterChange }) => {
  const getActiveButtonClass = (value, color) => {
    if (filter !== value) {
      return 'bg-dark-bg text-dark-text-secondary hover:bg-dark-border hover:text-dark-text border border-dark-border';
    }
    
    // Active state with proper Tailwind classes
    switch (color) {
      case 'green-buy':
        return 'bg-green-buy text-white shadow-lg shadow-green-buy/30';
      case 'red-sell':
        return 'bg-red-sell text-white shadow-lg shadow-red-sell/30';
      case 'yellow-neutral':
        return 'bg-yellow-neutral text-white shadow-lg shadow-yellow-neutral/30';
      default:
        return 'bg-blue-accent text-white shadow-lg';
    }
  };

  const filters = [
    { value: 'all', label: 'All Stocks' },
    { value: 'STRONG BUY', label: 'Strong Buy', color: 'green-buy' },
    { value: 'BUY', label: 'Buy', color: 'green-buy' },
    { value: 'STRONG SELL', label: 'Strong Sell', color: 'red-sell' },
    { value: 'SELL', label: 'Sell', color: 'red-sell' },
    { value: 'NEUTRAL', label: 'Neutral', color: 'yellow-neutral' },
  ];

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-dark-text-secondary mb-3">Filter by Verdict</h3>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${getActiveButtonClass(f.value, f.color)}`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Filters;
