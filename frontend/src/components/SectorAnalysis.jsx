import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';

function SectorAnalysis() {
  const [sectorData, setSectorData] = useState({});
  const [topSector, setTopSector] = useState(null);
  const [worstSector, setWorstSector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSectorData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiStockAPI.getSectorAnalysis();
      if (data.sector_data && Object.keys(data.sector_data).length > 0) {
        setSectorData(data.sector_data);
        setTopSector(data.top_sector);
        setWorstSector(data.worst_sector);
      } else {
        setSectorData({});
        setTopSector(null);
        setWorstSector(null);
      }
    } catch (err) {
      console.error('Error loading sector analysis:', err);
      setError('Failed to load sector analysis data');
      setSectorData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSectorData();
    
    // Listen for analysis completion event
    const handleAnalysisComplete = () => {
      setTimeout(loadSectorData, 1000);
    };
    window.addEventListener('ai-analysis-complete', handleAnalysisComplete);
    
    return () => {
      window.removeEventListener('ai-analysis-complete', handleAnalysisComplete);
    };
  }, []);

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-buy';
    if (score >= 60) return 'text-yellow-neutral';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-sell';
  };

  const getScoreBgColor = (score) => {
    if (score >= 70) return 'bg-green-buy/20 border-green-buy/50';
    if (score >= 60) return 'bg-yellow-neutral/20 border-yellow-neutral/50';
    if (score >= 40) return 'bg-orange-500/20 border-orange-500/50';
    return 'bg-red-sell/20 border-red-sell/50';
  };

  const getRecommendation = (sector) => {
    const data = sectorData[sector];
    if (!data) return 'NEUTRAL';
    
    const avgScore = data.average_score;
    const buyRatio = data.buy_ratio;
    
    if (avgScore >= 70 && buyRatio >= 0.6) return 'STRONG BUY';
    if (avgScore >= 60 && buyRatio >= 0.4) return 'BUY';
    if (avgScore < 40 || buyRatio < 0.2) return 'SELL';
    return 'HOLD';
  };

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'STRONG BUY':
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
        <p className="text-dark-text">Loading sector analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-sell mb-2">{error}</p>
        <button
          onClick={loadSectorData}
          className="px-4 py-2 bg-blue-accent text-white rounded-lg hover:bg-blue-accent/80"
        >
          Retry
        </button>
      </div>
    );
  }

  if (Object.keys(sectorData).length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-dark-text mb-2">No sector analysis data available</p>
        <p className="text-sm text-dark-text-secondary">
          Run "Complete Analysis" to analyze sector performance
        </p>
      </div>
    );
  }

  // Sort sectors by average score (descending)
  const sortedSectors = Object.entries(sectorData).sort(
    (a, b) => b[1].average_score - a[1].average_score
  );

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {topSector && sectorData[topSector] && (
          <div className="bg-green-buy/20 border-2 border-green-buy/50 rounded-lg p-4">
            <div className="text-sm text-dark-text-secondary mb-1">🏆 Top Performing Sector</div>
            <div className="text-xl font-bold text-green-buy">{topSector}</div>
            <div className="text-sm text-dark-text mt-2">
              Avg Score: <span className="font-semibold">{sectorData[topSector].average_score.toFixed(1)}</span>
            </div>
            <div className="text-xs text-dark-text-secondary mt-1">
              {sectorData[topSector].stock_count} stocks analyzed
            </div>
          </div>
        )}
        {worstSector && sectorData[worstSector] && (
          <div className="bg-red-sell/20 border-2 border-red-sell/50 rounded-lg p-4">
            <div className="text-sm text-dark-text-secondary mb-1">⚠️ Underperforming Sector</div>
            <div className="text-xl font-bold text-red-sell">{worstSector}</div>
            <div className="text-sm text-dark-text mt-2">
              Avg Score: <span className="font-semibold">{sectorData[worstSector].average_score.toFixed(1)}</span>
            </div>
            <div className="text-xs text-dark-text-secondary mt-1">
              {sectorData[worstSector].stock_count} stocks analyzed
            </div>
          </div>
        )}
      </div>

      {/* Sector List */}
      <div className="mb-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
        <h3 className="text-lg font-semibold text-dark-text mb-2">Sector Performance Breakdown</h3>
        <p className="text-sm text-dark-text-secondary">
          {sortedSectors.length} sectors analyzed
        </p>
      </div>

      <div className="space-y-4">
        {sortedSectors.map(([sector, data]) => {
          const recommendation = getRecommendation(sector);
          return (
            <div
              key={sector}
              className={`bg-dark-bg border-2 rounded-lg p-4 ${getScoreBgColor(data.average_score)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-dark-text">{sector}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-sm font-semibold ${getRecommendationColor(recommendation)}`}>
                      {recommendation}
                    </span>
                    <span className="text-xs text-dark-text-secondary">
                      {data.stock_count} stocks
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(data.average_score)}`}>
                    {data.average_score.toFixed(1)}
                  </div>
                  <div className="text-xs text-dark-text-secondary">Avg Score</div>
                </div>
              </div>

              {/* Score Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-dark-text-secondary mb-1">
                  <span>Average Score</span>
                  <span>{data.average_score.toFixed(1)}/100</span>
                </div>
                <div className="w-full bg-dark-card rounded-full h-3">
                  <div
                    className={`${getScoreColor(data.average_score)} h-3 rounded-full transition-all`}
                    style={{ 
                      width: `${Math.min(100, data.average_score)}%`,
                      backgroundColor: data.average_score >= 70 ? '#10b981' : 
                                     data.average_score >= 60 ? '#fbbf24' : 
                                     data.average_score >= 40 ? '#f97316' : '#ef4444'
                    }}
                  ></div>
                </div>
              </div>

              {/* Recommendation Breakdown */}
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="bg-green-buy/20 p-2 rounded text-center">
                  <div className="text-lg font-bold text-green-buy">{data.buy_count}</div>
                  <div className="text-xs text-dark-text-secondary">BUY</div>
                </div>
                <div className="bg-yellow-neutral/20 p-2 rounded text-center">
                  <div className="text-lg font-bold text-yellow-neutral">{data.hold_count}</div>
                  <div className="text-xs text-dark-text-secondary">HOLD</div>
                </div>
                <div className="bg-red-sell/20 p-2 rounded text-center">
                  <div className="text-lg font-bold text-red-sell">{data.sell_count}</div>
                  <div className="text-xs text-dark-text-secondary">SELL</div>
                </div>
                <div className="bg-blue-accent/20 p-2 rounded text-center">
                  <div className="text-lg font-bold text-blue-accent">{(data.buy_ratio * 100).toFixed(0)}%</div>
                  <div className="text-xs text-dark-text-secondary">Buy Ratio</div>
                </div>
              </div>

              {/* Stock List */}
              {data.stocks && data.stocks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-dark-border">
                  <div className="text-xs text-dark-text-secondary mb-2">Stocks in Sector:</div>
                  <div className="flex flex-wrap gap-2">
                    {data.stocks.map((stock) => (
                      <span
                        key={stock}
                        className="px-2 py-1 bg-dark-card rounded text-xs text-dark-text"
                      >
                        {stock}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SectorAnalysis;
