"""
Background Task Manager for Stock Analysis
Handles periodic analysis and real-time updates
"""
import asyncio
import logging
from typing import Dict, List, Optional, Callable
from datetime import datetime
from collections import deque
import json

from database import DatabaseManager
from data_fetcher import StockDataFetcher
from indicators import TechnicalIndicators
from signals import SignalAnalyzer
from ai_recommender import AIStockRecommender

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BackgroundTaskManager:
    """Manages background stock analysis tasks"""
    
    def __init__(self):
        self.data_fetcher = StockDataFetcher()
        self.ai_recommender = AIStockRecommender()
        self.analysis_cache = {}
        self.stocks_list = []  # BASE STOCK LIST CACHE
        self.update_callbacks = []
        self.is_running = False
        self.current_task = None
        self.is_preloaded = False
        self.custom_symbols = set()  # Track custom symbols like options or user-added stocks

    async def preload_stocks(self):
        """Load all stocks from NSE API into memory cache at startup"""
        try:
            logger.info("⚡ Loading stocks from NSE API...")
            # Async fetch from NSE — no MySQL needed
            stocks = await DatabaseManager.fetch_stocks_from_nse()
            
            if not stocks:
                logger.warning("⚠️  NSE returned no stocks. Retrying in 10s...")
                await asyncio.sleep(10)
                stocks = await DatabaseManager.fetch_stocks_from_nse()

            # Normalize and store in memory
            normalized_stocks = []
            for stock in stocks:
                symbol = stock.get('symbol')
                if symbol:
                    stock_info = {
                        "symbol": symbol.upper(),
                        "name": stock.get('name', symbol.upper()),
                        "industry": stock.get('industry', ''),
                        "sector": stock.get('sector', '')
                    }
                    normalized_stocks.append(stock_info)
            
            self.stocks_list = normalized_stocks
            self.is_preloaded = True
            logger.info(f"✅ Preloaded {len(self.stocks_list)} stocks from NSE into memory")
            
            # Trigger FIRST analysis immediately in background
            if self.stocks_list:
                symbols = [s['symbol'] for s in self.stocks_list]
                asyncio.create_task(self.analyze_all_stocks(symbols, mode='swing', chunk_size=10))
                
        except Exception as e:
            logger.error(f"❌ Failed to preload stocks from NSE: {e}")
        
    def add_update_callback(self, callback: Callable):
        """Add callback for real-time updates"""
        self.update_callbacks.append(callback)
    
    def remove_update_callback(self, callback: Callable):
        """Remove callback"""
        if callback in self.update_callbacks:
            self.update_callbacks.remove(callback)
    
    async def _notify_update(self, symbol: str, data: Dict):
        """Notify all callbacks of update (can be stock analysis or system notification)"""
        for callback in self.update_callbacks:
            try:
                await callback(symbol, data)
            except Exception as e:
                logger.error(f"Error in update callback: {e}")

    async def _check_auto_exits(self, current_prices: Dict[str, float]):
        """Check if any open position has hit SL or Target and exit automatically"""
        try:
            from trading_manager import TradingManager
            # Get positions with current prices
            positions = TradingManager.get_positions(current_prices)
            for pos in positions:
                symbol = pos['symbol']
                price = pos.get('current_price')
                if not price: continue
                
                reason = None
                # Check SL (Price falls below or equal to SL)
                sl = pos.get('stop_loss')
                if sl and price <= sl:
                    reason = "SL_HIT"
                
                # Check Target (Price rises above or equal to Target)
                target = pos.get('target')
                if target and price >= target:
                    reason = "TARGET_HIT"
                
                if reason:
                    logger.info(f"🚨 {reason}: Auto-exiting {symbol} @ ₹{price}")
                    exit_result = TradingManager.exit_position(symbol, price, reason=reason)
                    
                    # Notify UI about the automatic exit
                    await self._notify_update("SYSTEM_ALERT", {
                        "type": "trade_auto_exit",
                        "symbol": symbol,
                        "reason": reason,
                        "price": price,
                        "pnl": exit_result.get('trade', {}).get('pnl', 0),
                        "message": exit_result.get('message'),
                        "timestamp": datetime.now().isoformat()
                    })
        except Exception as e:
            logger.error(f"Error in auto-exit check: {e}")
    
    async def analyze_stock(self, symbol: str, mode: str = 'swing') -> Dict:
        """Analyze a single stock"""
        try:
            # Fetch data
            df = await self.data_fetcher.fetch_data(symbol, mode=mode)
            if df is None or df.empty:
                return None
            
            # Calculate indicators
            indicators = TechnicalIndicators(df)
            df_with_indicators = indicators.calculate_all()
            indicators.df = df_with_indicators
            
            # Analyze signals
            analyzer = SignalAnalyzer(indicators)
            analysis = analyzer.analyze()
            
            # Get latest values from indicators
            values = indicators.get_latest_values()
            
            # Use price from yfinance data (bulk ticker will update to real-time later)
            final_price = values.get('price')
            
            # Prepare result
            ema_20_val = round(values.get('ema_20'), 2) if values.get('ema_20') else None
            ema_50_val = round(values.get('ema_50'), 2) if values.get('ema_50') else None
            
            # Calculate price change percentage
            prev_price = values.get('prev_price')
            price_change_pct = 0.0
            if prev_price and prev_price > 0:
                price_change_pct = round(((final_price - prev_price) / prev_price) * 100, 2)
            
            result = {
                "symbol": symbol.upper(),
                "mode": mode,
                "price": final_price,
                "price_change_pct": price_change_pct,
                "rsi": round(values.get('rsi'), 2) if values.get('rsi') else None,
                "macd": round(values.get('macd'), 4) if values.get('macd') else None,
                "ema20": ema_20_val,
                "ema50": ema_50_val,
                "ema_20": ema_20_val,
                "ema_50": ema_50_val,
                "trend": analysis.get('trend'),
                "volume_signal": analysis.get('volume_signal'),
                "buy_signals": analysis.get('buy_signals', []),
                "sell_signals": analysis.get('sell_signals', []),
                "buy_count": analysis.get('buy_count', 0),
                "sell_count": analysis.get('sell_count', 0),
                "final_verdict": analysis.get('final_verdict'),
                "buy_price": analysis.get('buy_price'),
                "sell_price": analysis.get('sell_price'),
                "open": values.get('open'),
                "high": values.get('high'),
                "low": values.get('low'),
                "volume": values.get('volume'),
                "macd_signal": round(values.get('macd_signal'), 4) if values.get('macd_signal') else None,
                "macd_hist": round(values.get('macd_hist'), 4) if values.get('macd_hist') else None,
                "timestamp": datetime.now().isoformat()
            }
            
            # Add AI recommendation
            ai_recommendation = self.ai_recommender.generate_recommendation(result, {})
            result["ai_recommendation"] = ai_recommendation
            
            # Cache result
            self.analysis_cache[symbol.upper()] = result
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing {symbol}: {e}")
            return None
    
    async def analyze_all_stocks(self, symbols: List[str], mode: str = 'swing', 
                                chunk_size: int = 10):
        """Analyze all stocks using high-performance batch fetching"""
        total = len(symbols)
        processed = 0
        
        logger.info(f"Starting HIGH-SPEED analysis of {total} stocks (chunk size: {chunk_size})")
        
        for i in range(0, total, chunk_size):
            chunk = symbols[i:i + chunk_size]
            
            # Fetch data in batch (much faster than individual calls)
            batch_data = await self.data_fetcher.fetch_batch_data(chunk, mode=mode)
            
            # Process results one by one
            for symbol in chunk:
                df = batch_data.get(symbol)
                if df is None or df.empty:
                    continue
                
                try:
                    # Calculate indicators (this is CPU bound)
                    indicators = TechnicalIndicators(df)
                    df_with_indicators = indicators.calculate_all()
                    indicators.df = df_with_indicators
                    
                    # Analyze signals
                    analyzer = SignalAnalyzer(indicators)
                    analysis = analyzer.analyze()
                    
                    # Get results
                    values = indicators.get_latest_values()
                    
                    # Use price from yfinance data (bulk ticker will update to real-time later)
                    final_price = values.get('price')
                    
                    # Calculate EMA values
                    ema_20_val = round(values.get('ema_20'), 2) if values.get('ema_20') else None
                    ema_50_val = round(values.get('ema_50'), 2) if values.get('ema_50') else None
                    
                    # Calculate price change percentage
                    prev_price = values.get('prev_price')
                    price_change_pct = 0.0
                    if prev_price and prev_price > 0:
                        price_change_pct = round(((final_price - prev_price) / prev_price) * 100, 2)
                    
                    result = {
                        "symbol": symbol.upper(),
                        "mode": mode,
                        "price": final_price,
                        "price_change_pct": price_change_pct,
                        "rsi": round(values.get('rsi'), 2) if values.get('rsi') else None,
                        "macd": round(values.get('macd'), 4) if values.get('macd') else None,
                        "ema20": ema_20_val,
                        "ema50": ema_50_val,
                        "ema_20": ema_20_val,
                        "ema_50": ema_50_val,
                        "trend": analysis.get('trend'),
                        "volume_signal": analysis.get('volume_signal'),
                        "buy_signals": analysis.get('buy_signals', []),
                        "sell_signals": analysis.get('sell_signals', []),
                        "buy_count": analysis.get('buy_count', 0),
                        "sell_count": analysis.get('sell_count', 0),
                        "final_verdict": analysis.get('final_verdict'),
                        "buy_price": analysis.get('buy_price'),
                        "sell_price": analysis.get('sell_price'),
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    # AI Recommendation (optional, can be slow)
                    try:
                        ai_rec = self.ai_recommender.generate_recommendation(result, {})
                        result["ai_recommendation"] = ai_rec
                    except:
                        pass
                    
                    # Cache and Notify
                    self.analysis_cache[symbol.upper()] = result
                    await self._notify_update(symbol, result)
                    processed += 1
                except Exception as e:
                    logger.error(f"Error processing {symbol} in batch: {e}")
            
            logger.info(f"Progress: {processed}/{total} stocks analyzed")
            # Delay between chunks to avoid rate limiting
            await asyncio.sleep(1)
        
        logger.info(f"Completed analysis of {processed}/{total} stocks")
        return processed
    
    async def start_periodic_refresh(self, interval_minutes: int = 3):
        """Start periodic refresh task"""
        if self.is_running:
            logger.warning("Background task already running")
            return
        
        self.is_running = True
        logger.info(f"Starting periodic refresh every {interval_minutes} minutes")
        
        while self.is_running:
            try:
                # Use cached stock list if available
                if self.is_preloaded and self.stocks_list:
                    symbols = [s['symbol'] for s in self.stocks_list]
                else:
                    # Fallback: re-fetch from NSE
                    logger.info("Re-fetching stock list from NSE for refresh...")
                    stocks = await DatabaseManager.fetch_stocks_from_nse()
                    symbols = [s.get('symbol', '').upper() for s in stocks if s.get('symbol')]
                
                if symbols:
                    logger.info(f"Refreshing {len(symbols)} stocks...")
                    await self.analyze_all_stocks(symbols, mode='swing', chunk_size=10)
                    logger.info("Refresh completed")
                else:
                    logger.warning("No symbols found for refresh")
                
            except Exception as e:
                logger.error(f"Error in periodic refresh: {e}")
            
            # Wait for next interval
            await asyncio.sleep(interval_minutes * 60)

    def add_custom_symbol(self, symbol: str):
        """Add a custom symbol to be tracked in background"""
        if symbol:
            self.custom_symbols.add(symbol.upper())
            logger.info(f"Added custom symbol to tracking: {symbol}")

    def get_custom_symbols(self) -> List[str]:
        """Get all custom symbols"""
        return list(self.custom_symbols)
    
    async def start_live_price_ticker(self, interval_seconds: int = 20):
        """Bulk price ticker using index constituents API (avoids rate limiting)"""
        from nse_scraper import nse_scraper
        from config import NSE_INDICES
        
        self.is_running = True
        logger.info(f"Starting BULK price ticker every {interval_seconds} seconds")
        while self.is_running:
            try:
                updated_count = 0
                
                # Fetch prices in BULK from index constituents (each call returns 50+ stock prices)
                for index_name in NSE_INDICES:
                    try:
                        data = await nse_scraper.get_index_constituents(index_name)
                        if data and 'data' in data:
                            for row in data['data']:
                                symbol = row.get('symbol', '').strip().upper()
                                if symbol and symbol in self.analysis_cache:
                                    new_price = row.get('lastPrice')
                                    if new_price:
                                        new_price = float(new_price)
                                        analysis = self.analysis_cache[symbol]
                                        old_price = analysis.get('price')
                                        if old_price != new_price:
                                            analysis['price'] = new_price
                                            # Update price change % too
                                            change = row.get('pChange')
                                            if change is not None:
                                                analysis['price_change_pct'] = round(float(change), 2)
                                            analysis['timestamp'] = datetime.now().isoformat()
                                            await self._notify_update(symbol, analysis)
                                            updated_count += 1
                    except Exception as e:
                        logger.error(f"Ticker error for index {index_name}: {e}")
                    
                    # Small delay between index fetches to avoid rate limiting
                    await asyncio.sleep(2)
                
                if updated_count > 0:
                    logger.info(f"Ticker: Updated {updated_count} stock prices via bulk index API")
                    
                    # After price updates, check for auto-exits (SL/Target)
                    all_cached = self.get_all_analyses()
                    prices = {s: float(data.get('price', 0)) for s, data in all_cached.items() if data.get('price')}
                    if prices:
                        await self._check_auto_exits(prices)
                
                # UPDATE CUSTOM SYMBOLS (Options, etc.)
                if self.custom_symbols:
                    logger.info(f"Ticker: Updating {len(self.custom_symbols)} custom symbols...")
                    updated_custom = 0
                    current_custom_prices = {}
                    
                    for symbol in list(self.custom_symbols):
                        try:
                            price = await self.data_fetcher.get_current_price(symbol)
                            if price:
                                current_custom_prices[symbol] = price
                                if symbol not in self.analysis_cache:
                                    self.analysis_cache[symbol] = {"symbol": symbol, "price": price}
                                else:
                                    self.analysis_cache[symbol]['price'] = price
                                self.analysis_cache[symbol]['timestamp'] = datetime.now().isoformat()
                                await self._notify_update(symbol, self.analysis_cache[symbol])
                                updated_custom += 1
                        except Exception as e:
                            logger.error(f"Error updating custom symbol {symbol}: {e}")
                    
                    # Check auto-exits for custom symbols too
                    if current_custom_prices:
                        await self._check_auto_exits(current_custom_prices)
                
                # UPDATE MARKET INDICES TOO
                indices = await self.data_fetcher.get_live_indices_data()
                if indices:
                    # Filter for core indices
                    core_indices = ["NIFTY 50", "NIFTY BANK", "NIFTY NEXT 50", "NIFTY FIN SERVICE"]
                    filtered_indices = [idx for idx in indices if idx['symbol'] in core_indices]
                    
                    if filtered_indices:
                        await self._notify_update("MARKET_INDICES", {
                            "type": "market_indices",
                            "indices": filtered_indices,
                            "timestamp": datetime.now().isoformat()
                        })
                        logger.info(f"Ticker: Updated {len(filtered_indices)} core indices")
                
            except Exception as e:
                logger.error(f"Error in price ticker: {e}")
            
            await asyncio.sleep(interval_seconds)

    async def start_ai_scanner(self, interval_hours: int = 1):
        """AI Research Scanner: Finds best stocks and sends Email/Telegram alerts"""
        # Delay start to allow initial preloading to finish
        await asyncio.sleep(60)
        
        while self.is_running:
            try:
                from ai_stock.main import AIStockResearchEngine
                from ai_stock.integration import initialize_ai_engine
                
                logger.info(f"AI Scanner: Starting comprehensive market scan for best stocks...")
                
                # Initialize engine if not already done
                engine = initialize_ai_engine()
                
                # Use popular + index stocks for top-tier scanning
                symbols = AIStockResearchEngine.DEFAULT_INDIAN_STOCKS[:30]
                
                # Filter out those we already have in cache if needed, 
                # but run_complete_analysis handles its own caching/logic.
                
                # Run complete analysis with alerts enabled
                results = await engine.run_complete_analysis(symbols, send_alerts=True)
                
                if results.get('status') == 'success':
                    logger.info(f"AI Scanner: Completed scan. {results.get('stocks_analyzed')} stocks checked.")
                    
                    # Notify UI of scan completion and top pick
                    top_picks = results.get('ranking_results', {}).get('top_5_buy', [])
                    if top_picks:
                        best_stock = top_picks[0]
                        await self._notify_update("AI_SCAN_NOTIFICATION", {
                            "type": "ai_best_stock_found",
                            "symbol": best_stock.get('symbol'),
                            "score": best_stock.get('final_score'),
                            "price": best_stock.get('current_price'),
                            "recommendation": best_stock.get('recommendation'),
                            "timestamp": datetime.now().isoformat()
                        })
                
            except Exception as e:
                logger.error(f"AI Scanner Fault: {e}", exc_info=True)
            
            # Scan every X hours (default 1 hour)
            logger.info(f"AI Scanner: Waiting {interval_hours} hours for next deep scan.")
            await asyncio.sleep(interval_hours * 3600)

    def stop_periodic_refresh(self):
        """Stop periodic refresh"""
        self.is_running = False
        logger.info("Stopped periodic refresh")
    
    def get_analysis(self, symbol: str) -> Optional[Dict]:
        """Get cached analysis"""
        return self.analysis_cache.get(symbol.upper())
    
    def get_all_analyses(self) -> Dict[str, Dict]:
        """Get all cached analyses"""
        return self.analysis_cache.copy()


    async def get_cached_stocks(self) -> List[Dict]:
        """Return all stocks with their latest analysis from memory cache"""
        if not self.is_preloaded:
            await self.preload_stocks()
            
        results = []
        for stock_info in self.stocks_list:
            symbol = stock_info['symbol']
            # Merge base info with latest analysis cache
            analysis = self.analysis_cache.get(symbol, {})
            merged = {**stock_info, **analysis}
            results.append(merged)
        return results

# Global instance
task_manager = BackgroundTaskManager()
