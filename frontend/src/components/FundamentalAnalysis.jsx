import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';

function FundamentalAnalysis() {
  const [fundamentals, setFundamentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFundamentals();
    
    // Listen for analysis completion event
    const handleAnalysisComplete = () => {
      loadFundamentals();
    };
    window.addEventListener('ai-analysis-complete', handleAnalysisComplete);
    
    return () => {
      window.removeEventListener('ai-analysis-complete', handleAnalysisComplete);
    };
  }, []);

  const loadFundamentals = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get rankings which include fundamental data
      const data = await aiStockAPI.getRecommendations(20);
      
      // Extract fundamental data from rankings
      const fundamentalList = [];
      if (data.top_5_buy) {
        data.top_5_buy.forEach((stock) => {
          if (stock.fundamental_analysis) {
            fundamentalList.push({
              symbol: stock.symbol,
              ...stock.fundamental_analysis,
            });
          }
        });
      }
      if (data.top_5_hold) {
        data.top_5_hold.forEach((stock) => {
          if (stock.fundamental_analysis && !fundamentalList.find((f) => f.symbol === stock.symbol)) {
            fundamentalList.push({
              symbol: stock.symbol,
              ...stock.fundamental_analysis,
            });
          }
        });
      }
      
      setFundamentals(fundamentalList);
    } catch (err) {
      setError(err.message || 'Failed to load fundamental data');
      console.error('Error loading fundamentals:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-buy';
    if (score >= 50) return 'text-yellow-neutral';
    return 'text-red-sell';
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatPercent = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return `${(num * 100).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-accent mx-auto"></div>
        <p className="text-dark-text-secondary mt-2">Loading fundamental data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-sell mb-2">⚠️ {error}</div>
        <button
          onClick={loadFundamentals}
          className="px-4 py-2 bg-blue-accent hover:bg-blue-accent/90 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (fundamentals.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">💰</div>
        <p className="text-dark-text mb-2">No fundamental data available</p>
        <p className="text-sm text-dark-text-secondary">
          Run "Complete Analysis" to fetch fundamental metrics
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
        <h3 className="text-lg font-semibold text-dark-text mb-2">Fundamental Metrics</h3>
        <p className="text-sm text-dark-text-secondary">
          Financial health analysis based on revenue growth, EPS, ROE, and debt ratios
        </p>
      </div>

      <div className="space-y-4">
        {fundamentals.map((fund) => (
          <div
            key={fund.symbol}
            className="bg-dark-bg border border-dark-border rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-dark-text">{fund.symbol}</h3>
                <p className="text-sm text-dark-text-secondary">Fundamental Analysis</p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(fund.fundamental_score || 0)}`}>
                  {fund.fundamental_score?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-xs text-dark-text-secondary">Score / 100</div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-dark-card p-3 rounded">
                <div className="text-xs text-dark-text-secondary mb-1">Revenue Growth</div>
                <div className="text-lg font-semibold text-dark-text">
                  {formatPercent(fund.revenue_growth)}
                </div>
              </div>
              <div className="bg-dark-card p-3 rounded">
                <div className="text-xs text-dark-text-secondary mb-1">EPS Growth</div>
                <div className="text-lg font-semibold text-dark-text">
                  {formatPercent(fund.earnings_growth)}
                </div>
              </div>
              <div className="bg-dark-card p-3 rounded">
                <div className="text-xs text-dark-text-secondary mb-1">ROE</div>
                <div className="text-lg font-semibold text-dark-text">
                  {formatPercent(fund.roe)}
                </div>
              </div>
              <div className="bg-dark-card p-3 rounded">
                <div className="text-xs text-dark-text-secondary mb-1">Debt/Equity</div>
                <div className="text-lg font-semibold text-dark-text">
                  {fund.debt_to_equity?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            {(fund.market_cap || fund.pe_ratio || fund.profit_margin) && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {fund.market_cap && (
                  <div className="bg-dark-card p-2 rounded">
                    <div className="text-xs text-dark-text-secondary">Market Cap</div>
                    <div className="text-sm font-semibold text-dark-text">
                      ₹{formatNumber(fund.market_cap)}
                    </div>
                  </div>
                )}
                {fund.pe_ratio && (
                  <div className="bg-dark-card p-2 rounded">
                    <div className="text-xs text-dark-text-secondary">P/E Ratio</div>
                    <div className="text-sm font-semibold text-dark-text">
                      {fund.pe_ratio.toFixed(2)}
                    </div>
                  </div>
                )}
                {fund.profit_margin && (
                  <div className="bg-dark-card p-2 rounded">
                    <div className="text-xs text-dark-text-secondary">Profit Margin</div>
                    <div className="text-sm font-semibold text-dark-text">
                      {formatPercent(fund.profit_margin)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Score Breakdown */}
            {fund.factors && fund.factors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dark-border">
                <div className="text-xs text-dark-text-secondary mb-2">Score Breakdown:</div>
                <div className="space-y-1">
                  {fund.factors.map((factor, idx) => (
                    <div key={idx} className="text-xs text-dark-text-secondary">
                      • {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FundamentalAnalysis;
