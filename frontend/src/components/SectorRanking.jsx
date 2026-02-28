import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';

function SectorRanking() {
  const [rankedSectors, setRankedSectors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [limit, setLimit] = useState(20);

  // Listen for voice command filters
  useEffect(() => {
    const handleVoiceFilter = (event) => {
      const filters = event.detail;
      if (filters?.category) {
        // Map backend sector names to frontend filter values
        const categoryMap = {
          'BANKING': 'BUY',
          'IT': 'BUY',
          'PHARMA': 'BUY',
          // Add more mappings as needed
        };
        setFilterCategory(categoryMap[filters.category] || filters.category || 'ALL');
      }
      if (filters?.limit) {
        setLimit(filters.limit);
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

  const loadRanking = async () => {
    try {
      setLoading(true);
      setError(null);
      const category = filterCategory === 'ALL' ? null : filterCategory;
      const data = await aiStockAPI.getSectorRanking(category, limit);
      if (data.ranked_sectors && data.ranked_sectors.length > 0) {
        setRankedSectors(data.ranked_sectors);
        setSummary(data.summary);
      } else {
        setRankedSectors([]);
        setSummary(null);
      }
    } catch (err) {
      console.error('Error loading sector ranking:', err);
      setError('Failed to load sector ranking');
      setRankedSectors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking();
    
    const handleAnalysisComplete = () => {
      setTimeout(loadRanking, 1000);
    };
    window.addEventListener('ai-analysis-complete', handleAnalysisComplete);
    
    return () => {
      window.removeEventListener('ai-analysis-complete', handleAnalysisComplete);
    };
  }, [filterCategory, limit]);

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-dark-text-secondary';
  };

  const getRecommendationColor = (rec) => {
    if (rec.includes('STRONG BUY')) return 'text-green-buy bg-green-buy/20 border-green-buy/50';
    if (rec === 'BUY') return 'text-green-buy bg-green-buy/20 border-green-buy/50';
    if (rec === 'SELL') return 'text-red-sell bg-red-sell/20 border-red-sell/50';
    return 'text-yellow-neutral bg-yellow-neutral/20 border-yellow-neutral/50';
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-buy';
    if (score >= 60) return 'text-yellow-neutral';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-sell';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4 animate-spin">⚙️</div>
        <p className="text-dark-text">Loading sector ranking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-sell mb-2">{error}</p>
        <button
          onClick={loadRanking}
          className="px-4 py-2 bg-blue-accent text-white rounded-lg hover:bg-blue-accent/80"
        >
          Retry
        </button>
      </div>
    );
  }

  if (rankedSectors.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-dark-text mb-2">No sector ranking available</p>
        <p className="text-sm text-dark-text-secondary">
          Run "Complete Analysis" to generate sector rankings
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
            <div className="text-xs text-dark-text-secondary mb-1">Total Sectors</div>
            <div className="text-xl font-bold text-dark-text">{summary.total_sectors}</div>
          </div>
          <div className="bg-green-buy/20 border border-green-buy/50 rounded-lg p-3">
            <div className="text-xs text-dark-text-secondary mb-1">BUY Sectors</div>
            <div className="text-xl font-bold text-green-buy">{summary.buy_sectors + summary.strong_buy_sectors}</div>
          </div>
          <div className="bg-yellow-neutral/20 border border-yellow-neutral/50 rounded-lg p-3">
            <div className="text-xs text-dark-text-secondary mb-1">HOLD Sectors</div>
            <div className="text-xl font-bold text-yellow-neutral">{summary.hold_sectors}</div>
          </div>
          <div className="bg-red-sell/20 border border-red-sell/50 rounded-lg p-3">
            <div className="text-xs text-dark-text-secondary mb-1">SELL Sectors</div>
            <div className="text-xl font-bold text-red-sell">{summary.sell_sectors}</div>
          </div>
          <div className="bg-blue-accent/20 border border-blue-accent/50 rounded-lg p-3">
            <div className="text-xs text-dark-text-secondary mb-1">Top 3 Avg</div>
            <div className="text-xl font-bold text-blue-accent">
              {summary.top_3_sectors.length > 0
                ? (summary.top_3_sectors.reduce((sum, s) => sum + s.average_score, 0) / summary.top_3_sectors.length).toFixed(1)
                : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-dark-text mb-2">Sector Ranking</h3>
            <p className="text-sm text-dark-text-secondary">
              Sectors ranked by average performance ({rankedSectors.length} sectors)
            </p>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text"
          >
            <option value="ALL">All Sectors</option>
            <option value="BUY">BUY Sectors</option>
            <option value="HOLD">HOLD Sectors</option>
            <option value="SELL">SELL Sectors</option>
          </select>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="space-y-3">
        {rankedSectors.map((sector) => (
          <div
            key={sector.sector}
            className={`bg-dark-bg border-2 rounded-lg p-4 ${getRecommendationColor(sector.recommendation)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold ${getRankColor(sector.rank)}`}>
                  #{sector.rank}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-dark-text">{sector.sector}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-dark-card text-dark-text">
                      {sector.recommendation}
                    </span>
                    <span className="text-xs text-dark-text-secondary">
                      {sector.stock_count} stocks
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(sector.average_score)}`}>
                  {sector.average_score.toFixed(1)}
                </div>
                <div className="text-xs text-dark-text-secondary">Avg Score</div>
              </div>
            </div>

            {/* Score Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-dark-text-secondary mb-1">
                <span>Average Score</span>
                <span>{sector.average_score.toFixed(1)}/100</span>
              </div>
              <div className="w-full bg-dark-card rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    sector.average_score >= 70 ? 'bg-green-buy' :
                    sector.average_score >= 60 ? 'bg-yellow-neutral' :
                    sector.average_score >= 40 ? 'bg-orange-500' : 'bg-red-sell'
                  }`}
                  style={{ width: `${Math.min(100, sector.average_score)}%` }}
                ></div>
              </div>
            </div>

            {/* Recommendation Breakdown */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="bg-green-buy/20 p-2 rounded text-center">
                <div className="text-lg font-bold text-green-buy">{sector.buy_count}</div>
                <div className="text-xs text-dark-text-secondary">BUY</div>
              </div>
              <div className="bg-yellow-neutral/20 p-2 rounded text-center">
                <div className="text-lg font-bold text-yellow-neutral">{sector.hold_count}</div>
                <div className="text-xs text-dark-text-secondary">HOLD</div>
              </div>
              <div className="bg-red-sell/20 p-2 rounded text-center">
                <div className="text-lg font-bold text-red-sell">{sector.sell_count}</div>
                <div className="text-xs text-dark-text-secondary">SELL</div>
              </div>
              <div className="bg-blue-accent/20 p-2 rounded text-center">
                <div className="text-lg font-bold text-blue-accent">{(sector.buy_ratio * 100).toFixed(0)}%</div>
                <div className="text-xs text-dark-text-secondary">Buy Ratio</div>
              </div>
            </div>

            {/* Stock List */}
            {sector.stocks && sector.stocks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-dark-border">
                <div className="text-xs text-dark-text-secondary mb-2">Stocks in Sector:</div>
                <div className="flex flex-wrap gap-2">
                  {sector.stocks.map((stock) => (
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
        ))}
      </div>
    </div>
  );
}

export default SectorRanking;
