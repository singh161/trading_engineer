import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';

function SentimentAnalysis() {
  const [sentimentData, setSentimentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSentiment();
    
    // Listen for analysis completion event
    const handleAnalysisComplete = () => {
      loadSentiment();
    };
    window.addEventListener('ai-analysis-complete', handleAnalysisComplete);
    
    return () => {
      window.removeEventListener('ai-analysis-complete', handleAnalysisComplete);
    };
  }, []);

  const loadSentiment = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiStockAPI.getNews(null, 100);
      
      // Aggregate sentiment by ticker
      const tickerMap = {};
      (data.news || []).forEach((item) => {
        if (!item.ticker) return;
        
        if (!tickerMap[item.ticker]) {
          tickerMap[item.ticker] = {
            ticker: item.ticker,
            total_news: 0,
            positive_count: 0,
            negative_count: 0,
            neutral_count: 0,
            avg_sentiment_score: 0,
            avg_confidence: 0,
            news_items: [],
          };
        }
        
        const tickerData = tickerMap[item.ticker];
        tickerData.total_news++;
        tickerData.news_items.push(item);
        
        if (item.sentiment === 'positive') tickerData.positive_count++;
        else if (item.sentiment === 'negative') tickerData.negative_count++;
        else tickerData.neutral_count++;
        
        tickerData.avg_sentiment_score += item.sentiment_score || 0;
        tickerData.avg_confidence += item.confidence || 0;
      });
      
      // Calculate averages
      Object.values(tickerMap).forEach((data) => {
        if (data.total_news > 0) {
          data.avg_sentiment_score /= data.total_news;
          data.avg_confidence /= data.total_news;
        }
      });
      
      // Sort by sentiment score
      const sorted = Object.values(tickerMap).sort(
        (a, b) => b.avg_sentiment_score - a.avg_sentiment_score
      );
      
      setSentimentData(sorted);
    } catch (err) {
      setError(err.message || 'Failed to load sentiment data');
      console.error('Error loading sentiment:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (score) => {
    if (score > 0.3) return 'text-green-buy';
    if (score < -0.3) return 'text-red-sell';
    return 'text-yellow-neutral';
  };

  const getSentimentLabel = (score) => {
    if (score > 0.3) return 'Very Positive';
    if (score > 0.1) return 'Positive';
    if (score < -0.3) return 'Very Negative';
    if (score < -0.1) return 'Negative';
    return 'Neutral';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-accent mx-auto"></div>
        <p className="text-dark-text-secondary mt-2">Loading sentiment analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-sell mb-2">⚠️ {error}</div>
        <button
          onClick={loadSentiment}
          className="px-4 py-2 bg-blue-accent hover:bg-blue-accent/90 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (sentimentData.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">💭</div>
        <p className="text-dark-text mb-2">No sentiment data available</p>
        <p className="text-sm text-dark-text-secondary">
          Run "Complete Analysis" to analyze news sentiment
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
        <h3 className="text-lg font-semibold text-dark-text mb-2">Sentiment Overview</h3>
        <p className="text-sm text-dark-text-secondary">
          Sentiment analysis of {sentimentData.length} stocks based on news articles
        </p>
      </div>

      <div className="space-y-4">
        {sentimentData.map((data) => (
          <div
            key={data.ticker}
            className="bg-dark-bg border border-dark-border rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-dark-text">{data.ticker}</h3>
                <p className="text-sm text-dark-text-secondary">
                  {data.total_news} news articles analyzed
                </p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getSentimentColor(data.avg_sentiment_score)}`}>
                  {getSentimentLabel(data.avg_sentiment_score)}
                </div>
                <div className="text-xs text-dark-text-secondary">
                  Score: {data.avg_sentiment_score.toFixed(3)}
                </div>
              </div>
            </div>

            {/* Sentiment Breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-green-buy/20 p-2 rounded text-center">
                <div className="text-lg font-bold text-green-buy">{data.positive_count}</div>
                <div className="text-xs text-dark-text-secondary">Positive</div>
              </div>
              <div className="bg-yellow-neutral/20 p-2 rounded text-center">
                <div className="text-lg font-bold text-yellow-neutral">{data.neutral_count}</div>
                <div className="text-xs text-dark-text-secondary">Neutral</div>
              </div>
              <div className="bg-red-sell/20 p-2 rounded text-center">
                <div className="text-lg font-bold text-red-sell">{data.negative_count}</div>
                <div className="text-xs text-dark-text-secondary">Negative</div>
              </div>
            </div>

            {/* Confidence */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-dark-text-secondary mb-1">
                <span>Confidence</span>
                <span>{(data.avg_confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-dark-card rounded-full h-2">
                <div
                  className="bg-blue-accent h-2 rounded-full transition-all"
                  style={{ width: `${data.avg_confidence * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SentimentAnalysis;
