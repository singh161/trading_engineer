"""
FastAPI Main Application
Stock Market Analysis Backend API
"""
from fastapi import FastAPI, HTTPException, Query, Body, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Dict, Optional
from contextlib import asynccontextmanager
import logging
from datetime import datetime
import asyncio
import json

from database import DatabaseManager
from data_fetcher import StockDataFetcher
from indicators import TechnicalIndicators
from signals import SignalAnalyzer
from config import (
    API_TITLE, API_VERSION, FILTER_BY_MOMENTUM, MOMENTUM_MIN_SIGNALS, MOMENTUM_MIN_RSI_DIFF,
    FILTER_BY_PRICE, MIN_STOCK_PRICE, MAX_STOCK_PRICE
)
from background_tasks import task_manager
from ai_recommender import AIStockRecommender
from backtesting_engine import run_backtest
from portfolio_manager import PortfolioManager
from trading_manager import TradingManager
from pydantic import BaseModel

# Import AI Stock Research Engine integration
try:
    from ai_stock.integration import add_ai_endpoints, initialize_ai_engine
    AI_STOCK_ENGINE_AVAILABLE = True
except ImportError as e:
    AI_STOCK_ENGINE_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning(f"AI Stock Research Engine not available: {e}")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize components
db_manager = DatabaseManager()
data_fetcher = StockDataFetcher()
ai_recommender = AIStockRecommender()

# SSE update queue
sse_clients = []


