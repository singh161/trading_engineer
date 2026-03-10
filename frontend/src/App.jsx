import React, { useState, useEffect, useCallback, useRef } from 'react';
import { stockAPI, aiStockAPI } from './services/api';
import StockTable from './components/StockTable';
import StockCard from './components/StockCard';
import ModeSelector from './components/ModeSelector';
import MarketIndex from './components/MarketIndex';
import Filters from './components/Filters';
import AIResearchDashboard from './components/AIResearchDashboard';
import AIVoiceAssistant from './components/AIVoiceAssistant';
import DashboardSidebar from './components/DashboardSidebar';
import DashboardHeader from './components/DashboardHeader';
import DashboardStats from './components/DashboardStats';
import NewsFeed from './components/NewsFeed';
import NewsDecisions from './components/NewsDecisions';
import Watchlist from './components/Watchlist';
import Alerts from './components/Alerts';
import MarketMood from './components/MarketMood';
import MarketHeatmap from './components/MarketHeatmap';
import SpotlightSearch from './components/SpotlightSearch';
import MarketTicker from './components/MarketTicker';
import StockDetailModal from './components/StockDetailModal';
import MomentumBreakouts from './components/MomentumBreakouts';
import HinglishTour from './components/HinglishTour';
import NSEIndicesMenu from './components/NSEIndicesMenu';
import TradingPanel from './components/TradingPanel';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  // State
  const [stocks, setStocks] = useState([]);
  const [analyses, setAnalyses] = useState({});
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [mode, setMode] = useState('swing');
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [error, setError] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [topStocks, setTopStocks] = useState([]);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [showAIResearch, setShowAIResearch] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(true);

  // Dashboard specific state
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showVoiceCommand, setShowVoiceCommand] = useState(false);
  const [voiceNotificationsEnabled, setVoiceNotificationsEnabled] = useState(true);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [initialLoadFinished, setInitialLoadFinished] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Use Ref for analyses to avoid stale closure in WS handler
  const analysesRef = useRef({});
  useEffect(() => {
    analysesRef.current = analyses;
  }, [analyses]);

  // Voice alert function
  const speak = useCallback((text) => {
    if (!voiceNotificationsEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Try to find a Hindi or Indian English voice for natural accent
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('hi')) ||
      voices.find(v => v.lang.includes('en-IN')) ||
      voices.find(v => v.name.includes('Google')) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  }, [voiceNotificationsEnabled]);

  // Load stocks from API
  const loadStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stocksData = await stockAPI.getAllStocks(false, null);

      if (Array.isArray(stocksData)) {
        setStocks(stocksData);
        setApiConnected(true);
        if (stocksData.length === 0) {
          setError('No stocks found in database.');
        }
      } else {
        setStocks([]);
        setError('Invalid response from API.');
      }
    } catch (error) {
      setStocks([]);
      setApiConnected(false);
      setError(
        error.code === 'ECONNREFUSED'
          ? 'Cannot connect to backend. Please start the FastAPI server.'
          : `Failed to load stocks: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load market index
  const loadMarketIndex = useCallback(async () => {
    try {
      const data = await stockAPI.getMarketIndex();
      setMarketData(data);
    } catch (error) {
      console.error('Error loading market index:', error);
    }
  }, []);

  // Trigger backend refresh
  const triggerBackendRefresh = useCallback(async () => {
    try {
      setAnalyzing(true);
      await stockAPI.refreshAllStocks(mode);
      loadMarketIndex();
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Error triggering backend refresh:', error);
    } finally {
      setAnalyzing(false);
    }
  }, [mode, loadMarketIndex]);

  // Analyze single stock
  const analyzeSingleStock = useCallback(async (symbol) => {
    try {
      setAnalyzing(true);
      const analysis = await stockAPI.analyzeStock(symbol, mode);
      setAnalyses((prev) => ({
        ...prev,
        [symbol]: analysis,
      }));
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
    } finally {
      setAnalyzing(false);
    }
  }, [mode]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      }
    };

    const handleStartGuide = () => {
      setShowTour(true);
    };
    window.addEventListener('start-guide-tour', handleStartGuide);

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('start-guide-tour', handleStartGuide);
    };
  }, []);

  // Show stock detail
  const showStockDetail = (symbol) => {
    setSelectedStock(symbol);
    setIsModalOpen(true);
    // If not already analyzed, trigger a quick analysis
    if (!analyses[symbol]) {
      analyzeSingleStock(symbol);
    }
  };

  // Initial load
  useEffect(() => {
    loadStocks();
    loadMarketIndex();
  }, [loadStocks, loadMarketIndex]);

  // Trigger initial backend refresh
  useEffect(() => {
    if (stocks.length > 0 && Object.keys(analyses).length === 0) {
      triggerBackendRefresh();
    }
  }, [stocks.length]);

  // Market hours detection in IST (Mon-Fri, 9:15 AM - 3:30 PM)
  useEffect(() => {
    const checkMarketHours = () => {
      const now = new Date();
      const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = istTime.getDay(); // 0 is Sunday, 1 is Monday...
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const timeInMinutes = hours * 60 + minutes;

      const marketStart = 9 * 60 + 15; // 9:15 AM
      const marketEnd = 15 * 60 + 30;  // 3:30 PM

      const isOpen = day >= 1 && day <= 5 && timeInMinutes >= marketStart && timeInMinutes <= marketEnd;
      setIsMarketOpen(isOpen);
    };

    checkMarketHours();
    const interval = setInterval(checkMarketHours, 60000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (stocks.length === 0) return;

    let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    let wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws/updates';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setSseConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'market_indices') {
          // Update core indices data
          const indicesData = data.indices.reduce((acc, idx) => {
            const name_map = {
              "NIFTY 50": "NIFTY",
              "NIFTY BANK": "BANKNIFTY",
              "NIFTY FIN SERVICE": "FINNIFTY"
            };
            const mappedName = name_map[idx.symbol];
            if (mappedName) {
              acc[mappedName] = idx;
            }
            return acc;
          }, {});

          setMarketData(prev => ({
            ...prev,
            ...indicesData,
            timestamp: data.timestamp
          }));
        }

        if (data.type === 'ai_best_stock_found') {
          const msg = `AI Scanner ko ek behtareen stock mila hai. ${data.symbol} ko check karein, iska score ${Math.round(data.score)} hai.`;
          toast.success(`🌟 AI Top Pick: ${data.symbol}`, {
            duration: 10000,
            icon: '🤖',
            style: { background: '#4c1d95', color: '#fff', border: '1px solid #a78bfa' }
          });
          speak(msg);
        }

        if (data.type === 'trade_auto_exit') {
          const { symbol, reason, price, pnl } = data;
          const msg = reason === 'SL_HIT'
            ? `Warning! ${symbol} ka stop loss hit ho gaya hai ${Math.round(price)} par. Trade close ho chuki hai.`
            : `Badhiya! ${symbol} ne target hit kar liya hai ${Math.round(price)} par. Profit book ho gaya hai.`;

          toast(
            (t) => (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 font-bold">
                  <span>{reason === 'SL_HIT' ? '🚨 SL Hit' : '🎯 Target Hit'}</span>
                  <span className="text-white/70">{symbol}</span>
                </div>
                <p className="text-sm opacity-90">Exited @ ₹{price}</p>
                <p className={`text-sm font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pnl >= 0 ? 'Profit' : 'Loss'}: ₹{Math.abs(Math.round(pnl))}
                </p>
              </div>
            ),
            {
              duration: 8000,
              style: {
                background: reason === 'SL_HIT' ? '#7f1d1d' : '#065f46',
                color: '#fff',
                border: `1px solid ${reason === 'SL_HIT' ? '#ef4444' : '#10b981'}`
              }
            }
          );
          speak(msg);
          // Refresh trading data
          window.dispatchEvent(new CustomEvent('trading-update'));
        }

        if (data.type === 'stock_update') {
          const newAnalysis = data.data;
          const symbol = data.symbol;
          const oldAnalysis = analysesRef.current[symbol]; // Use Ref for latest data

          // Logic for notifications (Hinglish Accent)
          // ONLY trigger if we already have a previous analysis (prevents burst on load)
          if (oldAnalysis) {
            // STRONG BUY Transition
            if (newAnalysis.final_verdict === 'STRONG BUY' && oldAnalysis.final_verdict !== 'STRONG BUY') {
              const msg = `Attention please! ${symbol} par Strong Buy signal mila hai. Current price hai ${Math.round(newAnalysis.price)} rupaye.`;
              toast.success(`🚀 New STRONG BUY Signal: ${symbol}`, {
                duration: 5000,
                icon: '🔥',
                style: { background: '#1e293b', color: '#fff', border: '1px solid #10b981' }
              });
              speak(msg);
            }

            // Target Price Hit Logic (Selling Target)
            const targetPrice = newAnalysis.sell_price || (newAnalysis.target_price?.target_price);
            if (targetPrice && newAnalysis.price >= targetPrice && oldAnalysis.price < targetPrice) {
              const msg = `Mubarak ho! ${symbol} ne apna target hit kar liya hai. Ab ye ${targetPrice} rupaye ke upar trade kar raha hai.`;
              toast.success(`🎯 Target Reached: ${symbol} hit ₹${targetPrice}!`, {
                duration: 8000,
                style: { background: '#064e3b', color: '#fff', border: '1px solid #10b981' }
              });
              speak(msg);
            }

            // Entry Price Hit Logic (Buy Order Level)
            if (newAnalysis.buy_price && newAnalysis.price <= newAnalysis.buy_price && oldAnalysis.price > newAnalysis.buy_price) {
              const msg = `${symbol} apne buying level par aa gaya hai. Current price hai ${newAnalysis.price} rupaye.`;
              toast.success(`📥 Entry Point: ${symbol} is at buy level ₹${newAnalysis.buy_price}`, {
                duration: 6000,
                icon: '💰',
                style: { background: '#1e3a8a', color: '#fff', border: '1px solid #3b82f6' }
              });
              speak(msg);
            }
          }

          setAnalyses((prev) => ({
            ...prev,
            [data.symbol]: data.data,
          }));
          setLastUpdateTime(new Date());
        }
      } catch (error) {
        console.error('Error parsing WS message:', error);
      }
    };

    ws.onerror = () => {
      setSseConnected(false);
      ws.close();
    };

    ws.onclose = () => {
      setSseConnected(false);
    };

    return () => {
      ws.close();
      setSseConnected(false);
    };
  }, [stocks.length]);

  // Filter stocks
  const filteredStocks = stocks.filter((stock) => {
    if (!stock) return false;

    const symbol = stock.symbol || stock.SYMBOL || stock.symbal_name || stock.name || stock.identifier_name || '';
    if (!symbol) return false;

    const matchesSearch = symbol.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') {
      return matchesSearch;
    }

    const analysis = analyses[symbol];
    if (!analysis) return false;

    const verdict = analysis.final_verdict || 'NEUTRAL';
    let matchesFilter = false;

    if (filter === 'STRONG BUY') {
      matchesFilter = verdict === 'STRONG BUY';
    } else if (filter === 'BUY') {
      matchesFilter = verdict === 'BUY' || verdict === 'STRONG BUY';
    } else if (filter === 'STRONG SELL') {
      matchesFilter = verdict === 'STRONG SELL';
    } else if (filter === 'SELL') {
      matchesFilter = verdict === 'SELL' || verdict === 'STRONG SELL';
    } else if (filter === 'NEUTRAL') {
      matchesFilter = verdict === 'NEUTRAL';
    } else {
      matchesFilter = verdict === filter;
    }

    return matchesSearch && matchesFilter;
  });

  // Render content based on active tab
  const renderContent = () => {
    if (activeTab === 'overview') {
      return (
        <div className="space-y-6">
          {/* Stats & Mood Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <DashboardStats stocks={stocks} analyses={analyses} />

              {/* Top Picks Quick View */}
              <div className="mt-6 bg-dark-card border border-dark-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
                    <span className="text-yellow-neutral">👑</span> Top AI Picks
                  </h3>
                  <button
                    onClick={() => setActiveTab('ai-research')}
                    className="text-xs text-blue-accent hover:underline"
                  >
                    View All Research
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.values(analyses)
                    .filter(a => a.final_verdict === 'STRONG BUY')
                    .sort((a, b) => (b.ai_recommendation?.confidence_score || 0) - (a.ai_recommendation?.confidence_score || 0))
                    .slice(0, 3)
                    .map(pick => (
                      <div key={pick.symbol} className="bg-dark-bg/50 border border-dark-border p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-bold text-dark-text">{pick.symbol}</div>
                          <div className="text-xs text-dark-text-secondary">₹{pick.price}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-green-buy">{pick.ai_recommendation?.confidence_score}%</div>
                          <div className="text-[10px] text-dark-text-secondary">Score</div>
                        </div>
                      </div>
                    ))}
                  {Object.values(analyses).filter(a => a.final_verdict === 'STRONG BUY').length === 0 && (
                    <div className="col-span-3 text-center py-2 text-sm text-dark-text-secondary">
                      Run complete analysis to see top picks.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <MarketMood
                buyCount={stocks.filter(s => {
                  const sym = s.symbol || s.SYMBOL || s.symbal_name || s.name || s.identifier_name;
                  return analyses[sym]?.final_verdict?.includes('BUY');
                }).length}
                sellCount={stocks.filter(s => {
                  const sym = s.symbol || s.SYMBOL || s.symbal_name || s.name || s.identifier_name;
                  return analyses[sym]?.final_verdict?.includes('SELL');
                }).length}
                total={Object.keys(analyses).length}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <MarketIndex marketData={marketData} loading={!marketData} />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <ModeSelector mode={mode} onModeChange={setMode} />
              <Filters filter={filter} onFilterChange={setFilter} />
              {/* Market Sentiment Heatmap - Market Pulse ke right side mein */}
              <MarketHeatmap
                stocks={filteredStocks}
                analyses={analyses}
                onStockClick={showStockDetail}
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'trading') {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-dark-text">📈 Paper Trading</h2>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
          </div>
          <TradingPanel
            stocks={stocks}
            analyses={analyses}
            onStockClick={showStockDetail}
          />
        </div>
      );
    }

    if (activeTab === 'momentum') {
      return (
        <div className="space-y-6">
          <MomentumBreakouts
            onStockClick={showStockDetail}
            analyses={analyses}
            onQuickBuy={(symbol, price) => {
              setActiveTab('trading');
              // Trading panel will pick up via its own order form
            }}
          />
        </div>
      );
    }

    if (activeTab === 'indices') {
      return (
        <div className="h-full">
          <NSEIndicesMenu />
        </div>
      );
    }

    if (activeTab === 'stocks') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-dark-text">All Stocks</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table'
                  ? 'bg-blue-accent text-white'
                  : 'bg-dark-bg text-dark-text-secondary hover:bg-dark-border'
                  }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'card'
                  ? 'bg-blue-accent text-white'
                  : 'bg-dark-bg text-dark-text-secondary hover:bg-dark-border'
                  }`}
              >
                Cards
              </button>
            </div>
          </div>

          {viewMode === 'table' ? (
            <StockTable
              stocks={filteredStocks}
              analyses={analyses}
              loading={loading || analyzing}
              onStockClick={showStockDetail}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStocks.map((stock, index) => {
                const symbol = stock.symbol || stock.SYMBOL || stock.symbal_name || stock.name || stock.identifier_name;
                return (
                  <StockCard
                    key={symbol || index}
                    stock={stock}
                    analysis={analyses[symbol]}
                    onAnalyze={analyzeSingleStock}
                    onCardClick={() => showStockDetail(symbol)}
                    analyzing={analyzing}
                  />
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'ai-research') {
      return (
        <AIResearchDashboard
          onStockClick={showStockDetail}
          activeMode={mode}
        />
      );
    }

    if (activeTab === 'news') {
      return (
        <div className="space-y-6">
          {/* News Header with Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-card border border-dark-border p-4 rounded-xl">
            <div>
              <h2 className="text-2xl font-bold text-dark-text flex items-center gap-2">
                <span>📰</span> Market Intelligence
              </h2>
              <p className="text-sm text-dark-text-secondary">AI-powered news sentiment and trading decisions</p>
            </div>
            <button
              onClick={async () => {
                try {
                  setAnalyzing(true);
                  await aiStockAPI.runAnalysis();
                  window.dispatchEvent(new Event('ai-analysis-complete'));
                } catch (err) {
                  console.error('Failed to run news analysis:', err);
                } finally {
                  setAnalyzing(false);
                }
              }}
              disabled={analyzing}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              {analyzing ? <span className="animate-spin">⏳</span> : <span>🚀</span>}
              {analyzing ? 'Analyzing...' : 'Refresh AI News'}
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:col-span-1 w-full lg:w-1/3">
              <div className="bg-dark-card border border-dark-border rounded-xl p-4 h-full">
                <h2 className="text-xl font-bold text-dark-text mb-4 flex items-center gap-2">
                  <span className="text-blue-accent">🎯</span> News Decisions
                </h2>
                <NewsDecisions />
              </div>
            </div>
            <div className="lg:col-span-2 w-full lg:w-2/3">
              <div className="bg-dark-card border border-dark-border rounded-xl p-4 h-full">
                <h2 className="text-xl font-bold text-dark-text mb-4 flex items-center gap-2">
                  <span className="text-blue-accent">📰</span> Market News Feed
                </h2>
                <NewsFeed />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'watchlist') {
      return (
        <div className="space-y-6">
          <Watchlist
            onStockClick={showStockDetail}
          />
        </div>
      );
    }

    if (activeTab === 'alerts') {
      return (
        <div className="space-y-6">
          <Alerts />
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <p className="text-dark-text-secondary">This section is under development</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <DashboardHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onMenuClick={() => setIsMobileMenuOpen(true)}
          onVoiceClick={() => setShowVoiceCommand(true)}
          onRefreshClick={triggerBackendRefresh}
          analyzing={analyzing}
          sseConnected={sseConnected}
          lastUpdateTime={lastUpdateTime}
          voiceEnabled={voiceNotificationsEnabled}
          onVoiceToggle={() => {
            const newState = !voiceNotificationsEnabled;
            setVoiceNotificationsEnabled(newState);
            speak(newState ? "Voice alerts enabled" : "Voice alerts disabled");
          }}
        />

        {/* Live Market Ticker - TRENDING */}
        <MarketTicker stocks={stocks} analyses={analyses} />

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {!isMarketOpen && (
            <div className="bg-orange-500/10 border border-orange-500/50 text-orange-400 p-3 rounded-lg flex items-center gap-3 mb-6">
              <span className="text-xl">⚠️</span>
              <p className="font-medium text-sm">Market Closed - Showing last closing data</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-sell/20 border-2 border-red-sell rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="text-red-sell font-bold mb-2">Error</h3>
                  <p className="text-dark-text text-sm mb-3">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      loadStocks();
                    }}
                    className="px-4 py-2 bg-red-sell hover:bg-red-sell/90 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    🔄 Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {analyzing && (
            <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-accent"></div>
                    <span className="text-dark-text font-semibold">
                      Analyzing stocks in {mode} mode...
                    </span>
                  </div>
                  {analysisProgress.total > 0 && (
                    <span className="text-sm text-dark-text-secondary">
                      {analysisProgress.current} / {analysisProgress.total} stocks
                    </span>
                  )}
                </div>
                {analysisProgress.total > 0 && (
                  <div className="w-full">
                    <div className="w-full bg-dark-bg rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-accent h-full transition-all duration-300 ease-out"
                        style={{ width: `${analysisProgress.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-dark-text-secondary mt-1 text-center">
                      {analysisProgress.percentage}% Complete
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          {renderContent()}
        </main>
      </div>

      {/* Google Assistant Style Voice Interface */}
      <AIVoiceAssistant
        isOpen={showVoiceCommand}
        onClose={() => setShowVoiceCommand(false)}
        appState={{
          setActiveTab,
          setSearchTerm,
          setFilter,
          setShowAIRecommendations,
          viewMode,
          setViewMode,
          setMode,
          triggerBackendRefresh,
          analyzeSingleStock,
          setShowVoiceCommand,
          setIsModalOpen,
          selectedStock,
          isSpotlightOpen,
          setIsSpotlightOpen,
          voiceNotificationsEnabled,
          setVoiceNotificationsEnabled,
        }}
      />
      <StockDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        symbol={selectedStock}
        analysis={analyses[selectedStock]}
      />
      <SpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        stocks={stocks}
        onStockClick={showStockDetail}
        onAction={(actionId) => {
          if (actionId === 'tour') {
            setShowTour(true);
          } else {
            setActiveTab(actionId);
            // Special cases if any
            if (actionId === 'ai-research') setShowAIResearch(true);
          }
        }}
      />

      <HinglishTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        appState={{
          setActiveTab,
          setShowAIResearch
        }}
      />

      <Toaster position="bottom-right" reverseOrder={false} />
    </div>
  );
}

export default App;
