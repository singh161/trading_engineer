import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error(`❌ API Error ${error.response.status}:`, error.response.data || error.message);
    } else if (error.request) {
      // Request made but no response
      console.error('❌ API Error: No response from server. Is backend running?', error.message);
    } else {
      // Error in request setup
      console.error('❌ API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const stockAPI = {
  /**
   * Get all NSE equity stocks
   * @param {boolean} filterMomentum - Filter by momentum (default: null uses config)
   * @param {boolean} filterPrice - Filter by price range (default: null uses config)
   */
  getAllStocks: async (filterMomentum = null, filterPrice = null) => {
    const params = {};
    if (filterMomentum !== null) params.filter_momentum = filterMomentum;
    if (filterPrice !== null) params.filter_price = filterPrice;
    const response = await api.get('/stocks', { params });
    return response.data;
  },

  /**
   * Analyze a single stock
   * @param {string} symbol - Stock symbol
   * @param {string} mode - Trading mode: intraday, swing, or longterm
   */
  analyzeStock: async (symbol, mode = 'swing') => {
    const response = await api.get(`/analyze/${symbol}`, {
      params: { mode },
    });
    return response.data;
  },

  /**
   * Get market index data (NIFTY, BANKNIFTY)
   */
  getMarketIndex: async () => {
    const response = await api.get('/market-index');
    return response.data;
  },

  /**
   * Analyze multiple stocks in chunks (optimized for large lists)
   * @param {string[]} symbols - Array of stock symbols
   * @param {string} mode - Trading mode: intraday, swing, or longterm
   * @param {number} chunkSize - Number of stocks to process in parallel (default: 10)
   */
  analyzeBatchChunked: async (symbols, mode = 'swing', chunkSize = 10) => {
    const response = await api.post('/analyze/batch-chunked', symbols, {
      params: { mode, chunk_size: chunkSize },
    });
    return response.data;
  },

  /**
   * Trigger refresh of all stocks (backend processing)
   */
  refreshAllStocks: async (mode = 'swing') => {
    const response = await api.post('/analyze/refresh-all', null, {
      params: { mode },
    });
    return response.data;
  },

  /**
   * Get AI recommendation for a stock
   * @param {string} symbol - Stock symbol
   * @param {string} mode - Trading mode: intraday, swing, or longterm
   */
  getAIRecommendation: async (symbol, mode = 'swing') => {
    const response = await api.get(`/analyze/${symbol}/ai-recommendation`, {
      params: { mode },
    });
    return response.data;
  },

  /**
   * Get top recommended stocks
   * @param {number} limit - Number of stocks to return
   * @param {string} verdict - Filter by verdict (optional)
   * @param {string} mode - Trading mode: intraday, swing, or longterm
   */
  getTopStocks: async (limit = 10, verdict = null, mode = 'swing') => {
    const params = { limit, mode };
    if (verdict) params.verdict = verdict;
    const response = await api.get('/recommendations/top-stocks', { params });
    return response.data;
  },

  /**
   * Run backtest on historical data using 9-point rule
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - daily or weekly
   * @param {string} period - period like 6mo, 1y, 5y
   */
  runBacktest: async (symbol, timeframe = 'daily', period = '6mo') => {
    const response = await api.post(`/api/backtest/${symbol}`, null, {
      params: { timeframe, period }
    });
    return response.data;
  },
};

// AI Stock Research Engine API
export const aiStockAPI = {
  /**
   * Run complete AI analysis
   * @param {string[]} tickers - Array of stock symbols
   * @param {boolean} sendAlerts - Send email/Telegram alerts
   */
  runAnalysis: async (tickers, sendAlerts = false) => {
    const response = await api.post('/ai/run-analysis', tickers, {
      params: { send_alerts: sendAlerts },
    });
    return response.data;
  },

  /**
   * Get AI-powered recommendations
   * @param {number} limit - Number of recommendations per category
   */
  getRecommendations: async (limit = 5) => {
    const response = await api.get('/ai/recommendations', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get top stocks by category
   * @param {string} category - buy, hold, or sell
   * @param {number} limit - Number of stocks
   */
  getTopStocks: async (category = 'buy', limit = 5) => {
    const response = await api.get('/ai/top-stocks', {
      params: { category, limit },
    });
    return response.data;
  },

  /**
   * Get news with sentiment analysis
   * @param {string} ticker - Filter by ticker (optional)
   * @param {number} limit - Number of news items
   */
  getNews: async (ticker = null, limit = 20) => {
    const params = { limit };
    if (ticker) params.ticker = ticker;
    const response = await api.get('/ai/news', { params });
    return response.data;
  },

  /**
   * Send alert for a stock
   * @param {string} stockSymbol - Stock symbol
   * @param {boolean} useEmail - Send email alert
   * @param {boolean} useTelegram - Send Telegram alert
   */
  sendAlert: async (stockSymbol, useEmail = true, useTelegram = true) => {
    const response = await api.post('/ai/send-alert', null, {
      params: {
        stock_symbol: stockSymbol,
        use_email: useEmail,
        use_telegram: useTelegram,
      },
    });
    return response.data;
  },

  /**
   * Get risk analysis data
   * @param {string} ticker - Filter by ticker (optional)
   */
  getRiskAnalysis: async (ticker = null) => {
    const params = {};
    if (ticker) params.ticker = ticker;
    const response = await api.get('/ai/risk-analysis', { params });
    return response.data;
  },

  /**
   * Get sector analysis data
   */
  getSectorAnalysis: async () => {
    const response = await api.get('/ai/sector-analysis');
    return response.data;
  },

  /**
   * Get sector ranking
   * @param {string} category - Filter by category (optional)
   * @param {number} limit - Number of sectors (optional)
   */
  getSectorRanking: async (category = null, limit = 10) => {
    const params = { limit };
    if (category) params.category = category;
    const response = await api.get('/ai/sector-ranking', { params });
    return response.data;
  },

  /**
   * Get news-based decisions
   * @param {string} ticker - Filter by ticker (optional)
   * @param {string} category - Filter by category (optional)
   */
  getNewsDecisions: async (ticker = null, category = null) => {
    const params = {};
    if (ticker) params.ticker = ticker;
    if (category) params.category = category;
    const response = await api.get('/ai/news-decisions', { params });
    return response.data;
  },

  /**
   * Get enhanced target prices
   * @param {string} ticker - Filter by ticker (optional)
   * @param {number} minConfidence - Minimum confidence (optional)
   */
  getTargetPrices: async (ticker = null, minConfidence = 0.0) => {
    const params = { min_confidence: minConfidence };
    if (ticker) params.ticker = ticker;
    const response = await api.get('/ai/target-prices', { params });
    return response.data;
  },

  /**
   * Process voice command
   * @param {string} command - Voice command text from speech-to-text
   */
  processVoiceCommand: async (command) => {
    const response = await api.post('/ai/voice-command', command, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    return response.data;
  },
  /**
   * Get AI Engine configuration status
   */
  getConfigStatus: async () => {
    const response = await api.get('/ai/config-status');
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════
// TRADING API — Paper Trading (Groww/Zerodha Style)
// ═══════════════════════════════════════════════════════════
export const tradingAPI = {
  /** Get trading dashboard stats with live P&L */
  getDashboard: async () => {
    const response = await api.get('/api/trading/dashboard');
    return response.data;
  },

  /** Get all open positions with live P&L */
  getPositions: async () => {
    const response = await api.get('/api/trading/positions');
    return response.data;
  },

  /** Place a BUY or SELL order */
  placeOrder: async (symbol, orderType, quantity, price, stopLoss = null, target = null, instrumentType = 'EQUITY', strikePrice = null, expiry = null, optionType = null) => {
    const response = await api.post('/api/trading/order', {
      symbol,
      order_type: orderType,
      quantity,
      price,
      stop_loss: stopLoss,
      target: target,
      instrument_type: instrumentType,
      strike_price: strikePrice,
      expiry: expiry,
      option_type: optionType,
    });
    return response.data;
  },

  /** Update stop loss and/or target for a position */
  updateSLTarget: async (symbol, stopLoss = null, target = null) => {
    const response = await api.put('/api/trading/update-sl-target', {
      symbol,
      stop_loss: stopLoss,
      target: target,
    });
    return response.data;
  },

  /** Exit entire position */
  exitPosition: async (symbol, price, reason = 'MANUAL') => {
    const response = await api.post(`/api/trading/exit/${symbol}`, null, {
      params: { price, reason },
    });
    return response.data;
  },

  /** Get closed trade history */
  getHistory: async (limit = 50) => {
    const response = await api.get('/api/trading/history', { params: { limit } });
    return response.data;
  },

  /** Get order history */
  getOrders: async (limit = 50) => {
    const response = await api.get('/api/trading/orders', { params: { limit } });
    return response.data;
  },

  /** Get current balance */
  getBalance: async () => {
    const response = await api.get('/api/trading/balance');
    return response.data;
  },

  /** Reset trading account */
  resetAccount: async () => {
    const response = await api.post('/api/trading/reset');
    return response.data;
  },
};

export default api;
