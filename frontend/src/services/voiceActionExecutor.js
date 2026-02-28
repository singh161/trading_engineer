/**
 * Voice Action Executor
 * 
 * This module is the SINGLE SOURCE OF TRUTH for executing voice commands.
 * It receives ACTION JSON from backend and executes REAL actions:
 * - Navigates to routes
 * - Calls APIs
 * - Sets filters/selections
 * - Triggers analysis
 * 
 * DO NOT create dummy responses or simulate actions.
 * All actions here trigger REAL functionality.
 */

import { aiStockAPI } from './api';

/**
 * Execute action from voice command response
 * @param {Object} actionResponse - Action JSON from backend
 * @param {Object} appState - App state setters and navigation functions
 * @returns {Promise<Object>} Execution result
 */
export async function executeVoiceAction(actionResponse, appState) {
  const { action, params, confidence, entities } = actionResponse;

  console.log('🎤 [EXECUTOR] Executing voice action:', action, 'with confidence:', confidence);

  try {
    let result;
    switch (action) {
      case 'RUN_ANALYSIS':
        result = await executeRunAnalysis(params, appState);
        break;
      case 'SHOW_SECTOR_RANKING':
        result = await executeShowSectorRanking(params, appState);
        break;
      case 'COMPARE_STOCKS':
        result = await executeCompareStocks(params, appState);
        break;
      case 'SHOW_TARGET_PRICE':
        result = await executeShowTargetPrice(params, appState);
        break;
      case 'SHOW_RISK_ANALYSIS':
        result = await executeShowRiskAnalysis(params, appState);
        break;
      case 'SHOW_SECTOR_ANALYSIS':
        result = await executeShowSectorAnalysis(params, appState);
        break;
      case 'SHOW_NEWS':
        result = await executeShowNews(params, appState);
        break;
      case 'SHOW_BEST_STOCKS':
        result = await executeShowBestStocks(params, appState);
        break;
      case 'ANALYZE_STOCK':
        result = await executeAnalyzeStock(params, appState);
        break;
      case 'MARKET_TREND':
        result = await executeMarketTrend(params, appState);
        break;
      case 'SHOW_MOMENTUM_STOCKS':
        result = await executeShowMomentumStocks(params, appState);
        break;
      case 'REFRESH_DATA':
        result = await executeRefreshData(params, appState);
        break;
      case 'OPEN_SEARCH':
        result = await executeOpenSearch(params, appState);
        break;
      case 'NAVIGATE_OVERVIEW':
      case 'NAVIGATE_STOCKS':
      case 'NAVIGATE_WATCHLIST':
      case 'NAVIGATE_ALERTS':
        result = await executeNavigation(action, params, appState);
        break;
      case 'UI_ACTION':
        result = await executeUIAction(params, appState);
        break;
      case 'ERROR':
        result = { success: false, message: params.message || 'Unknown error' };
        break;
      default:
        result = { success: false, message: `Action '${action}' not implemented` };
    }

    // Auto-close voice modal after 2 seconds on success
    if (result.success && appState.setShowVoiceCommand) {
      setTimeout(() => appState.setShowVoiceCommand(false), 2000);
    }

    return result;

  } catch (error) {
    console.error('❌ [EXECUTOR] Error executing voice action:', error);
    if (appState.setShowVoiceCommand) {
      setTimeout(() => appState.setShowVoiceCommand(false), 3000);
    }
    return {
      success: false,
      message: `Failed to execute action: ${error.message}`,
    };
  }
}

/**
 * Execute RUN_ANALYSIS action
 * Triggers real API call to /ai/run-analysis
 */
