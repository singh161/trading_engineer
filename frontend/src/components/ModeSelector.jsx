import React from 'react';

const ModeSelector = ({ mode, onModeChange }) => {
  const modes = [
    { value: 'intraday', label: 'Intraday', description: '5m candles' },
    { value: 'swing', label: 'Swing', description: 'Daily (2-10 days)' },
    { value: 'longterm', label: 'Long Term', description: 'Weekly (6-24 months)' },
  ];

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-dark-text-secondary mb-3">Trading Mode</h3>
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => onModeChange(m.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              mode === m.value
                ? 'bg-blue-accent text-white shadow-lg shadow-blue-accent/30'
                : 'bg-dark-bg text-dark-text-secondary hover:bg-dark-border hover:text-dark-text border border-dark-border'
            }`}
          >
            <div className="flex flex-col items-start">
              <span>{m.label}</span>
              <span className="text-xs opacity-75">{m.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;
