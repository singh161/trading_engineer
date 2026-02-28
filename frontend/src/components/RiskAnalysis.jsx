import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';

function RiskAnalysis() {
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTicker, setFilterTicker] = useState(null);

  // Listen for voice command filters
  useEffect(() => {
    const handleVoiceFilter = (event) => {
      const filters = event.detail;
      if (filters?.ticker) {
        setFilterTicker(filters.ticker);
      }
    };

    window.addEventListener('voice-command-filter', handleVoiceFilter);

    // Check sessionStorage
    const storedFilters = sessionStorage.getItem('voiceCommandFilters');
    if (storedFilters) {
      try {
        const filters = JSON.parse(storedFilters);
        handleVoiceFilter({ detail: filters });
        sessionStorage.removeItem('voiceCommandFilters');
      } catch (e) {
        console.error('Error parsing stored filters:', e);
      }
    }

    return () => {
      window.removeEventListener('voice-command-filter', handleVoiceFilter);
    };
  }, []);

  const loadRiskData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiStockAPI.getRiskAnalysis(filterTicker);
      if (data.risk_data && data.risk_data.length > 0) {
        setRiskData(data.risk_data);
      } else {
        // Show helpful message from backend if available
        const message = data.message || 'No risk analysis data available. Run "Complete Analysis" first.';
        setError(message);
        setRiskData([]);
      }
    } catch (err) {
      console.error('Error loading risk analysis:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Failed to load risk analysis data';
      setError(errorMsg);
      setRiskData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiskData();
    
    // Listen for analysis completion event
    const handleAnalysisComplete = () => {
      setTimeout(loadRiskData, 1000);
    };
    window.addEventListener('ai-analysis-complete', handleAnalysisComplete);
    
    return () => {
      window.removeEventListener('ai-analysis-complete', handleAnalysisComplete);
    };
  }, [filterTicker]);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW':
        return 'text-green-buy';
      case 'MEDIUM':
        return 'text-yellow-neutral';
      case 'HIGH':
        return 'text-orange-500';
      case 'VERY HIGH':
        return 'text-red-sell';
      default:
        return 'text-dark-text-secondary';
    }
  };

  const getRiskBgColor = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW':
        return 'bg-green-buy/20 border-green-buy/50';
      case 'MEDIUM':
        return 'bg-yellow-neutral/20 border-yellow-neutral/50';
      case 'HIGH':
        return 'bg-orange-500/20 border-orange-500/50';
      case 'VERY HIGH':
        return 'bg-red-sell/20 border-red-sell/50';
      default:
        return 'bg-dark-bg border-dark-border';
    }
  };

  const getRiskBarColor = (risk) => {
    if (risk < 30) return 'bg-green-buy';
    if (risk < 50) return 'bg-yellow-neutral';
    if (risk < 70) return 'bg-orange-500';
    return 'bg-red-sell';
  };

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'BUY':
        return 'text-green-buy';
      case 'SELL':
        return 'text-red-sell';
      default:
        return 'text-yellow-neutral';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4 animate-spin">⚙️</div>
        <p className="text-dark-text">Loading risk analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-sell mb-2">{error}</p>
        <p className="text-sm text-dark-text-secondary mb-4">
          Risk analysis requires running the complete analysis first. Click "Run Complete Analysis" button above to generate risk data.
        </p>
        <button
          onClick={loadRiskData}
          className="px-4 py-2 bg-blue-accent text-white rounded-lg hover:bg-blue-accent/80"
        >
          Retry
        </button>
      </div>
    );
  }

  if (riskData.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🛡️</div>
        <p className="text-dark-text mb-2">No risk analysis data available</p>
        <p className="text-sm text-dark-text-secondary">
          Run "Complete Analysis" to analyze stock risks
        </p>
      </div>
    );
  }

  // Sort by overall risk (ascending - lowest risk first)
  const sortedRiskData = [...riskData].sort((a, b) => 
    (a.overall_risk || 0) - (b.overall_risk || 0)
  );

  return (
    <div>
      <div className="mb-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
        <h3 className="text-lg font-semibold text-dark-text mb-2">Risk Analysis Overview</h3>
        <p className="text-sm text-dark-text-secondary">
          Comprehensive risk assessment for {riskData.length} stocks
        </p>
      </div>

      <div className="space-y-4">
        {sortedRiskData.map((stock) => (
          <div
            key={stock.symbol}
            className={`bg-dark-bg border-2 rounded-lg p-4 ${getRiskBgColor(stock.risk_level)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-dark-text">{stock.symbol}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-sm font-semibold ${getRecommendationColor(stock.recommendation)}`}>
                    {stock.recommendation}
                  </span>
                  <span className="text-xs text-dark-text-secondary">
                    Score: {stock.final_score?.toFixed(2) || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getRiskColor(stock.risk_level)}`}>
                  {stock.risk_level || 'UNKNOWN'}
                </div>
                <div className="text-xs text-dark-text-secondary">
                  Risk: {stock.overall_risk?.toFixed(1) || 'N/A'}%
                </div>
              </div>
            </div>

            {/* Overall Risk Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-dark-text-secondary mb-1">
                <span>Overall Risk</span>
                <span>{stock.overall_risk?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-dark-card rounded-full h-3">
                <div
                  className={`${getRiskBarColor(stock.overall_risk || 0)} h-3 rounded-full transition-all`}
                  style={{ width: `${Math.min(100, stock.overall_risk || 0)}%` }}
                ></div>
              </div>
            </div>

            {/* Risk Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-dark-card/50 p-2 rounded">
                <div className="text-xs text-dark-text-secondary mb-1">Volatility</div>
                <div className="text-sm font-semibold text-dark-text">
                  {stock.volatility_risk?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div className="bg-dark-card/50 p-2 rounded">
                <div className="text-xs text-dark-text-secondary mb-1">Liquidity</div>
                <div className="text-sm font-semibold text-dark-text">
                  {stock.liquidity_risk?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div className="bg-dark-card/50 p-2 rounded">
                <div className="text-xs text-dark-text-secondary mb-1">Leverage</div>
                <div className="text-sm font-semibold text-dark-text">
                  {stock.leverage_risk?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div className="bg-dark-card/50 p-2 rounded">
                <div className="text-xs text-dark-text-secondary mb-1">Earnings</div>
                <div className="text-sm font-semibold text-dark-text">
                  {stock.earnings_risk?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div className="bg-dark-card/50 p-2 rounded">
                <div className="text-xs text-dark-text-secondary mb-1">Correlation</div>
                <div className="text-sm font-semibold text-dark-text">
                  {stock.correlation_risk?.toFixed(1) || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RiskAnalysis;