async function executeRunAnalysis(params, appState) {
  try {
    console.log('🚀 Executing RUN_ANALYSIS action...');

    // Default stocks if not provided
    const defaultStocks = [
      'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
      'BHARTIARTL', 'SBIN', 'BAJFINANCE', 'WIPRO', 'HINDUNILVR',
      'ITC', 'KOTAKBANK', 'LT', 'AXISBANK', 'MARUTI'
    ];

    // Show AI Research Dashboard automatically
    if (appState.setActiveTab) {
      appState.setActiveTab('ai-research');
      console.log('✅ Switched to AI Research tab');
    }

    // Call REAL API - this will actually run the analysis
    console.log('📡 Calling /ai/run-analysis API...');
    const result = await aiStockAPI.runAnalysis(defaultStocks, false);
    console.log('✅ Analysis API call completed:', result);

    // Trigger refresh event for components
    window.dispatchEvent(new Event('ai-analysis-complete'));
    console.log('✅ Analysis complete event dispatched');

    return {
      success: true,
      message: `✅ Analysis started for ${result.stocks_analyzed || defaultStocks.length} stocks. Results will appear shortly.`,
      data: result,
    };
  } catch (error) {
    console.error('❌ Error running analysis:', error);
    return {
      success: false,
      message: `Failed to run analysis: ${error.message}`,
    };
  }
}

/**
 * Execute SHOW_SECTOR_RANKING action
 * Navigates to AI Research Dashboard and sets sector filter
 */
async function executeShowSectorRanking(params, appState) {
  try {
    // Show AI Research Dashboard
    if (appState.setActiveTab) {
      appState.setActiveTab('ai-research');
    }

    // Set active tab to sector-ranking via event
    window.dispatchEvent(new CustomEvent('voice-command-tab', {
      detail: { tab: 'sector-ranking' }
    }));

    // Store filters for component to use
    if (params.filters) {
      // Store in sessionStorage so components can read it
      sessionStorage.setItem('voiceCommandFilters', JSON.stringify({
        category: params.filters.category,
        limit: params.filters.limit,
      }));

      // Trigger filter update event
      window.dispatchEvent(new CustomEvent('voice-command-filter', {
        detail: params.filters
      }));
    }

    return {
      success: true,
      message: `Showing sector ranking${params.filters?.category ? ` for ${params.filters.category}` : ''}`,
    };
  } catch (error) {
    console.error('Error showing sector ranking:', error);
    return {
      success: false,
      message: `Failed to show sector ranking: ${error.message}`,
    };
  }
}

/**
 * Execute COMPARE_STOCKS action
 * Opens comparison view with selected stocks
 */
async function executeCompareStocks(params, appState) {
  try {
    const stocks = params.stocks || [];

    if (stocks.length < 2) {
      return {
        success: false,
        message: 'Please specify at least 2 stocks to compare',
      };
    }

    // Show AI Research Dashboard
    if (appState.setActiveTab) {
      appState.setActiveTab('ai-research');
    }

    // Set active tab (you might want to create a comparison tab)
    // For now, we'll show both stocks in search/filter
    if (appState.setSearchTerm) {
      appState.setSearchTerm(stocks.join(', '));
    }

    // Store comparison stocks
    sessionStorage.setItem('voiceCommandCompare', JSON.stringify(stocks));
    window.dispatchEvent(new CustomEvent('voice-command-compare', {
      detail: { stocks }
    }));

    return {
      success: true,
      message: `Comparing ${stocks.join(' and ')}`,
    };
  } catch (error) {
    console.error('Error comparing stocks:', error);
    return {
      success: false,
      message: `Failed to compare stocks: ${error.message}`,
    };
  }
}

/**
 * Execute SHOW_TARGET_PRICE action
 * Navigates to target price tab and filters by stock
 */
async function executeShowTargetPrice(params, appState) {
  try {
    // Show AI Research Dashboard
    if (appState.setActiveTab) {
      appState.setActiveTab('ai-research');
    }

    // Set active tab to target via event
    window.dispatchEvent(new CustomEvent('voice-command-tab', {
      detail: { tab: 'target' }
    }));

    // Set filters if stock specified
    if (params.filters?.ticker) {
      sessionStorage.setItem('voiceCommandFilters', JSON.stringify({
        ticker: params.filters.ticker,
      }));

      window.dispatchEvent(new CustomEvent('voice-command-filter', {
        detail: { ticker: params.filters.ticker }
      }));
    }

    return {
      success: true,
      message: `Showing target price${params.filters?.ticker ? ` for ${params.filters.ticker}` : ''}`,
    };
  } catch (error) {
    console.error('Error showing target price:', error);
    return {
      success: false,
      message: `Failed to show target price: ${error.message}`,
    };
  }
}

