import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';

function NewsFeed() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTicker, setFilterTicker] = useState('');

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
    loadNews();
    
    // Listen for analysis completion event
    const handleAnalysisComplete = () => {
      loadNews();
    };
    window.addEventListener('ai-analysis-complete', handleAnalysisComplete);
    
    return () => {
      window.removeEventListener('ai-analysis-complete', handleAnalysisComplete);
    };
  }, [filterTicker]);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiStockAPI.getNews(filterTicker || null, 50);
      setNews(data.news || []);
    } catch (err) {
      setError(err.message || 'Failed to load news');
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive') return 'text-green-buy';
    if (sentiment === 'negative') return 'text-red-sell';
    return 'text-yellow-neutral';
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment === 'positive') return '📈';
    if (sentiment === 'negative') return '📉';
    return '➡️';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-accent mx-auto"></div>
        <p className="text-dark-text-secondary mt-2">Loading news...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-sell mb-2">⚠️ {error}</div>
        <button
          onClick={loadNews}
          className="px-4 py-2 bg-blue-accent hover:bg-blue-accent/90 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📰</div>
        <p className="text-dark-text mb-2">No news available</p>
        <p className="text-sm text-dark-text-secondary">
          Run "Complete Analysis" to collect news from RSS feeds and NewsAPI
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by ticker (e.g., RELIANCE)..."
          value={filterTicker}
          onChange={(e) => setFilterTicker(e.target.value.toUpperCase())}
          className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:border-blue-accent"
        />
      </div>

      {/* News List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {news.map((item, index) => (
          <div
            key={index}
            className="bg-dark-bg border border-dark-border rounded-lg p-4 hover:border-blue-accent transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {item.ticker && (
                    <span className="px-2 py-1 bg-blue-accent/20 text-blue-accent rounded text-xs font-semibold">
                      {item.ticker}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getSentimentColor(
                      item.sentiment
                    )} bg-${getSentimentColor(item.sentiment).replace('text-', '')}/20`}
                  >
                    {getSentimentIcon(item.sentiment)} {item.sentiment?.toUpperCase() || 'NEUTRAL'}
                  </span>
                  {item.confidence && (
                    <span className="text-xs text-dark-text-secondary">
                      Confidence: {(item.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-dark-text mb-2">{item.title}</h3>

                {/* Snippet */}
                {item.snippet && (
                  <p className="text-sm text-dark-text-secondary mb-3 line-clamp-2">
                    {item.snippet}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center gap-4 text-xs text-dark-text-secondary">
                  {item.source && (
                    <span className="capitalize">Source: {item.source}</span>
                  )}
                  {item.published_at && (
                    <span>
                      {new Date(item.published_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Link */}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-accent hover:bg-blue-accent/90 text-white rounded text-sm transition-all flex-shrink-0"
                >
                  Read →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-buy">
              {news.filter((n) => n.sentiment === 'positive').length}
            </div>
            <div className="text-xs text-dark-text-secondary">Positive</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-neutral">
              {news.filter((n) => n.sentiment === 'neutral').length}
            </div>
            <div className="text-xs text-dark-text-secondary">Neutral</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-sell">
              {news.filter((n) => n.sentiment === 'negative').length}
            </div>
            <div className="text-xs text-dark-text-secondary">Negative</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsFeed;
