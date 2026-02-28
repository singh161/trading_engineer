import React, { useState, useEffect } from 'react';
import { stockAPI } from '../services/api';

const AIRecommendations = ({ topStocks, onStockClick, mode: parentMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [allStocks, setAllStocks] = useState([]);
  const [mode, setMode] = useState(parentMode || 'swing');
  const [topStocksData, setTopStocksData] = useState(topStocks || []);
  const [loadingMode, setLoadingMode] = useState(false);

  // Load all stocks for search
  useEffect(() => {
    const loadAllStocks = async () => {
      try {
        const stocks = await stockAPI.getAllStocks(false, null);
        setAllStocks(stocks || []);
      } catch (error) {
        console.error('Error loading stocks for search:', error);
      }
    };
    loadAllStocks();
  }, []);

  // Load top stocks when mode changes
  useEffect(() => {
    const loadTopStocks = async () => {
      setLoadingMode(true);
      try {
        const data = await stockAPI.getTopStocks(10, null, mode);
        setTopStocksData(data.stocks || []);
      } catch (error) {
        console.error('Error loading top stocks:', error);
        setTopStocksData([]);
      } finally {
        setLoadingMode(false);
      }
    };
    loadTopStocks();
  }, [mode]);

  // Update topStocksData when parent topStocks prop changes
  useEffect(() => {
    if (topStocks && topStocks.length > 0) {
      setTopStocksData(topStocks);
    }
  }, [topStocks]);

  // Search for a stock
  const handleSearch = async (symbol) => {
    if (!symbol || symbol.trim() === '') {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      // Try to get AI recommendation for the searched symbol with current mode
      const result = await stockAPI.getAIRecommendation(symbol.toUpperCase(), mode);
      if (result && result.analysis) {
        setSearchResults({
          symbol: symbol.toUpperCase(),
          analysis: result.analysis,
          ai_recommendation: result.ai_recommendation
        });
      } else {
        setSearchResults({ symbol: symbol.toUpperCase(), error: 'No analysis found for this stock' });
      }
    } catch (error) {
      console.error('Error searching stock:', error);
      setSearchResults({ symbol: symbol.toUpperCase(), error: 'Stock not found or not analyzed yet' });
    } finally {
      setSearching(false);
    }
  };

  // Filter top stocks based on search
  const filteredTopStocks = topStocksData && topStocksData.length > 0
    ? topStocksData.filter(item => {
        if (!searchTerm) return true;
        const symbol = item.symbol || '';
        return symbol.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

  // Get autocomplete suggestions
  const getSuggestions = () => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return allStocks
      .filter(stock => {
        const symbol = stock.symbol || stock.SYMBOL || stock.symbal_name || stock.name || stock.identifier_name || '';
        return symbol.toLowerCase().includes(term);
      })
      .slice(0, 10)
      .map(stock => stock.symbol || stock.SYMBOL || stock.symbal_name || stock.name || stock.identifier_name);
  };

  const suggestions = getSuggestions();

  const handleModeChange = (newMode) => {
    if (newMode === mode) return; // Don't change if same mode
    setMode(newMode);
    setSearchResults(null); // Clear search results when mode changes
  };

  // Show loading state if no top stocks available
  if (!topStocksData || topStocksData.length === 0) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <span>🤖</span>
              AI Stock Recommendations
            </h3>
            <p className="text-sm text-dark-text-secondary mt-1">
              AI-powered analysis based on technical indicators, signal strength, and market patterns
            </p>
          </div>
          {/* Mode Selector - Compact Version */}
          <div className="md:w-auto">
            <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
              <h4 className="text-xs font-semibold text-dark-text-secondary mb-2">Trading Mode</h4>
              <div className="flex gap-2">
                {[
                  { value: 'intraday', label: 'Intraday', icon: '⚡' },
                  { value: 'swing', label: 'Swing', icon: '📈' },
                  { value: 'longterm', label: 'Long Term', icon: '📊' },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => handleModeChange(m.value)}
                    disabled={loadingMode}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 ${
                      mode === m.value
                        ? 'bg-blue-accent text-white shadow-lg shadow-blue-accent/30'
                        : 'bg-dark-card text-dark-text-secondary hover:bg-dark-border hover:text-dark-text border border-dark-border'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
                  >
                    {loadingMode && mode === m.value ? (
                      <>
                        <span className="animate-spin text-xs">⏳</span>
                        <span>{m.label}</span>
                      </>
                    ) : (
                      <>
                        <span className="mr-1">{m.icon}</span>
                        <span>{m.label}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-dark-text-secondary">
          {loadingMode ? (
            <>
              <span className="animate-spin text-lg">⏳</span>
              <span className="text-sm">Loading recommendations for <span className="font-semibold text-blue-accent capitalize">{mode}</span> mode...</span>
            </>
          ) : (
            <span className="text-sm">No recommendations available for <span className="font-semibold text-blue-accent capitalize">{mode}</span> mode. Please wait...</span>
          )}
        </div>
      </div>
    );
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return 'text-green-buy';
    if (confidence >= 50) return 'text-yellow-neutral';
    return 'text-red-sell';
  };

  const getRiskColor = (risk) => {
    if (!risk) return 'text-dark-text-secondary';
    const riskUpper = risk.toUpperCase();
    if (riskUpper === 'LOW') return 'text-green-buy';
    if (riskUpper === 'MEDIUM') return 'text-yellow-neutral';
    if (riskUpper.includes('MEDIUM-HIGH') || riskUpper.includes('HIGH')) return 'text-red-sell';
    return 'text-yellow-neutral';
  };

  // Render stock card (reusable function)
  const renderStockCard = (item, index = null) => {
    const analysis = item.analysis || {};
    const aiRec = analysis.ai_recommendation || {};
    const symbol = item.symbol;

    return (
      <div
        key={symbol}
        className="bg-dark-bg border border-dark-border rounded-lg p-4 hover:border-blue-accent transition-all cursor-pointer"
        onClick={() => onStockClick && onStockClick(symbol)}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {index !== null && <span className="text-xs font-bold text-dark-text-secondary">#{index + 1}</span>}
              <h4 className="text-lg font-bold text-dark-text">{symbol}</h4>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                analysis.final_verdict === 'STRONG BUY' ? 'bg-green-buy/20 text-green-buy' :
                analysis.final_verdict === 'BUY' ? 'bg-green-buy/10 text-green-buy' :
                analysis.final_verdict === 'STRONG SELL' ? 'bg-red-sell/20 text-red-sell' :
                analysis.final_verdict === 'SELL' ? 'bg-red-sell/10 text-red-sell' :
                'bg-yellow-neutral/20 text-yellow-neutral'
              }`}>
                {analysis.final_verdict || 'NEUTRAL'}
              </span>
              {/* Recency Indicator */}
              {aiRec.recency_analysis && (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  aiRec.recency_analysis.is_pullback 
                    ? 'bg-yellow-neutral/20 text-yellow-neutral border border-yellow-neutral/50' 
                    : aiRec.recency_analysis.is_recent
                    ? 'bg-green-buy/20 text-green-buy border border-green-buy/50'
                    : 'bg-dark-border text-dark-text-secondary border border-dark-border'
                }`}>
                  {aiRec.recency_analysis.is_pullback 
                    ? '⚠️ Pullback' 
                    : aiRec.recency_analysis.is_recent
                    ? '✅ Current Day'
                    : '📅 Older'}
                </span>
              )}
            </div>
            <p className="text-sm text-dark-text-secondary mt-1">
              {analysis.price ? `₹${analysis.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${getConfidenceColor(aiRec.confidence_score || 0)}`}>
              {aiRec.confidence_score || 0}%
            </div>
            <div className="text-xs text-dark-text-secondary">Confidence</div>
          </div>
        </div>

        {/* Quick Summary */}
        {aiRec.quick_summary && (
          <div className="mb-3 p-2 bg-blue-accent/10 rounded border border-blue-accent/30">
            <div className="text-xs font-semibold text-blue-accent">
              {aiRec.quick_summary}
            </div>
          </div>
        )}

        {/* AI Recommendation */}
        {aiRec.recommendation && (
          <div className="mb-3 p-3 bg-dark-bg/50 rounded border-l-4 border-blue-accent">
            <div className="text-sm text-dark-text leading-relaxed whitespace-pre-line">
              {aiRec.recommendation}
            </div>
          </div>
        )}

        {/* Strength Score */}
        {aiRec.strength_score && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs text-dark-text-secondary">Strength:</span>
            <div className="flex-1 bg-dark-bg rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${
                  aiRec.strength_score.score >= 70 ? 'bg-green-buy' :
                  aiRec.strength_score.score >= 40 ? 'bg-yellow-neutral' :
                  'bg-red-sell'
                }`}
                style={{ width: `${aiRec.strength_score.score}%` }}
              ></div>
            </div>
            <span className="text-xs font-semibold text-dark-text">
              {aiRec.strength_score.score}% ({aiRec.strength_score.interpretation})
            </span>
          </div>
        )}

        {/* Key Reasons */}
        {aiRec.key_reasons && aiRec.key_reasons.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-dark-text-secondary mb-2">Key Reasons:</div>
            <ul className="space-y-1">
              {aiRec.key_reasons.map((reason, idx) => (
                <li key={idx} className="text-xs text-dark-text-secondary flex items-start gap-2">
                  <span>•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Plan */}
        {aiRec.action_plan && aiRec.action_plan.length > 0 && (
          <div className="mb-3 pt-3 border-t border-dark-border">
            <div className="text-xs font-semibold text-dark-text-secondary mb-2">Action Plan:</div>
            <ul className="space-y-1">
              {aiRec.action_plan.map((action, idx) => (
                <li key={idx} className="text-xs text-dark-text flex items-start gap-2">
                  <span>✓</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Level & Position Size */}
        <div className="pt-3 border-t border-dark-border space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-dark-text-secondary">Risk Level: </span>
              <span className={`text-xs font-semibold ${getRiskColor(aiRec.risk_level)}`}>
                {aiRec.risk_level || 'UNKNOWN'}
              </span>
            </div>
            {analysis.buy_price && analysis.sell_price && (
              <div className="text-xs text-dark-text-secondary">
                Buy: ₹{analysis.buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })} • 
                Sell: ₹{analysis.sell_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
          {aiRec.risk_explanation && (
            <div className="text-xs text-dark-text-secondary italic">
              {aiRec.risk_explanation}
            </div>
          )}
          {aiRec.position_size && (
            <div className="text-xs">
              <span className="text-dark-text-secondary">Position Size: </span>
              <span className="font-semibold text-dark-text">
                {aiRec.position_size.recommended_percentage}% of portfolio
              </span>
              <span className="text-dark-text-secondary ml-2">
                ({aiRec.position_size.explanation})
              </span>
            </div>
          )}
        </div>

        {/* Entry/Exit Strategy */}
        {aiRec.entry_exit_strategy && (
          <div className="mt-3 pt-3 border-t border-dark-border">
            <div className="text-xs font-semibold text-dark-text-secondary mb-2">📋 Entry/Exit Strategy:</div>
            <div className="space-y-1 text-xs text-dark-text">
              <div><span className="font-semibold">Entry:</span> {aiRec.entry_exit_strategy.entry_method}</div>
              <div><span className="font-semibold">Exit:</span> {aiRec.entry_exit_strategy.exit_method}</div>
              <div><span className="font-semibold">Timeframe:</span> {aiRec.entry_exit_strategy.time_horizon}</div>
              {aiRec.entry_exit_strategy.key_levels && aiRec.entry_exit_strategy.key_levels.length > 0 && (
                <div className="mt-2">
                  <span className="font-semibold">Key Levels:</span>
                  <ul className="ml-4 mt-1 space-y-0.5">
                    {aiRec.entry_exit_strategy.key_levels.map((level, idx) => (
                      <li key={idx} className="text-dark-text-secondary">• {level}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Context */}
        {aiRec.market_context && (
          <div className="mt-3 pt-3 border-t border-dark-border">
            <div className="text-xs font-semibold text-dark-text-secondary mb-2">🌐 Market Context:</div>
            <div className="space-y-1 text-xs text-dark-text">
              {aiRec.market_context.market_phase && (
                <div><span className="font-semibold">Phase:</span> {aiRec.market_context.market_phase}</div>
              )}
              {aiRec.market_context.momentum && (
                <div><span className="font-semibold">Momentum:</span> {aiRec.market_context.momentum}</div>
              )}
              {aiRec.market_context.volatility_expectation && (
                <div><span className="font-semibold">Volatility:</span> {aiRec.market_context.volatility_expectation}</div>
              )}
              {aiRec.market_context.volume_analysis && (
                <div><span className="font-semibold">Volume:</span> {aiRec.market_context.volume_analysis}</div>
              )}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {aiRec.ai_insights && aiRec.ai_insights.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dark-border">
            <div className="text-xs font-semibold text-purple-500 mb-2">🤖 AI Insights:</div>
            <ul className="space-y-1">
              {aiRec.ai_insights.map((insight, idx) => (
                <li key={idx} className="text-xs text-purple-400 flex items-start gap-2">
                  <span>💡</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Probability */}
        {aiRec.success_probability && (
          <div className="mt-3 pt-3 border-t border-dark-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-dark-text-secondary">Success Probability:</span>
              <span className={`text-sm font-bold ${
                aiRec.success_probability.overall_probability >= 70 ? 'text-green-buy' :
                aiRec.success_probability.overall_probability >= 50 ? 'text-yellow-neutral' :
                'text-red-sell'
              }`}>
                {aiRec.success_probability.overall_probability}%
              </span>
            </div>
            <div className="text-xs text-dark-text-secondary mb-1">
              {aiRec.success_probability.interpretation}
            </div>
            <div className="text-xs text-dark-text">
              Strength: <span className="font-semibold">{aiRec.success_probability.recommendation_strength}</span>
            </div>
          </div>
        )}

        {/* Optimal Timing */}
        {aiRec.optimal_timing && (
          <div className="mt-3 pt-3 border-t border-dark-border">
            <div className="text-xs font-semibold text-dark-text-secondary mb-2">⏰ Optimal Timing:</div>
            <div className="space-y-1 text-xs text-dark-text">
              <div><span className="font-semibold">Entry:</span> {aiRec.optimal_timing.entry_timing}</div>
              <div><span className="font-semibold">Exit:</span> {aiRec.optimal_timing.exit_timing}</div>
              <div className={`font-semibold ${
                aiRec.optimal_timing.urgency === 'Very High' || aiRec.optimal_timing.urgency === 'High' ? 'text-red-sell' :
                aiRec.optimal_timing.urgency === 'Medium' ? 'text-yellow-neutral' :
                'text-dark-text-secondary'
              }`}>
                Urgency: {aiRec.optimal_timing.urgency}
              </div>
              {aiRec.optimal_timing.immediate_action && (
                <div className="text-red-sell font-semibold">⚡ Immediate action recommended</div>
              )}
              {aiRec.optimal_timing.wait_recommendation && (
                <div className="text-yellow-neutral font-semibold">⏳ Wait for better entry/exit</div>
              )}
            </div>
          </div>
        )}

        {/* Volatility Analysis */}
        {aiRec.volatility_analysis && (
          <div className="mt-3 pt-3 border-t border-dark-border">
            <div className="text-xs font-semibold text-dark-text-secondary mb-2">📊 Volatility Analysis:</div>
            <div className="space-y-1 text-xs text-dark-text">
              <div>
                <span className="font-semibold">Level:</span> 
                <span className={`ml-2 ${
                  aiRec.volatility_analysis.level === 'High' ? 'text-red-sell' :
                  aiRec.volatility_analysis.level === 'Elevated' ? 'text-yellow-neutral' :
                  'text-green-buy'
                }`}>
                  {aiRec.volatility_analysis.level}
                </span>
              </div>
              <div className="text-dark-text-secondary">{aiRec.volatility_analysis.expectation}</div>
              <div className="text-dark-text-secondary">{aiRec.volatility_analysis.risk_adjustment}</div>
            </div>
          </div>
        )}

        {/* Support/Resistance Strength */}
        {aiRec.support_resistance_strength && (
          <div className="mt-3 pt-3 border-t border-dark-border">
            <div className="text-xs font-semibold text-dark-text-secondary mb-2">🎯 Support/Resistance:</div>
            <div className="space-y-1 text-xs text-dark-text">
              {aiRec.support_resistance_strength.support_strength && (
                <div>
                  <span className="font-semibold">Support:</span> {aiRec.support_resistance_strength.support_strength}
                  {aiRec.support_resistance_strength.distance_to_support !== null && (
                    <span className="text-dark-text-secondary ml-2">
                      ({aiRec.support_resistance_strength.distance_to_support}% away)
                    </span>
                  )}
                </div>
              )}
              {aiRec.support_resistance_strength.resistance_strength && (
                <div>
                  <span className="font-semibold">Resistance:</span> {aiRec.support_resistance_strength.resistance_strength}
                  {aiRec.support_resistance_strength.distance_to_resistance !== null && (
                    <span className="text-dark-text-secondary ml-2">
                      ({aiRec.support_resistance_strength.distance_to_resistance}% away)
                    </span>
                  )}
                </div>
              )}
              {aiRec.support_resistance_strength.breakout_probability && (
                <div className="text-dark-text-secondary mt-1">
                  {aiRec.support_resistance_strength.breakout_probability}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeframe Recommendations */}
        {aiRec.timeframe_recommendations && (
          <div className="mt-3 pt-3 border-t border-dark-border">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-dark-text-secondary">
                ⏰ Timeframe Recommendations ({aiRec.timeframe_recommendations.mode || 'swing'} mode)
              </div>
              <div className="text-xs text-dark-text-secondary">
                Current: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            {/* Strategy Overview */}
            {aiRec.timeframe_recommendations.timeframe_strategy && (
              <div className="mb-3 p-2 bg-blue-accent/10 rounded text-xs text-dark-text">
                {aiRec.timeframe_recommendations.timeframe_strategy}
              </div>
            )}

            {/* Best Entry Times */}
            {aiRec.timeframe_recommendations.best_entry_times && 
             aiRec.timeframe_recommendations.best_entry_times.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-green-buy mb-1">✅ Best Entry Times:</div>
                <div className="space-y-1">
                  {aiRec.timeframe_recommendations.best_entry_times.map((entry, idx) => (
                    <div key={idx} className="text-xs text-dark-text bg-green-buy/10 rounded p-2">
                      <div className="font-semibold text-green-buy">{entry.time}</div>
                      <div className="text-dark-text-secondary mt-0.5">{entry.reason}</div>
                      {entry.priority && (
                        <div className="text-xs text-dark-text-secondary mt-1">
                          Priority: <span className="font-semibold">{entry.priority}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avoid Entry Times */}
            {aiRec.timeframe_recommendations.avoid_entry_times && 
             aiRec.timeframe_recommendations.avoid_entry_times.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-red-sell mb-1">❌ Avoid Entry Times:</div>
                <div className="space-y-1">
                  {aiRec.timeframe_recommendations.avoid_entry_times.map((avoid, idx) => (
                    <div key={idx} className="text-xs text-dark-text bg-red-sell/10 rounded p-2">
                      <div className="font-semibold text-red-sell">{avoid.time}</div>
                      <div className="text-dark-text-secondary mt-0.5">{avoid.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Exit Times */}
            {aiRec.timeframe_recommendations.best_exit_times && 
             aiRec.timeframe_recommendations.best_exit_times.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-yellow-neutral mb-1">🚪 Best Exit Times:</div>
                <div className="space-y-1">
                  {aiRec.timeframe_recommendations.best_exit_times.map((exit, idx) => (
                    <div key={idx} className="text-xs text-dark-text bg-yellow-neutral/10 rounded p-2">
                      <div className="font-semibold text-yellow-neutral">{exit.time}</div>
                      <div className="text-dark-text-secondary mt-0.5">{exit.reason}</div>
                      {exit.priority && (
                        <div className="text-xs text-dark-text-secondary mt-1">
                          Priority: <span className="font-semibold">{exit.priority}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session Analysis */}
            {aiRec.timeframe_recommendations.session_analysis && 
             Object.keys(aiRec.timeframe_recommendations.session_analysis).length > 0 && (
              <div className="mt-3 pt-3 border-t border-dark-border">
                <div className="text-xs font-semibold text-dark-text-secondary mb-2">📅 Session Analysis:</div>
                <div className="space-y-2 text-xs text-dark-text">
                  {Object.entries(aiRec.timeframe_recommendations.session_analysis).map(([key, value]) => (
                    <div key={key} className="bg-dark-bg/50 rounded p-2">
                      {typeof value === 'object' && value !== null ? (
                        <>
                          {value.time && (
                            <div className="font-semibold text-dark-text mb-1">
                              {key.replace('_', ' ').toUpperCase()}: {value.time}
                            </div>
                          )}
                          {value.characteristics && (
                            <div className="text-dark-text-secondary mb-1">
                              {value.characteristics}
                            </div>
                          )}
                          {value.recommendation && (
                            <div className="text-dark-text font-semibold">
                              💡 {value.recommendation}
                            </div>
                          )}
                          {typeof value === 'object' && !value.time && (
                            Object.entries(value).map(([subKey, subValue]) => (
                              <div key={subKey} className="mb-1">
                                <span className="font-semibold capitalize">{subKey}:</span> {subValue}
                              </div>
                            ))
                          )}
                        </>
                      ) : (
                        <div>{value}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
            <span>🤖</span>
            AI Stock Recommendations
          </h3>
          <p className="text-sm text-dark-text-secondary mt-1">
            AI-powered analysis based on technical indicators, signal strength, and market patterns
          </p>
        </div>
        {/* Mode Selector - Compact Version */}
        <div className="md:w-auto">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
            <h4 className="text-xs font-semibold text-dark-text-secondary mb-2">Trading Mode</h4>
            <div className="flex gap-2">
              {[
                { value: 'intraday', label: 'Intraday', icon: '⚡' },
                { value: 'swing', label: 'Swing', icon: '📈' },
                { value: 'longterm', label: 'Long Term', icon: '📊' },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleModeChange(m.value)}
                  disabled={loadingMode}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 ${
                    mode === m.value
                      ? 'bg-blue-accent text-white shadow-lg shadow-blue-accent/30'
                      : 'bg-dark-card text-dark-text-secondary hover:bg-dark-border hover:text-dark-text border border-dark-border'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
                >
                  {loadingMode && mode === m.value ? (
                    <>
                      <span className="animate-spin text-xs">⏳</span>
                      <span>{m.label}</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-1">{m.icon}</span>
                      <span>{m.label}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && searchTerm.trim()) {
                handleSearch(searchTerm.trim());
              }
            }}
            placeholder="Search any stock symbol (e.g., RELIANCE, TCS)..."
            className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:border-blue-accent focus:ring-1 focus:ring-blue-accent"
          />
          <button
            onClick={() => {
              if (searchTerm.trim()) {
                handleSearch(searchTerm.trim());
              } else {
                setSearchResults(null);
              }
            }}
            disabled={searching}
            className="px-6 py-2 bg-blue-accent hover:bg-blue-accent/80 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {searching ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>Search</span>
              </>
            )}
          </button>
        </div>
        
        {/* Autocomplete Suggestions */}
        {suggestions.length > 0 && searchTerm && !searchResults && (
          <div className="absolute z-10 w-full mt-1 bg-dark-bg border border-dark-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSearchTerm(suggestion);
                  handleSearch(suggestion);
                }}
                className="px-4 py-2 hover:bg-dark-card cursor-pointer text-dark-text border-b border-dark-border last:border-b-0"
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="mb-6">
          {searchResults.error ? (
            <div className="bg-red-sell/10 border border-red-sell/50 rounded-lg p-4">
              <div className="text-red-sell font-semibold mb-2">⚠️ {searchResults.error}</div>
              <div className="text-sm text-dark-text-secondary">
                Stock "{searchResults.symbol}" not found or not analyzed yet. Please try another symbol or wait for analysis to complete.
              </div>
            </div>
          ) : (
            <div className="bg-green-buy/10 border border-green-buy/50 rounded-lg p-4 mb-4">
              <div className="text-green-buy font-semibold mb-2">✅ Found: {searchResults.symbol}</div>
              <button
                onClick={() => setSearchResults(null)}
                className="text-xs text-dark-text-secondary hover:text-dark-text"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-4">
        {/* Show search result if available */}
        {searchResults && !searchResults.error && (
          <div>
            {renderStockCard({
              symbol: searchResults.symbol,
              analysis: searchResults.analysis,
              ai_recommendation: searchResults.ai_recommendation
            })}
          </div>
        )}
        
        {/* Show filtered top stocks */}
        {!searchResults && (
          <>
            {loadingMode ? (
              <div className="text-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <span className="animate-spin text-3xl">⏳</span>
                  <div className="text-dark-text-secondary">
                    <div className="font-semibold mb-1">Loading recommendations...</div>
                    <div className="text-xs">Switching to <span className="font-semibold text-blue-accent capitalize">{mode}</span> mode</div>
                  </div>
                </div>
              </div>
            ) : filteredTopStocks.length === 0 ? (
              <div className="text-center py-8 text-dark-text-secondary">
                {searchTerm ? `No stocks found matching "${searchTerm}"` : 'No top recommendations available'}
              </div>
            ) : (
              <>
                <div className="text-sm text-dark-text-secondary mb-2">
                  Showing {filteredTopStocks.length} of {topStocksData.length} top recommendations
                  {searchTerm && ` matching "${searchTerm}"`}
                  {' • '}
                  <span className="font-semibold text-blue-accent capitalize">{mode}</span> mode
                </div>
                {filteredTopStocks.map((item, index) => renderStockCard(item, index + 1))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;