/**
 * Execute SHOW_RISK_ANALYSIS action
 * Navigates to risk analysis tab
 */
async function executeShowRiskAnalysis(params, appState) {
  try {
    // Show AI Research Dashboard
    if (appState.setActiveTab) {
      appState.setActiveTab('ai-research');
    }

    // Set active tab to risk via event
    window.dispatchEvent(new CustomEvent('voice-command-tab', {
      detail: { tab: 'risk' }
    }));

    // Set filters if stock specified
    if (params.filters?.ticker) {
      sessionStorage.setItem('voiceCommandFilters', JSON.stringify({
        ticker: params.filters.ticker,
      }));

      window.dispatchEvent(new CustomEvent('voice-command-filter', {
        detail: { ticker: params.filters.ticker }
      }));
    }

    return {
      success: true,
      message: `Showing risk analysis${params.filters?.ticker ? ` for ${params.filters.ticker}` : ''}`,
    };
  } catch (error) {
    console.error('Error showing risk analysis:', error);
    return {
      success: false,
      message: `Failed to show risk analysis: ${error.message}`,
    };
  }
}

/**
 * Execute SHOW_SECTOR_ANALYSIS action
 * Navigates to sector analysis tab
 */
async function executeShowSectorAnalysis(params, appState) {
  try {
    // Show AI Research Dashboard
    if (appState.setActiveTab) {
      appState.setActiveTab('ai-research');
    }

    // Set active tab to sector via event
    window.dispatchEvent(new CustomEvent('voice-command-tab', {
      detail: { tab: 'sector' }
    }));

    return {
      success: true,
      message: 'Showing sector analysis',
    };
  } catch (error) {
    console.error('Error showing sector analysis:', error);
    return {
      success: false,
      message: `Failed to show sector analysis: ${error.message}`,
    };
  }
}

/**
 * Execute SHOW_NEWS action
 * Navigates to news tab and loads news automatically
 */
async function executeShowNews(params, appState) {
  try {
    console.log('📰 Executing SHOW_NEWS action...');

    // Show AI Research Dashboard automatically
    if (appState.setActiveTab) {
      appState.setActiveTab('ai-research');
      console.log('✅ Switched to AI Research tab');
    }

    // Set active tab to news via event
    window.dispatchEvent(new CustomEvent('voice-command-tab', {
      detail: { tab: 'news' }
    }));
    console.log('✅ Switched to News tab');

    // Set filters if stock specified
    if (params.filters?.ticker) {
      sessionStorage.setItem('voiceCommandFilters', JSON.stringify({
        ticker: params.filters.ticker,
      }));

      window.dispatchEvent(new CustomEvent('voice-command-filter', {
        detail: { ticker: params.filters.ticker }
      }));
      console.log(`✅ Filter set for stock: ${params.filters.ticker}`);
    }

    // News will automatically load when NewsFeed component mounts/switches to this tab
    return {
      success: true,
      message: `✅ Showing stock news${params.filters?.ticker ? ` for ${params.filters.ticker}` : ''}. News loading...`,
    };
  } catch (error) {
    console.error('❌ Error showing news:', error);
    return {
      success: false,
      message: `Failed to show news: ${error.message}`,
    };
  }
}

/**
 * Execute SHOW_BEST_STOCKS action
 * Shows smart rankings with best stocks automatically
 */
