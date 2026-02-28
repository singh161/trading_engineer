import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';

function NewsDecisions() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');

  const loadDecisions = async () => {
    try {
      setLoading(true);
      setError(null);
      const category = filterCategory === 'ALL' ? null : filterCategory;
      const data = await aiStockAPI.getNewsDecisions(null, category);
      if (data.decisions && data.decisions.length > 0) {
        setDecisions(data.decisions);
      } else {
        setDecisions([]);
      }
    } catch (err) {
      console.error('Error loading news decisions:', err);
      setError('Failed to load news-based decisions');
      setDecisions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecisions();
    
    const handleAnalysisComplete = () => {
      setTimeout(loadDecisions, 1000);
    };
    window.addEventListener('ai-analysis-complete', handleAnalysisComplete);
    
    return () => {
      window.removeEventListener('ai-analysis-complete', handleAnalysisComplete);
    };
  }, [filterCategory]);

  const getDecisionColor = (decision) => {
    if (decision.includes('STRONG BUY')) return 'text-green-buy bg-green-buy/20 border-green-buy/50';
    if (decision === 'BUY') return 'text-green-buy bg-green-buy/20 border-green-buy/50';
    if (decision.includes('STRONG SELL')) return 'text-red-sell bg-red-sell/20 border-red-sell/50';
    if (decision === 'SELL') return 'text-red-sell bg-red-sell/20 border-red-sell/50';
    return 'text-yellow-neutral bg-yellow-neutral/20 border-yellow-neutral/50';
  };

  const getSentimentColor = (score) => {
    if (score > 0.3) return 'text-green-buy';
    if (score < -0.3) return 'text-red-sell';
    return 'text-yellow-neutral';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4 animate-spin">⚙️</div>
        <p className="text-dark-text">Loading news-based decisions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-sell mb-2">{error}</p>
        <button
          onClick={loadDecisions}
          className="px-4 py-2 bg-blue-accent text-white rounded-lg hover:bg-blue-accent/80"
        >
          Retry
        </button>
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📰</div>
        <p className="text-dark-text mb-2">No news-based decisions available</p>
        <p className="text-sm text-dark-text-secondary">
          Run "Complete Analysis" to generate news-based trading decisions
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-dark-text mb-2">News-Based Trading Decisions</h3>
            <p className="text-sm text-dark-text-secondary">
              Trading decisions based on news sentiment analysis ({decisions.length} stocks)
            </p>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text"
          >
            <option value="ALL">All Decisions</option>
            <option value="BUY">BUY</option>
            <option value="HOLD">HOLD</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {decisions.map((decision) => (
          <div
            key={decision.ticker}
            className={`bg-dark-bg border-2 rounded-lg p-4 ${getDecisionColor(decision.recommendation)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-dark-text">{decision.ticker}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-1 rounded text-sm font-semibold bg-dark-card text-dark-text">
                    {decision.recommendation}
                  </span>
                  <span className="text-xs text-dark-text-secondary">
                    {decision.news_count} news articles
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getSentimentColor(decision.sentiment_score)}`}>
                  {decision.sentiment_score > 0 ? '+' : ''}
                  {decision.sentiment_score.toFixed(2)}
                </div>
                <div className="text-xs text-dark-text-secondary">Sentiment</div>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-dark-text-secondary mb-1">
                <span>Decision Confidence</span>
                <span>{(decision.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-dark-card rounded-full h-2">
                <div
                  className="bg-blue-accent h-2 rounded-full transition-all"
                  style={{ width: `${decision.confidence * 100}%` }}
                ></div>
              </div>
            </div>

            {/* News Breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-green-buy/20 p-2 rounded text-center">
                <div className="text-lg font-bold text-green-buy">{decision.positive_news || 0}</div>
                <div className="text-xs text-dark-text-secondary">Positive</div>
              </div>
              <div className="bg-yellow-neutral/20 p-2 rounded text-center">
                <div className="text-lg font-bold text-yellow-neutral">{decision.neutral_news || 0}</div>
                <div className="text-xs text-dark-text-secondary">Neutral</div>
              </div>
              <div className="bg-red-sell/20 p-2 rounded text-center">
                <div className="text-lg font-bold text-red-sell">{decision.negative_news || 0}</div>
                <div className="text-xs text-dark-text-secondary">Negative</div>
              </div>
            </div>

            {/* Reasoning */}
            {decision.reasoning && (
              <div className="mt-4 pt-4 border-t border-dark-border">
                <div className="text-xs font-semibold text-dark-text-secondary mb-2">Decision Reasoning:</div>
                <p className="text-sm text-dark-text">{decision.reasoning}</p>
              </div>
            )}

            {/* Key Headlines */}
            {decision.key_headlines && decision.key_headlines.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dark-border">
                <div className="text-xs font-semibold text-dark-text-secondary mb-2">Key Headlines:</div>
                <ul className="space-y-1">
                  {decision.key_headlines.map((headline, idx) => (
                    <li key={idx} className="text-xs text-dark-text flex items-start gap-2">
                      <span>•</span>
                      <span>{headline}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NewsDecisions;
