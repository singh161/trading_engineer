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
import { Rocket, BrainCircuit, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    { id: 'rankings', label: 'Smart Rankings', icon: '🏆' },
    { id: 'sector-ranking', label: 'Sector Performance', icon: '🥇' },
    { id: 'news-decisions', label: 'AI Decisions', icon: '💡' },
    { id: 'risk', label: 'Risk Analysis', icon: '🛡️' },
    { id: 'sector', label: 'Deep Dive', icon: '📈' },
    { id: 'news', label: 'News Feed', icon: '📰' },
    { id: 'sentiment', label: 'Sentiment', icon: '💭' },
    { id: 'fundamental', label: 'Fundamentals', icon: '📈' },
    { id: 'target', label: 'ML Targets', icon: '🎯' },
  ];

  const runCompleteAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      setAnalysisStatus({ status: 'running', message: 'Initializing Neural Research Engine...' });

      const defaultStocks = [
        'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
        'BHARTIARTL', 'SBIN', 'BAJFINANCE', 'WIPRO', 'HINDUNILVR',
        'ITC', 'KOTAKBANK', 'LT', 'AXISBANK', 'MARUTI'
      ];

      const result = await aiStockAPI.runAnalysis(defaultStocks, false);

      if (result.status === 'success') {
        setAnalysisStatus({
          status: 'success',
          message: `Intelligence update complete. ${result.stocks_analyzed} entities processed.`,
        });
        setTimeout(() => {
          setAnalysisStatus(null);
          window.dispatchEvent(new Event('ai-analysis-complete'));
        }, 3000);
      } else {
        setError(result.error || 'Deep research failed');
        setAnalysisStatus({ status: 'error', message: 'Analysis failed' });
      }
    } catch (err) {
      console.error('AI Analysis Error:', err);
      let errorMessage = 'Neural network research failed';
      if (err.response) {
        if (err.response.status === 404) errorMessage = 'AI core offline. Restart required.';
        else errorMessage = `B-End Error: ${err.response.data?.detail || 'Logic fault'}`;
      } else if (err.request) {
        errorMessage = 'Link to AI Core severed (Check port 8000)';
      }
      setError(errorMessage);
      setAnalysisStatus({ status: 'error', message: 'Analysis failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-xl shadow-purple-500/20">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">
              A.I. Research <span className="text-purple-500 italic">Engine</span>
            </h2>
          </div>
          <p className="text-slate-400 text-sm font-medium pl-14 max-w-xl leading-relaxed">
            Harnessing proprietary ML models for autonomous sentiment analysis, multi-factor ranking, and institutional-grade risk assessment.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button
            onClick={runCompleteAnalysis}
            disabled={loading}
            className={`
              relative px-8 py-4 rounded-2xl font-black text-sm tracking-widest uppercase overflow-hidden transition-all duration-500
              ${loading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105 active:scale-95 shadow-xl shadow-purple-500/20'}
            `}
          >
            <div className="relative z-10 flex items-center gap-3">
              {loading ? <Activity className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
              <span>{loading ? 'Analyzing...' : 'Start Deep Scan'}</span>
            </div>
            {!loading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
            )}
          </button>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2 group-hover:text-blue-400 transition-colors">
            {loading ? "Neural processing in progress..." : "One click for full intelligence update"}
          </span>
        </div>
      </div>

      {/* Status Indicators */}
      {(analysisStatus || error) && (
        <div className={`relative z-10 mb-8 p-5 rounded-2xl backdrop-blur-md border ${error ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
          analysisStatus?.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
            'bg-blue-500/10 border-blue-500/30 text-blue-400'
          } transition-all duration-500 animate-in fade-in slide-in-from-top-4`}>
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-xl bg-current opacity-20`}>
              {error ? <AlertCircle className="w-5 h-5" /> :
                analysisStatus?.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                  <Activity className="w-5 h-5 animate-spin" />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest opacity-60">System Notification</span>
              <span className="text-sm font-bold">{error || analysisStatus?.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modern Tab System */}
      <div className="relative z-10 flex flex-wrap gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-5 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center gap-2 whitespace-nowrap group/tab
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 z-10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}
              `}
            >
              <span className={`text-base ${isActive ? 'opacity-100' : 'opacity-60 grayscale group-hover/tab:grayscale-0'} transition-all`}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Quick Navigation Guide - User Friendly Segment */}
      <div className="relative z-10 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '🎯', title: 'Smart Rankings', desc: 'Is tab mein aapko best "Buy & Sell" stocks ki list milegi, with AI confidence score.' },
          { icon: '🌐', title: 'Sector Power', desc: 'Check karein kaun sa industry sector (Banking, IT, etc.) aaj sabse zyada strong hai.' },
          { icon: '💡', title: 'AI Insights', desc: 'Neural analysis se samjhein market ke trends aur technical warnings ko simple language mein.' }
        ].map((guide, i) => (
          <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{guide.icon}</span>
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">{guide.title}</h4>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">{guide.desc}</p>
          </div>
        ))}
      </div>

      {/* Content Viewport with Entrance Animation */}
      <div className="relative z-10 mt-6 min-h-[400px] animate-in fade-in zoom-in-95 duration-500">
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