async function executeShowBestStocks(params, appState) {
  try {
    console.log('🏆 Executing SHOW_BEST_STOCKS action...');

    // Show AI Research Dashboard automatically
    if (appState.setActiveTab) {
      appState.setActiveTab('ai-research');
      console.log('✅ Switched to AI Research tab');
    }

    // Set active tab to rankings (smart rankings) - this shows best stocks
    window.dispatchEvent(new CustomEvent('voice-command-tab', {
      detail: { tab: 'rankings' }
    }));
    console.log('✅ Switched to Smart Rankings tab (Best Stocks)');

    // SmartRankings component will automatically load and show best stocks
    return {
      success: true,
      message: '✅ Showing best stocks and recommendations. Loading top BUY, HOLD, and SELL stocks...',
    };
  } catch (error) {
    console.error('❌ Error showing best stocks:', error);
    return {
      success: false,
      message: `Failed to show best stocks: ${error.message}`,
    };
  }
}

/**
 * Execute ANALYZE_STOCK action
 * Analyzes a specific stock and shows results
 */
async function executeAnalyzeStock(params, appState) {
  try {
    const stocks = params.stocks || [];
    if (stocks.length === 0) {
      return {
        success: false,
        message: 'Please specify a stock to analyze. Example: "analyze Reliance"',
      };
    }

    const symbol = stocks[0];
    console.log(`🔍 Analyzing stock: ${symbol}...`);

    // Show AI Research Dashboard
    if (appState.setActiveTab) {
      appState.setActiveTab('ai-research');
    }

    // Nav to rankings tab to show results
    window.dispatchEvent(new CustomEvent('voice-command-tab', {
      detail: { tab: 'rankings' }
    }));

    // Set search term to filter for this stock
    if (appState.setSearchTerm) {
      appState.setSearchTerm(symbol);
    }

    // Import stockAPI dynamically or use from api.js
    const { stockAPI } = await import('./api');
    const result = await stockAPI.analyzeStock(symbol);
    console.log('✅ Stock analysis completed:', result);

    // Filter results locally
    window.dispatchEvent(new CustomEvent('voice-command-filter', {
      detail: { ticker: symbol }
    }));

    return {
      success: true,
      message: `✅ Analysis complete for ${symbol}. Verdict: ${result.final_verdict || 'NEUTRAL'}. Results shown on dashboard.`,
      data: result
    };
  } catch (error) {
    console.error('❌ Error analyzing stock:', error);
    return {
      success: false,
      message: `Failed to analyze stock: ${error.message}`,
    };
  }
}

/**
 * Execute MARKET_TREND action
 * Shows market index trends (Nifty, BankNifty)
 */
async function executeMarketTrend(params, appState) {
  try {
    console.log('📈 Fetching market trends...');

    // Import stockAPI dynamically
    const { stockAPI } = await import('./api');
    const result = await stockAPI.getMarketIndex();
    console.log('✅ Market index data:', result);

    // Show AI Research Dashboard
    if (appState.setActiveTab) {
      appState.setActiveTab('ai-research');
    }

    // Switch to a relevant tab if needed, or just show a notification
    // Let's assume there's a market overview or we just show the data in a toast

    const nifty = result.NIFTY || {};
    const banknifty = result.BANKNIFTY || {};

    const trendMsg = `NIFTY: ${nifty.trend || 'NEUTRAL'} (${nifty.price?.toFixed(2) || 'N/A'}), BANKNIFTY: ${banknifty.trend || 'NEUTRAL'} (${banknifty.price?.toFixed(2) || 'N/A'})`;

    return {
      success: true,
      message: `✅ Market Trend: ${trendMsg}`,
      data: result
    };
  } catch (error) {
    console.error('❌ Error fetching market trend:', error);
    return {
      success: false,
      message: `Failed to fetch market trend: ${error.message}`,
    };
  }
}

/**
 * Execute SHOW_MOMENTUM_STOCKS action
 * Navigates to the Momentum radar tab
 */
async function executeShowMomentumStocks(params, appState) {
  try {
    console.log('🚀 Executing SHOW_MOMENTUM_STOCKS action...');

    if (appState.setActiveTab) {
      appState.setActiveTab('momentum');
      console.log('✅ Switched to Momentum tab');
    }

    return {
      success: true,
      message: '✅ Opening Momentum & Breakout Radar. Scanning for explosive stocks...',
    };
  } catch (error) {
    console.error('❌ Error showing momentum stocks:', error);
    return {
      success: false,
      message: `Failed to show momentum stocks: ${error.message}`,
    };
  }
}