async def sse_update_handler(symbol: str, analysis: Dict):
    """Handle SSE updates"""
    try:
        message = {
            "type": "stock_update",
            "symbol": symbol,
            "data": analysis,
            "timestamp": datetime.now().isoformat()
        }
        
        # Send to all SSE clients
        disconnected_clients = []
        for client_queue in sse_clients:
            try:
                await client_queue.put(message)
            except Exception as e:
                logger.error(f"Error sending SSE update: {e}")
                disconnected_clients.append(client_queue)
        
        # Remove disconnected clients
        for client in disconnected_clients:
            if client in sse_clients:
                sse_clients.remove(client)
    except Exception as e:
        logger.error(f"Error in SSE update handler: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    try:
        # Register update handlers
        task_manager.add_update_callback(sse_update_handler)
        task_manager.add_update_callback(ws_update_handler)
        
        # Init portfolio JSON storage
        PortfolioManager.setup_table()
        
        # Start preloading in background so server starts immediately
        asyncio.create_task(task_manager.preload_stocks())
        
        # Start background refresh task
        refresh_task = asyncio.create_task(
            task_manager.start_periodic_refresh(interval_minutes=3)
        )
        
        # Start ultra-fast live price ticker (Every 20 seconds)
        price_ticker_task = asyncio.create_task(
            task_manager.start_live_price_ticker(interval_seconds=20)
        )
        
        # Start AI Intelligence Scanner (Every 1 hour)
        # Finds best stocks and sends Email/Telegram alerts
        ai_scanner_task = asyncio.create_task(
            task_manager.start_ai_scanner(interval_hours=1)
        )

        # Register existing trading positions for custom tracking
        positions = TradingManager.get_positions()
        for pos in positions:
            task_manager.add_custom_symbol(pos['symbol'])
        
        logger.info("Application started! Preloading stocks and starting background tasks...")
    except Exception as e:
        logger.error(f"Failed to initialize application: {e}")
    
    yield
    
    # Shutdown
    task_manager.stop_periodic_refresh()
    sse_clients.clear()
    logger.info("Application shutting down")


# Initialize FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description="Professional Stock Market Analysis Backend API",
    lifespan=lifespan
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add AI Stock Research Engine endpoints
if AI_STOCK_ENGINE_AVAILABLE:
    try:
        logger.info("Attempting to register AI Stock Research Engine endpoints...")
        add_ai_endpoints(app)
        
        # Verify endpoints were registered
        ai_routes = [r.path for r in app.routes if hasattr(r, 'path') and '/ai/' in r.path]
        if ai_routes:
            logger.info(f"✅ AI Stock Research Engine endpoints registered successfully ({len(ai_routes)} endpoints)")
            logger.info(f"   Available endpoints: {', '.join(sorted(ai_routes))}")
        else:
            logger.warning("⚠️ AI endpoints function called but no routes registered!")
    except Exception as e:
        logger.error(f"❌ Failed to register AI endpoints: {e}")
        import traceback
        logger.error(traceback.format_exc())
else:
    logger.warning("⚠️ AI Stock Research Engine not available - endpoints not registered")
    logger.warning("   Check if ai_stock module can be imported")


@app.get("/")
async def root():
    """Root endpoint — serve frontend if available, else API info"""
    import os
    frontend_index = os.path.join(os.path.dirname(__file__), "frontend", "dist", "index.html")
    if os.path.isfile(frontend_index):
        from fastapi.responses import FileResponse
        return FileResponse(frontend_index)
    return {
        "message": "Stock Market Analysis API",
        "version": API_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    stocks_loaded = len(task_manager.stocks_list)
    analyses_cached = len(task_manager.analysis_cache)
    return {
        "status": "healthy",
        "data_source": "NSE API (MySQL-free)",
        "stocks_in_memory": stocks_loaded,
        "analyses_cached": analyses_cached,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/stocks")
async def get_all_stocks(
    filter_momentum: bool = Query(None),
    filter_price: bool = Query(None)
):
    """
    Get all preloaded NSE stocks from memory
    
    Args:
        filter_momentum: Whether to filter by momentum (optional)
        filter_price: Whether to filter by price range (optional)
    """
    stocks = task_manager.stocks_list
    
    if not stocks:
        # If cache is empty, return empty list
        return []
        
    filtered_stocks = stocks
    
    # Optional filtering can be added here if needed
    # (Currently, the frontend expects a full list or basic filtering)
    
    return filtered_stocks


def has_momentum(analysis: Dict) -> bool:
    """
    Check if stock has momentum based on technical indicators
    
    Momentum Criteria:
    1. Minimum signal count (buy_count + sell_count >= MOMENTUM_MIN_SIGNALS)
    2. Clear trend direction (UP or DOWN, not NEUTRAL)
    3. RSI showing momentum (away from neutral zone) OR strong signal count
    4. MACD showing momentum OR strong signal count
    5. Final verdict should not be NEUTRAL (unless very strong signals)
    
    Args:
        analysis: Stock analysis dictionary
    
    Returns:
        True if stock has momentum, False otherwise
    """
    if not analysis:
        return False
    
    # Check signal strength
    buy_count = analysis.get('buy_count', 0)
    sell_count = analysis.get('sell_count', 0)
    total_signals = buy_count + sell_count
    signal_diff = abs(buy_count - sell_count)
    
    # Must have minimum signals
    if total_signals < MOMENTUM_MIN_SIGNALS:
        return False
    
    # Strong signal difference indicates momentum
    if signal_diff >= 5:
        return True  # Strong momentum regardless of other factors
    
    # Check trend (must be UP or DOWN, not NEUTRAL)
    trend = analysis.get('trend', 'NEUTRAL')
    if trend == 'NEUTRAL' and signal_diff < 4:
        return False
    
    # Check RSI momentum (should be away from neutral zone)
    rsi = analysis.get('rsi')
    rsi_shows_momentum = False
    if rsi:
        rsi_diff_from_neutral = abs(rsi - 50)
        if rsi_diff_from_neutral >= MOMENTUM_MIN_RSI_DIFF:
            rsi_shows_momentum = True
        # Also check for extreme RSI (oversold/overbought)
        if rsi < 35 or rsi > 65:
            rsi_shows_momentum = True
    
    # Check MACD momentum
    macd_hist = analysis.get('macd_hist')
    macd_shows_momentum = False
    if macd_hist is not None:
        if abs(macd_hist) >= 1.0:  # Significant MACD histogram
            macd_shows_momentum = True
    
    # Check volume signal
    volume_signal = analysis.get('volume_signal', 'NEUTRAL')
    volume_confirms = volume_signal in ['BUY', 'SELL']
    
    # Stock has momentum if:
    # 1. Strong signal difference (>= 5), OR
    # 2. Clear trend + (RSI momentum OR MACD momentum OR volume confirmation)
    if signal_diff >= 4:
        if trend != 'NEUTRAL' and (rsi_shows_momentum or macd_shows_momentum or volume_confirms):
            return True
    
    # Check final verdict
    verdict = analysis.get('final_verdict', 'NEUTRAL')
    if verdict != 'NEUTRAL' and signal_diff >= 3:
        return True
    
    return False


def is_price_in_range(price: Optional[float]) -> bool:
    """
    Check if stock price is within configured range
    
    Args:
        price: Stock price (can be None)
    
    Returns:
        True if price is in range or None (to allow stocks without price data initially)
    """
    if price is None:
        return True  # Allow stocks without price data (will be filtered later when analyzed)
    
    return MIN_STOCK_PRICE <= price <= MAX_STOCK_PRICE


@app.get("/stocks", response_model=List[Dict])
async def get_stocks(
    filter_momentum: bool = Query(None, description="Filter stocks by momentum (overrides FILTER_BY_MOMENTUM config)"),
    filter_price: bool = Query(None, description="Filter stocks by price range (overrides FILTER_BY_PRICE config)")
):
    """
    Get NSE equity stocks from memory cache (Fast response)
    """
    try:
        # GET FROM MEMORY CACHE INSTEAD OF DB
        stocks = await task_manager.get_cached_stocks()
        
        # Apply filters
        should_filter_momentum = filter_momentum if filter_momentum is not None else FILTER_BY_MOMENTUM
        should_filter_price = filter_price if filter_price is not None else FILTER_BY_PRICE
        
        filtered_stocks = []
        
        for stock in stocks:
            symbol = stock.get('symbol', '').upper()
            if not symbol:
                continue
            
            # Since we merged analysis in get_cached_stocks, we scan the object itself
            analysis = stock if stock.get('price') else None
            
            # Apply momentum filter
            if should_filter_momentum:
                if analysis:
                    if not has_momentum(analysis):
                        continue
                # If no analysis yet, we still show it so it can be analyzed
            
            # Apply price filter
            if should_filter_price:
                price = stock.get('price')
                if price is not None:
                    if not is_price_in_range(price):
                        continue

            filtered_stocks.append(stock)
        # Log filter results
        filter_logs = []
        if should_filter_momentum:
            filter_logs.append(f"momentum filter (min signals: {MOMENTUM_MIN_SIGNALS})")
        if should_filter_price:
            filter_logs.append(f"price filter (₹{MIN_STOCK_PRICE} - ₹{MAX_STOCK_PRICE})")
        
        if filter_logs:
            logger.info(
                f"Applied filters: {', '.join(filter_logs)} | "
                f"{len(stocks)} total → {len(filtered_stocks)} filtered"
            )
        
        return filtered_stocks
    except Exception as e:
        logger.error(f"Error fetching stocks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stocks: {str(e)}")


@app.get("/analyze/{symbol}")
async def analyze_stock(
    symbol: str,
    mode: str = Query("swing", regex="^(intraday|swing|longterm)$")
):
    """
    Analyze a stock and return trading signals
    
    Args:
        symbol: Stock symbol (e.g., 'RELIANCE')
        mode: Trading mode - intraday (5m), swing (daily), or longterm (weekly)
    
    Returns:
        Analysis result with indicators and signals
    """
    try:
        # Fetch stock data
        logger.info(f"Analyzing {symbol} in {mode} mode")
        df = await data_fetcher.fetch_data(symbol, mode=mode)
        
        if df is None or df.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data available for symbol: {symbol}"
            )
        
        # Calculate indicators
        indicators = TechnicalIndicators(df)
        df_with_indicators = indicators.calculate_all()
        
        # Update indicators instance with calculated data
        indicators.df = df_with_indicators
        
        # Analyze signals
        analyzer = SignalAnalyzer(indicators)
        analysis = analyzer.analyze()
        
        # Get latest values
        values = indicators.get_latest_values()
        
        # Prepare response (matching exact API specification)
        ema_20_val = round(values.get('ema_20'), 2) if values.get('ema_20') else None
        ema_50_val = round(values.get('ema_50'), 2) if values.get('ema_50') else None
        
        # Calculate price change percentage
        prev_price = values.get('prev_price')
        price_change_pct = 0.0
        if prev_price and prev_price > 0:
            price_change_pct = round(((values.get('price') - prev_price) / prev_price) * 100, 2)
        
        result = {
            "symbol": symbol.upper(),
            "mode": mode,
            "price": values.get('price'),
            "price_change_pct": price_change_pct,
            "rsi": round(values.get('rsi'), 2) if values.get('rsi') else None,
            "macd": round(values.get('macd'), 4) if values.get('macd') else None,
            "ema20": ema_20_val,  # Exact format as per requirements
            "ema50": ema_50_val,  # Exact format as per requirements
            "ema_20": ema_20_val,  # Also include underscore version for compatibility
            "ema_50": ema_50_val,  # Also include underscore version for compatibility
            "trend": analysis.get('trend'),
            "volume_signal": analysis.get('volume_signal'),
            "buy_signals": analysis.get('buy_signals', []),
            "sell_signals": analysis.get('sell_signals', []),
            "buy_count": analysis.get('buy_count', 0),
            "sell_count": analysis.get('sell_count', 0),
            "final_verdict": analysis.get('final_verdict'),
            "buy_price": analysis.get('buy_price'),
            "sell_price": analysis.get('sell_price'),
            # Additional useful fields
            "open": values.get('open'),
            "high": values.get('high'),
            "low": values.get('low'),
            "volume": values.get('volume'),
            "macd_signal": round(values.get('macd_signal'), 4) if values.get('macd_signal') else None,
            "macd_hist": round(values.get('macd_hist'), 4) if values.get('macd_hist') else None,
            "timestamp": datetime.now().isoformat()
        }
        
        # Add AI recommendation
        ai_recommendation = ai_recommender.generate_recommendation(result, {})
        result["ai_recommendation"] = ai_recommendation
        
        return result
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Value error analyzing {symbol}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/market-index")
async def get_market_index():
    """
    Get NIFTY and BANKNIFTY trend analysis
    
    Returns:
        Market index trends and analysis
    """
    try:
        # Try real-time indices from scraper first
        live_indices = await data_fetcher.get_live_indices_data()
        
        results = {}
        if live_indices:
            # Map scraper names to standard names
            name_map = {
                "NIFTY 50": "NIFTY",
                "NIFTY BANK": "BANKNIFTY",
                "NIFTY FIN SERVICE": "FINNIFTY",
                "NIFTY NEXT 50": "NEXT50"
            }
            
            for idx in live_indices:
                mapped_name = name_map.get(idx['symbol'])
                if mapped_name:
                    results[mapped_name] = {
                        "price": idx['price'],
                        "change": idx['change'],
                        "pChange": idx['pChange'],
                        "open": idx['open'],
                        "high": idx['high'],
                        "low": idx['low'],
                        "trend": "NEUTRAL", # Default for scraper
                        "final_verdict": "NEUTRAL"
                    }
            
            # If we got results, add timestamp and return (skipping technical analysis for speed)
            if results:
                results["timestamp"] = datetime.now().isoformat()
                return results

        # Fallback to standard technical analysis if scraper fails
        # NIFTY symbol for yfinance
        nifty_symbol = "^NSEI"
        banknifty_symbol = "^NSEBANK"
        
        # ... rest of the existing fallback logic ...
        # (Actually, let's keep it concise and just return the scraper results or fallback)
        
        # If scraper failed completely, do basic yfinance fetch
        nifty_df = data_fetcher.get_index_data(nifty_symbol)
        if nifty_df is not None:
             # Add minimal data
             results["NIFTY"] = {"price": nifty_df['close'].iloc[-1], "trend": "UP"}
             
        results["timestamp"] = datetime.now().isoformat()
        return results
        
    except Exception as e:
        logger.error(f"Error fetching market index: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market index: {str(e)}")


@app.get("/api/chart-data/{symbol}")
async def get_chart_data(
    symbol: str,
    mode: str = Query("swing", regex="^(intraday|swing|longterm)$"),
    period: str = Query(None, description="Override period (e.g., 1d, 1mo, 3mo, 6mo, 1y, 5y)"),
    interval: str = Query(None, description="Override interval (e.g., 5m, 15m, 1d, 1wk)")
):
    """
    Get OHLCV candlestick data for charting
    Returns array of { time, open, high, low, close, volume }
    """
    try:
        df = await data_fetcher.fetch_data(symbol.upper(), mode=mode, period=period, interval=interval)
        
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail=f"No chart data for {symbol}")
        
        # Determine if intraday (need Unix timestamps) or daily (need YYYY-MM-DD)
        is_intraday = mode == 'intraday' or (interval and ('m' in interval or 'h' in interval))
        
        # Convert to Lightweight Charts format
        candles = []
        volumes = []
        for idx, row in df.iterrows():
            if is_intraday:
                # Lightweight Charts needs Unix timestamp (seconds) for intraday
                import pytz
                if hasattr(idx, 'timestamp'):
                    ts = int(idx.timestamp())
                else:
                    ts = int(datetime.fromisoformat(str(idx)).timestamp())
                time_val = ts
            else:
                # Daily/weekly: use YYYY-MM-DD string
                time_val = idx.strftime('%Y-%m-%d') if hasattr(idx, 'strftime') else str(idx)[:10]
            
            candles.append({
                "time": time_val,
                "open": round(float(row['open']), 2),
                "high": round(float(row['high']), 2),
                "low": round(float(row['low']), 2),
                "close": round(float(row['close']), 2),
            })
            volumes.append({
                "time": time_val,
                "value": int(row['volume']),
                "color": "rgba(38,166,154,0.3)" if row['close'] >= row['open'] else "rgba(239,83,80,0.3)"
            })
        
        return {
            "symbol": symbol.upper(),
            "candles": candles,
            "volumes": volumes,
            "count": len(candles),
            "is_intraday": is_intraday
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching chart data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Chart data failed: {str(e)}")


@app.post("/api/backtest/{symbol}")
async def backtest_stock(
    symbol: str, 
    timeframe: str = Query("daily"), 
    period: str = Query("6mo")
):
    """
    Run 9-point strategy backtest for given symbol
    """
    try:
        results = await run_backtest(symbol, timeframe, period)
        if "error" in results:
            raise HTTPException(status_code=400, detail=results["error"])
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Backtest error endpoint for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Backtest engine failed: {str(e)}")

class PortfolioTransaction(BaseModel):
    symbol: str
    quantity: int
    price: float

@app.get("/api/portfolio")
async def get_portfolio():
    """Get user portfolio holdings"""
    # Using task manager cache to inject real-time prices to portfolio
    holdings = PortfolioManager.get_portfolio()
    analysis_cache = task_manager.get_all_analyses()
    
    portfolio_data = []
    total_invested = 0
    total_current_value = 0
    
    for holding in holdings:
        sym = holding['symbol']
        qty = holding['quantity']
        avg = float(holding['average_price'])
        
        # Try to get live price from analysis cache
        current_price = avg # Fallback to average price
        if sym in analysis_cache:
            current_price = float(analysis_cache[sym].get('price', avg))
            
        invested = qty * avg
        current_value = qty * current_price
        pnl = current_value - invested
        pnl_pct = (pnl / invested * 100) if invested > 0 else 0
        
        total_invested += invested
        total_current_value += current_value
        
        portfolio_data.append({
            "symbol": sym,
            "quantity": qty,
            "average_price": avg,
            "current_price": current_price,
            "invested_value": round(invested, 2),
            "current_value": round(current_value, 2),
            "pnl": round(pnl, 2),
            "pnl_percentage": round(pnl_pct, 2)
        })
        
    return {
        "holdings": portfolio_data,
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_current_value": round(total_current_value, 2),
            "total_pnl": round(total_current_value - total_invested, 2),
            "total_pnl_percentage": round(((total_current_value - total_invested) / total_invested * 100) if total_invested > 0 else 0, 2)
        }
    }

@app.post("/api/portfolio/add")
async def add_to_portfolio(transaction: PortfolioTransaction):
    """Add or upate portfolio holding"""
    result = PortfolioManager.add_transaction(transaction.symbol, transaction.quantity, transaction.price)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.delete("/api/portfolio/delete/{symbol}")
async def remove_from_portfolio(symbol: str):
    """Remove symbol from portfolio"""
    result = PortfolioManager.remove_stock(symbol)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/api/portfolio/average_down")
async def evaluate_average_down(transaction: PortfolioTransaction, current_qty: int = Query(...), current_avg: float = Query(...)):
    """Calculate prospective average down metrics"""
    return PortfolioManager.calculate_average_down(current_qty, current_avg, transaction.quantity, transaction.price)

@app.get("/market-index-constituents")
async def get_market_index_constituents(index: str = Query(..., description="The NSE index name to fetch")):
    """
    Get constituents of a specific NSE index
    """
    try:
        from nse_scraper import nse_scraper
        data = await nse_scraper.get_index_constituents(index)
        if data:
            return data
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch index constituents from NSE")
    except Exception as e:
        logger.error(f"Error fetching exact index constituents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analyze/batch")
async def analyze_batch(
    symbols: str = Query(..., description="Comma-separated list of symbols"),
    mode: str = Query("swing", regex="^(intraday|swing|longterm)$")
):
    """
    Analyze multiple stocks in batch
    
    Args:
        symbols: Comma-separated stock symbols (e.g., "RELIANCE,TCS,INFY")
        mode: Trading mode
    
    Returns:
        List of analysis results
    """
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        results = []
        
        for symbol in symbol_list:
            try:
                result = await analyze_stock(symbol, mode)
                results.append(result)
            except Exception as e:
                logger.error(f"Error analyzing {symbol}: {e}")
                results.append({
                    "symbol": symbol,
                    "error": str(e)
                })
        
        return {
            "results": results,
            "total": len(results),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")


@app.post("/analyze/batch-chunked")
async def analyze_batch_chunked(
    symbols: List[str] = Body(..., description="List of stock symbols"),
    mode: str = Query("swing", regex="^(intraday|swing|longterm)$"),
    chunk_size: int = Query(10, ge=1, le=50, description="Number of stocks to process in parallel")
):
    """
    Analyze multiple stocks in chunks with controlled concurrency
    
    Args:
        symbols: List of stock symbols
        mode: Trading mode
        chunk_size: Number of stocks to process in parallel (default: 10, max: 50)
    
    Returns:
        Dictionary with results and progress info
    """
    import asyncio
    
    try:
        if not symbols:
            return {
                "results": [],
                "total": 0,
                "processed": 0,
                "errors": 0,
                "timestamp": datetime.now().isoformat()
            }
        
        symbol_list = [s.strip().upper() for s in symbols if s and s.strip()]
        total = len(symbol_list)
        results = []
        errors = 0
        
        # Process in chunks
        async def analyze_with_error_handling(sym):
            try:
                return await analyze_stock(sym, mode)
            except Exception as e:
                logger.error(f"Error analyzing {sym}: {e}")
                return {
                    "symbol": sym,
                    "error": str(e)
                }
        
        for i in range(0, total, chunk_size):
            chunk = symbol_list[i:i + chunk_size]
            chunk_tasks = [analyze_with_error_handling(symbol) for symbol in chunk]
            
            # Process chunk in parallel
            chunk_results = await asyncio.gather(*chunk_tasks, return_exceptions=True)
            
            for result in chunk_results:
                if isinstance(result, Exception):
                    errors += 1
                    logger.error(f"Exception in chunk processing: {result}")
                elif result:
                    results.append(result)
                    if "error" in result:
                        errors += 1
        
        return {
            "results": results,
            "total": total,
            "processed": len(results),
            "errors": errors,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in chunked batch analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Chunked batch analysis failed: {str(e)}")


@app.get("/stream/updates")
async def stream_updates():
    """
    Server-Sent Events endpoint for real-time stock updates
    """
    import asyncio
    
    async def event_generator():
        queue = asyncio.Queue()
        sse_clients.append(queue)
        
        try:
            # Send initial connection message
            yield f"data: {json.dumps({'type': 'connected', 'message': 'SSE connection established'})}\n\n"
            
            # Send initial cached analyses
            cached_analyses = task_manager.get_all_analyses()
            if cached_analyses:
                yield f"data: {json.dumps({'type': 'initial_data', 'count': len(cached_analyses)})}\n\n"
            
            while True:
                try:
                    # Wait for message with timeout
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(message)}\n\n"
                except asyncio.TimeoutError:
                    # Send heartbeat
                    yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"
        except Exception as e:
            logger.error(f"SSE error: {e}")
        finally:
            if queue in sse_clients:
                sse_clients.remove(queue)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

# Add a callback to the background tasks to trigger websocket broadcasts
async def ws_update_handler(symbol: str, analysis: Dict):
    message = {
        "type": "stock_update",
        "symbol": symbol,
        "data": analysis,
        "timestamp": datetime.now().isoformat()
    }
    await manager.broadcast(message)

# We will need to register ws_update_handler to task_manager in lifespan
# Right now, it's just sse_update_handler

@app.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial cached analyses to get the client started quickly
        cached_analyses = task_manager.get_all_analyses()
        if cached_analyses:
            await websocket.send_json({'type': 'initial_data', 'count': len(cached_analyses)})
        
        while True:
            # Client can send commands if needed, for now just ping/pong or wait
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@app.post("/analyze/refresh-all")
async def refresh_all_stocks(
    mode: str = Query("swing", regex="^(intraday|swing|longterm)$")
):
    """
    Trigger refresh of all stocks (runs in background)
    """
    try:
        stocks = DatabaseManager.get_all_stocks()
        symbols = []
        for stock in stocks:
            symbol = stock.get('symbol') or stock.get('SYMBOL') or \
                    stock.get('symbal_name') or stock.get('name') or \
                    stock.get('identifier_name')
            if symbol:
                symbols.append(symbol.upper())
        
        if not symbols:
            raise HTTPException(status_code=404, detail="No stocks found")
        
        # Start background task
        asyncio.create_task(task_manager.analyze_all_stocks(symbols, mode, chunk_size=15))
        
        return {
            "status": "started",
            "total_stocks": len(symbols),
            "mode": mode,
            "message": "Refresh started in background. Updates will stream via SSE.",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error starting refresh: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start refresh: {str(e)}")


@app.get("/analyze/{symbol}/ai-recommendation")
async def get_ai_recommendation(
    symbol: str,
    mode: str = Query("swing", regex="^(intraday|swing|longterm)$")
):
    """
    Get AI-powered recommendation for a stock
    
    Args:
        symbol: Stock symbol
        mode: Trading mode (intraday, swing, longterm)
    """
    try:
        # Get cached analysis or analyze fresh with specified mode
        analysis = task_manager.get_analysis(symbol.upper())
        
        # Check if cached analysis matches the requested mode
        if not analysis or analysis.get('mode') != mode:
            # Analyze fresh with requested mode
            analysis = await task_manager.analyze_stock(symbol.upper(), mode)
            if not analysis:
                raise HTTPException(status_code=404, detail=f"No data available for {symbol}")
        
        # Get AI recommendation
        ai_recommendation = ai_recommender.generate_recommendation(analysis, {})
        
        return {
            "symbol": symbol.upper(),
            "analysis": analysis,
            "ai_recommendation": ai_recommendation,
            "mode": mode,
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting AI recommendation for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendation: {str(e)}")


@app.get("/recommendations/top-stocks")
async def get_top_stocks(
    limit: int = Query(10, ge=1, le=50),
    verdict: Optional[str] = Query(None, regex="^(STRONG BUY|BUY|STRONG SELL|SELL|NEUTRAL)$"),
    mode: str = Query("swing", regex="^(intraday|swing|longterm)$")
):
    """
    Get top recommended stocks based on AI analysis
    
    Args:
        limit: Maximum number of stocks to return
        verdict: Filter by verdict (optional)
        mode: Trading mode (intraday, swing, longterm)
    """
    try:
        all_analyses = task_manager.get_all_analyses()
        
        if not all_analyses:
            return {
                "stocks": [],
                "message": "No analyses available. Please wait for refresh.",
                "mode": mode,
                "timestamp": datetime.now().isoformat()
            }
        
        # Score stocks with recency priority
        scored_stocks = []
        for symbol, analysis in all_analyses.items():
            if not analysis or 'ai_recommendation' not in analysis:
                continue
            
            # Filter by mode if specified
            analysis_mode = analysis.get('mode', 'swing')
            if analysis_mode != mode:
                continue
            
            ai_rec = analysis.get('ai_recommendation', {})
            confidence = ai_rec.get('confidence_score', 0)
            verdict_val = analysis.get('final_verdict', 'NEUTRAL')
            
            # Filter by verdict if specified
            if verdict and verdict_val != verdict:
                continue
            
            # Get recency analysis
            recency_analysis = ai_rec.get('recency_analysis', {})
            is_pullback = recency_analysis.get('is_pullback', False)
            is_recent = recency_analysis.get('is_recent', True)
            recency_score = recency_analysis.get('recency_score', 0)
            
            # Calculate priority score: confidence + recency boost - pullback penalty
            priority_score = confidence
            
            # Boost for recent signals (current day/week)
            if is_recent and not is_pullback:
                priority_score += 30  # Strong boost for current signals
            elif is_recent and is_pullback:
                priority_score += 10  # Small boost even for pullbacks if recent
            
            # Penalty for pullback patterns
            if is_pullback:
                priority_score -= 20  # Reduce priority for pullback patterns
            
            # Additional boost from recency score
            priority_score += (recency_score / 50) * 15  # Scale recency score to 0-15 points
            
            scored_stocks.append({
                "symbol": symbol,
                "analysis": analysis,
                "confidence": confidence,
                "priority_score": priority_score,
                "verdict": verdict_val,
                "is_pullback": is_pullback,
                "is_recent": is_recent,
                "recency_score": recency_score
            })
        
        # Sort by priority score (recent signals first, pullbacks last)
        scored_stocks.sort(key=lambda x: (
            -x['is_recent'],  # Recent first
            -x['is_pullback'],  # Non-pullbacks first
            -x['priority_score']  # Higher priority first
        ))
        
        # Get top N
        top_stocks = scored_stocks[:limit]
        
        return {
            "stocks": top_stocks,
            "total": len(scored_stocks),
            "limit": limit,
            "mode": mode,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting top stocks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get top stocks: {str(e)}")


# ═══════════════════════════════════════════════════════════════
# TRADING ENDPOINTS — Paper Trading (Groww/Zerodha Style)
# ═══════════════════════════════════════════════════════════════

class TradeOrder(BaseModel):
    symbol: str
    order_type: str  # BUY or SELL
    quantity: int
    price: float
    stop_loss: Optional[float] = None
    target: Optional[float] = None
    instrument_type: str = "EQUITY"  # EQUITY or OPTION
    strike_price: Optional[float] = None
    expiry: Optional[str] = None
    option_type: Optional[str] = None  # CE or PE

class SLTargetUpdate(BaseModel):
    symbol: str
    stop_loss: Optional[float] = None
    target: Optional[float] = None

# Initialize trading manager
TradingManager.setup()

@app.get("/api/trading/dashboard")
async def trading_dashboard():
    """Get trading dashboard stats with live P&L"""
    try:
        analysis_cache = task_manager.get_all_analyses()
        current_prices = {
            sym: float(data.get('price', 0))
            for sym, data in analysis_cache.items()
            if data.get('price')
        }
        stats = TradingManager.get_dashboard_stats(current_prices)
        return stats
    except Exception as e:
        logger.error(f"Trading dashboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trading/positions")
async def trading_positions():
    """Get all open positions with live P&L"""
    try:
        analysis_cache = task_manager.get_all_analyses()
        current_prices = {
            sym: float(data.get('price', 0))
            for sym, data in analysis_cache.items()
            if data.get('price')
        }
        positions = TradingManager.get_positions(current_prices)
        return {"positions": positions}
    except Exception as e:
        logger.error(f"Trading positions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trading/order")
async def place_trade_order(order: TradeOrder):
    """Place a BUY or SELL order"""
    try:
        result = TradingManager.place_order(
            symbol=order.symbol,
            order_type=order.order_type,
            quantity=order.quantity,
            price=order.price,
            stop_loss=order.stop_loss,
            target=order.target,
            instrument_type=order.instrument_type,
            strike_price=order.strike_price,
            expiry=order.expiry,
            option_type=order.option_type,
        )
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Add to custom tracking if it's an option or not in standard list
        task_manager.add_custom_symbol(order.symbol)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Trading order error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/trading/update-sl-target")
async def update_sl_target(update: SLTargetUpdate):
    """Update stop loss and/or target for a position"""
    try:
        result = TradingManager.update_sl_target(
            symbol=update.symbol,
            stop_loss=update.stop_loss,
            target=update.target,
        )
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update SL/Target error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trading/exit/{symbol}")
async def exit_position(symbol: str, price: float = Query(...), reason: str = Query("MANUAL")):
    """Exit entire position"""
    try:
        result = TradingManager.exit_position(symbol, price, reason)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Exit position error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trading/history")
async def trade_history(limit: int = Query(50, ge=1, le=200)):
    """Get closed trade history"""
    return {"trades": TradingManager.get_trade_history(limit)}

@app.get("/api/trading/orders")
async def order_history(limit: int = Query(50, ge=1, le=200)):
    """Get order history"""
    return {"orders": TradingManager.get_orders(limit)}

@app.get("/api/trading/balance")
async def trading_balance():
    """Get current balance and overall P&L"""
    return TradingManager.get_balance()

@app.post("/api/trading/reset")
async def reset_trading():
    """Reset trading account"""
    return TradingManager.reset_account()


# Serve frontend static files in production
import os
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.isdir(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse
    
    # Serve static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="static-assets")
    
    # SPA fallback: serve index.html for all unmatched routes
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    from config import API_HOST, API_PORT
    
    uvicorn.run(
        "main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True,
        log_level="info"
    )
