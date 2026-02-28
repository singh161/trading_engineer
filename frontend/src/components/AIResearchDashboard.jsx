import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';
import NewsFeed from './NewsFeed';
import SentimentAnalysis from './SentimentAnalysis';
import FundamentalAnalysis from './FundamentalAnalysis';
import TargetPricePrediction from './TargetPricePrediction';
import SmartRankings from './SmartRankings';
import RiskAnalysis from './RiskAnalysis';
import SectorAnalysis from './SectorAnalysis';
import SectorRanking from './SectorRanking';
import NewsDecisions from './NewsDecisions';

function AIResearchDashboard({ onStockClick }) {
  const [activeTab, setActiveTab] = useState('rankings');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [voiceFilters, setVoiceFilters] = useState(null);

  // Listen for voice command filter events
  useEffect(() => {
    const handleVoiceFilter = (event) => {
      setVoiceFilters(event.detail);
    };

    const handleVoiceTab = (event) => {
      if (event.detail?.tab) {
        setActiveTab(event.detail.tab);
      }
    };

    window.addEventListener('voice-command-filter', handleVoiceFilter);
    window.addEventListener('voice-command-tab', handleVoiceTab);

    // Check sessionStorage for filters on mount
    const storedFilters = sessionStorage.getItem('voiceCommandFilters');
    if (storedFilters) {
      try {
        setVoiceFilters(JSON.parse(storedFilters));
        sessionStorage.removeItem('voiceCommandFilters');
      } catch (e) {
        console.error('Error parsing stored filters:', e);
      }
    }

    return () => {
      window.removeEventListener('voice-command-filter', handleVoiceFilter);
      window.removeEventListener('voice-command-tab', handleVoiceTab);
    };
  }, []);

  const tabs = [
    { id: 'rankings', label: '📊 Smart Rankings', icon: '🏆' },
    { id: 'sector-ranking', label: '📊 Sector Ranking', icon: '🥇' },
    { id: 'news-decisions', label: '📰 News Decisions', icon: '💡' },
    { id: 'risk', label: '🛡️ Risk Analysis', icon: '🛡️' },
    { id: 'sector', label: '📊 Sector Analysis', icon: '📈' },
    { id: 'news', label: '📰 News Feed', icon: '📰' },
    { id: 'sentiment', label: '😊 Sentiment', icon: '💭' },
    { id: 'fundamental', label: '💰 Fundamentals', icon: '📈' },
    { id: 'target', label: '🎯 Target Price', icon: '🎯' },
  ];

  const runCompleteAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      setAnalysisStatus({ status: 'running', message: 'Starting AI analysis...' });

      // Get list of popular Indian stocks for analysis (NSE listed)
      const defaultStocks = [
        'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 
        'BHARTIARTL', 'SBIN', 'BAJFINANCE', 'WIPRO', 'HINDUNILVR',
        'ITC', 'KOTAKBANK', 'LT', 'AXISBANK', 'MARUTI'
      ];
      
      const result = await aiStockAPI.runAnalysis(defaultStocks, false);
      
      if (result.status === 'success') {
        setAnalysisStatus({
          status: 'success',
          message: `Analysis complete! ${result.stocks_analyzed} stocks analyzed in ${result.execution_time_seconds?.toFixed(1)}s`,
        });
        // Refresh data without full page reload
        setTimeout(() => {
          // Trigger refresh in child components
          setAnalysisStatus(null);
          // Force re-render by updating a dummy state
          window.dispatchEvent(new Event('ai-analysis-complete'));
        }, 1000);
      } else {
        setError(result.error || 'Analysis failed');
        setAnalysisStatus({ status: 'error', message: 'Analysis failed' });
      }
    } catch (err) {
      console.error('AI Analysis Error:', err);
      let errorMessage = 'Failed to run analysis';
      
      if (err.response) {
        // API error
        if (err.response.status === 404) {
          errorMessage = 'AI endpoints not found. Please restart backend server!';
        } else if (err.response.status === 500) {
          errorMessage = `Backend error: ${err.response.data?.detail || 'Server error'}`;
        } else {
          errorMessage = `API Error (${err.response.status}): ${err.response.data?.detail || err.message}`;
        }
      } else if (err.request) {
        errorMessage = 'Cannot connect to backend. Is backend running on port 8000?';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      setAnalysisStatus({ status: 'error', message: 'Analysis failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-dark-text flex items-center gap-2">
            <span>🤖</span>
            AI Stock Research Engine
          </h2>
          <p className="text-sm text-dark-text-secondary mt-1">
            Autonomous AI-powered stock analysis with news, sentiment, fundamentals & ML predictions
          </p>
        </div>
        <button
          onClick={runCompleteAnalysis}
          disabled={loading}
          className="px-6 py-3 rounded-lg font-medium transition-all bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Running Analysis...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Run Complete Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Status Messages */}
      {analysisStatus && (
        <div className={`mb-4 p-4 rounded-lg ${
          analysisStatus.status === 'success' 
            ? 'bg-green-buy/20 border border-green-buy' 
            : analysisStatus.status === 'error'
            ? 'bg-red-sell/20 border border-red-sell'
            : 'bg-blue-accent/20 border border-blue-accent'
        }`}>
          <div className="flex items-center gap-2">
            {analysisStatus.status === 'success' && <span>✅</span>}
            {analysisStatus.status === 'error' && <span>❌</span>}
            {analysisStatus.status === 'running' && <span className="animate-spin">⏳</span>}
            <span className="text-dark-text">{analysisStatus.message}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-sell/20 border border-red-sell">
          <div className="flex items-center gap-2 text-red-sell">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-dark-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-accent text-white'
                : 'bg-dark-bg text-dark-text-secondary hover:bg-dark-border'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'rankings' && <SmartRankings onStockClick={onStockClick} />}
        {activeTab === 'sector-ranking' && <SectorRanking />}
        {activeTab === 'news-decisions' && <NewsDecisions />}
        {activeTab === 'risk' && <RiskAnalysis />}
        {activeTab === 'sector' && <SectorAnalysis />}
        {activeTab === 'news' && <NewsFeed />}
        {activeTab === 'sentiment' && <SentimentAnalysis />}
        {activeTab === 'fundamental' && <FundamentalAnalysis />}
        {activeTab === 'target' && <TargetPricePrediction />}
      </div>
    </div>
  );
}

export default AIResearchDashboard;