/**
 * Execute REFRESH_DATA action
 */
async function executeRefreshData(params, appState) {
  try {
    if (appState.triggerBackendRefresh) {
      appState.triggerBackendRefresh();
      return { success: true, message: '🔄 Dashboard refresh started.' };
    }
    return { success: false, message: 'Refresh function not available.' };
  } catch (error) {
    return { success: false, message: `Refresh failed: ${error.message}` };
  }
}

/**
 * Execute OPEN_SEARCH action
 */
async function executeOpenSearch(params, appState) {
  try {
    if (appState.setIsSpotlightOpen) {
      appState.setIsSpotlightOpen(true);
      return { success: true, message: '🔍 Opening Spotlight Search.' };
    }
    return { success: false, message: 'Search function not available.' };
  } catch (error) {
    return { success: false, message: `Search failed: ${error.message}` };
  }
}

/**
 * Execute generic Navigation
 */
async function executeNavigation(action, params, appState) {
  try {
    const tab = action.replace('NAVIGATE_', '').toLowerCase();
    if (appState.setActiveTab) {
      appState.setActiveTab(tab);
      return { success: true, message: `📂 Navigated to ${tab.charAt(0).toUpperCase() + tab.slice(1)}.` };
    }
    return { success: false, message: 'Navigation function not available.' };
  } catch (error) {
    return { success: false, message: `Navigation failed: ${error.message}` };
  }
}

/**
 * Execute UI_ACTION (Full control over buttons/windows)
 */
async function executeUIAction(params, appState) {
  const action = params.action;
  try {
    console.log(`🎮 Executing UI Action: ${action}`);

    switch (action) {
      case 'CLOSE':
        if (appState.setIsModalOpen) appState.setIsModalOpen(false);
        if (appState.setIsSpotlightOpen) appState.setIsSpotlightOpen(false);
        return { success: true, message: '✅ Window closed.' };

      case 'WATCHLIST_TOGGLE':
        const symbol = appState.selectedStock;
        if (!symbol) return { success: false, message: 'No stock selected to add to watchlist.' };

        const savedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        let newWatchlist;
        let added = false;
        if (savedWatchlist.includes(symbol)) {
          newWatchlist = savedWatchlist.filter(s => s !== symbol);
        } else {
          newWatchlist = [...savedWatchlist, symbol];
          added = true;
        }
        localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
        window.dispatchEvent(new Event('watchlist-updated'));
        return { success: true, message: added ? `⭐ Added ${symbol} to watchlist.` : `🗑️ Removed ${symbol} from watchlist.` };

      case 'SHOW_ANALYSIS':
        window.dispatchEvent(new CustomEvent('modal-tab-change', { detail: { tab: 'analysis' } }));
        return { success: true, message: '📊 Showing AI Analysis insights.' };

      case 'SHOW_CHART':
        window.dispatchEvent(new CustomEvent('modal-tab-change', { detail: { tab: 'chart' } }));
        return { success: true, message: '📈 Opening Live Chart.' };

      case 'TOGGLE_VOICE':
        if (appState.setVoiceNotificationsEnabled) {
          const newState = !appState.voiceNotificationsEnabled;
          appState.setVoiceNotificationsEnabled(newState);
          return { success: true, message: newState ? '🔊 Voice alerts enabled.' : '🔇 Voice alerts disabled.' };
        }
        break;

      case 'SET_LAYOUT':
        if (appState.setViewMode) {
          const mode = params.layout === 'toggle'
            ? (appState.viewMode === 'table' ? 'card' : 'table')
            : params.layout;
          appState.setViewMode(mode);
          return { success: true, message: `🔳 Layout switched to ${mode} mode.` };
        }
        break;
    }

    return { success: false, message: `Action ${action} is not yet implemented or available.` };
  } catch (error) {
    console.error(`❌ UI Action failed: ${error.message}`);
    return { success: false, message: `UI control error: ${error.message}` };
  }
}
