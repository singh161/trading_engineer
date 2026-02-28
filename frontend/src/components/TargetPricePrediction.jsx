import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';

function TargetPricePrediction() {
  const [predictions, setPredictions] = useState([]);
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

  useEffect(() => {
    loadPredictions();
    
    // Listen for analysis completion event
    const handleAnalysisComplete = () => {
      loadPredictions();
    };
    window.addEventListener('ai-analysis-complete', handleAnalysisComplete);
    
    return () => {
      window.removeEventListener('ai-analysis-complete', handleAnalysisComplete);
    };
  }, [filterTicker]);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use getTargetPrices API which supports ticker filter
      const data = await aiStockAPI.getTargetPrices(filterTicker, 0.0);
      
      // Extract target price data from API response
      const predictionList = data.predictions || [];
      
      // Sort by potential gain
      predictionList.sort((a, b) => b.price_change_pct - a.price_change_pct);
      
      setPredictions(predictionList);
    } catch (err) {
      setError(err.message || 'Failed to load predictions');
      console.error('Error loading predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChangeColor = (change) => {
    if (change > 5) return 'text-green-buy';
    if (change > 0) return 'text-yellow-neutral';
    return 'text-red-sell';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return 'text-green-buy';
    if (confidence >= 0.5) return 'text-yellow-neutral';
    return 'text-red-sell';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-accent mx-auto"></div>
        <p className="text-dark-text-secondary mt-2">Loading target price predictions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-sell mb-2">⚠️ {error}</div>
        <button
          onClick={loadPredictions}
          className="px-4 py-2 bg-blue-accent hover:bg-blue-accent/90 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🎯</div>
        <p className="text-dark-text mb-2">No predictions available</p>
        <p className="text-sm text-dark-text-secondary">
          Run "Complete Analysis" to generate ML-based target price predictions
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
        <h3 className="text-lg font-semibold text-dark-text mb-2">ML Target Price Predictions</h3>
        <p className="text-sm text-dark-text-secondary">
          AI-powered price predictions using XGBoost/RandomForest based on technical, sentiment, and fundamental data
        </p>
      </div>

      <div className="space-y-4">
        {predictions.map((pred) => (
          <div
            key={pred.symbol}
            className="bg-dark-bg border border-dark-border rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-dark-text">{pred.symbol}</h3>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  pred.recommendation === 'BUY' ? 'bg-green-buy/20 text-green-buy' :
                  pred.recommendation === 'SELL' ? 'bg-red-sell/20 text-red-sell' :
                  'bg-yellow-neutral/20 text-yellow-neutral'
                }`}>
                  {pred.recommendation}
                </span>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getChangeColor(pred.price_change_pct)}`}>
                  {pred.price_change_pct > 0 ? '+' : ''}
                  {pred.price_change_pct.toFixed(1)}%
                </div>
                <div className="text-xs text-dark-text-secondary">Expected Change</div>
              </div>
            </div>

            {/* Price Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-dark-card p-3 rounded">
                <div className="text-xs text-dark-text-secondary mb-1">Current Price</div>
                <div className="text-xl font-bold text-dark-text">
                  ₹{pred.current_price.toFixed(2)}
                </div>
              </div>
              <div className="bg-dark-card p-3 rounded">
                <div className="text-xs text-dark-text-secondary mb-1">Target Price</div>
                <div className="text-xl font-bold text-green-buy">
                  ₹{pred.target_price.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Confidence */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-dark-text-secondary mb-1">
                <span>ML Model Confidence</span>
                <span className={getConfidenceColor(pred.confidence)}>
                  {(pred.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-dark-card rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    pred.confidence >= 0.7 ? 'bg-green-buy' :
                    pred.confidence >= 0.5 ? 'bg-yellow-neutral' : 'bg-red-sell'
                  }`}
                  style={{ width: `${pred.confidence * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Price Range Visualization */}
            <div className="mt-4 pt-4 border-t border-dark-border">
              <div className="text-xs text-dark-text-secondary mb-2">Price Movement</div>
              <div className="relative h-8 bg-dark-card rounded flex items-center">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-blue-accent/30 rounded-l"
                  style={{
                    width: `${Math.min(100, (pred.current_price / pred.target_price) * 100)}%`,
                  }}
                ></div>
                <div className="absolute left-0 top-0 bottom-0 flex items-center px-2">
                  <div className="w-3 h-3 bg-blue-accent rounded-full"></div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 flex items-center px-2">
                  <div className="w-3 h-3 bg-green-buy rounded-full"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-dark-text-secondary">
                  <span>₹{pred.current_price.toFixed(0)}</span>
                  <span>₹{pred.target_price.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TargetPricePrediction;
