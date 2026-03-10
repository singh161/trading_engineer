"""
Stock Data Fetcher - Downloads historical OHLCV data
Supports yfinance and NSE data sources with fallback chain
"""
import yfinance as yf
import pandas as pd
from typing import Optional, Dict, List, Any
import logging
from datetime import datetime, timedelta, date, time
import pytz
import asyncio
import json
import os

from config import NSE_SYMBOL_SUFFIX, TIMEFRAMES
from nse_scraper import nse_scraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import nsepy
try:
    from nsepy import get_history
    NSEPY_AVAILABLE = True
except ImportError:
    NSEPY_AVAILABLE = False
    logger.warning("nsepy not available. Fallback may fail.")

# Setup Redis Client
try:
    import redis.asyncio as aioredis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    REDIS_AVAILABLE = True
except ImportError:
    redis_client = None
    REDIS_AVAILABLE = False
    logger.warning("redis not available. Using in-memory fallback cache.")

# In-memory dictionary fallback cache
_fallback_cache = {}

async def set_cache(key: str, value: str, ttl_seconds: int):
    if REDIS_AVAILABLE and redis_client:
        try:
            await redis_client.set(key, value, ex=ttl_seconds)
            return
        except Exception as e:
            logger.warning(f"Redis set failed: {e}")
    _fallback_cache[key] = {
        "value": value,
        "expires_at": datetime.now() + timedelta(seconds=ttl_seconds)
    }

async def get_cache(key: str) -> Optional[str]:
    if REDIS_AVAILABLE and redis_client:
        try:
            return await redis_client.get(key)
        except Exception as e:
            logger.warning(f"Redis get failed: {e}")
    if key in _fallback_cache:
        item = _fallback_cache[key]
        if datetime.now() < item["expires_at"]:
            return item["value"]
        else:
            del _fallback_cache[key]
    return None

def is_market_open() -> bool:
    """Check if Indian market is open (IST 9:15 AM - 3:30 PM, Mon-Fri)"""
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    if now.weekday() >= 5:  # 5=Saturday, 6=Sunday
        return False
    market_start = time(9, 15)
    market_end = time(15, 30)
    return market_start <= now.time() <= market_end

class StockDataFetcher:
    """Fetches historical stock data from various sources"""
    
    def __init__(self, source: str = "nse"):
        self.source = source
        
    def _validate_price(self, price_primary: Optional[float], price_fallback: Optional[float], symbol: str) -> Optional[float]:
        """Cross-validate prices between sources. If difference > 0.5%, prefer primary."""
        if not price_primary: return price_fallback
        if not price_fallback: return price_primary
        
        diff_pct = abs(price_primary - price_fallback) / price_primary * 100
        if diff_pct > 0.5:
            logger.warning(f"[{symbol}] Price difference > 0.5% ({diff_pct:.2f}%). Primary: {price_primary}, Fallback: {price_fallback}. Preferring primary (NSE).")
            return price_primary
        return price_primary # Generally prefer primary

    async def fetch_data(
        self,
        symbol: str,
        mode: str = "swing",
        period: Optional[str] = None,
        interval: Optional[str] = None
    ) -> Optional[pd.DataFrame]:
        """
        Fetch historical OHLCV data for a symbol
        1. Redis Cache
        2. NSE Direct (Live) + NSEPY (History)
        3. YFinance (Fallback)
        """
        try:
            # Get timeframe configuration
            if mode not in TIMEFRAMES:
                logger.warning(f"Invalid mode {mode}, defaulting to swing")
                mode = "swing"
            
            timeframe = TIMEFRAMES[mode]
            interval = interval or timeframe["interval"]
            period = period or timeframe["period"]
            
            # Redis cache fetch
            cache_key = f"ohlcv:{symbol}:{mode}:{interval}:{period}"
            cached_data = await get_cache(cache_key)
            if cached_data:
                logger.info(f"Loaded {symbol} data from cache for mode {mode}")
                try:
                    df = pd.read_json(cached_data, orient='split')
                    if df.index.tz is not None:
                        df.index = df.index.tz_localize(None)
                    return df
                except Exception as e:
                    logger.error(f"Error parsing cache for {symbol}: {e}")
                    
            clean_symbol = symbol.replace(NSE_SYMBOL_SUFFIX, "").replace(".BO", "")
            yfinance_symbol = f"{clean_symbol}{NSE_SYMBOL_SUFFIX}"
            
            df = None
            
            # Try NSEPY + NSE DIRECT API
            if NSEPY_AVAILABLE and (interval == '1d' or interval == '1wk'):
                try:
                    logger.info(f"Attempting nsepy fetch for {clean_symbol}")
                    end_date = date.today()
                    days = 30
                    if period and 'mo' in period: days = int(period.replace('mo', '')) * 30
                    elif period and 'y' in period: days = int(period.replace('y', '')) * 365
                    elif period and 'd' in period: days = int(period.replace('d', ''))
                    
                    start_date = end_date - timedelta(days=days)
                    nse_df = get_history(symbol=clean_symbol, start=start_date, end=end_date)
                    if nse_df is not None and not nse_df.empty:
                        nse_df = nse_df.rename(columns={
                            "Open": "open", "High": "high", "Low": "low", "Close": "close", "Volume": "volume"
                        })
                        if 'open' in nse_df.columns:
                            df = nse_df[['open', 'high', 'low', 'close', 'volume']]
                            logger.info(f"Successfully fetched via nsepy for {clean_symbol}")
                except Exception as e:
                    logger.warning(f"nsepy fetch failed for {clean_symbol}: {e}")

            # YFinance fallback if NSEPY failed or returning intraday
            if df is None or df.empty:
                logger.info(f"Attempting yfinance fallback for {yfinance_symbol}: {interval}, {period}")
                ticker = yf.Ticker(yfinance_symbol)
                yf_df = ticker.history(period=period, interval=interval)
                
                if not yf_df.empty:
                    yf_df.columns = [col.lower().replace(' ', '_') for col in yf_df.columns]
                    required_cols = ['open', 'high', 'low', 'close', 'volume']
                    if all(col in yf_df.columns for col in required_cols):
                        df = yf_df[required_cols]
                        
                        # Validate with NSE Direct API
                        live_quote = await nse_scraper.get_live_quote(clean_symbol)
                        if live_quote and live_quote.get('price'):
                            nse_price = float(live_quote['price'])
                            last_close = df['close'].iloc[-1]
                            validated_price = self._validate_price(nse_price, last_close, clean_symbol)
                            if validated_price == nse_price and is_market_open():
                                logger.info(f"Overwriting last yfinance close ({last_close}) with NSE live price ({nse_price}).")
                                df.iloc[-1, df.columns.get_loc('close')] = validated_price
                                
            if df is None or df.empty:
                logger.warning(f"No data returned for {symbol} after all fallbacks")
                return None
            
            df = df.sort_index()
            if df.index.tz is not None:
                df.index = df.index.tz_localize(None)
                
            # Set TTL based on timeframe
            ttl = 300 # Default 5 mins
            if interval.endswith('m'): ttl = 30 # Intraday: 30 seconds
            elif interval.endswith('d'): ttl = 300 # Daily: 5 minutes
            elif interval.endswith('wk'): ttl = 3600 # Weekly: 1 hour
            
            await set_cache(cache_key, df.to_json(orient='split', date_format='iso'), ttl)
                
            return df
                
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {e}")
            return None
    
    async def fetch_batch_data(
        self,
        symbols: List[str],
        mode: str = "swing",
        period: Optional[str] = None,
        interval: Optional[str] = None
    ) -> Dict[str, pd.DataFrame]:
        """
        Fetch historical OHLCV data for multiple symbols in one go using asyncio & multiple fetch_data calls
        """
        try:
            if not symbols:
                return {}
            
            logger.info(f"Batch fetching {len(symbols)} symbols. Using async individual fetch_data mapped internally.")
            results = {}
            # Run all fetch_data concurrently
            tasks = [self.fetch_data(sym, mode, period, interval) for sym in symbols]
            fetched = await asyncio.gather(*tasks, return_exceptions=True)
            
            for i, res in enumerate(fetched):
                if isinstance(res, pd.DataFrame) and not res.empty:
                    results[symbols[i]] = res
                    
            return results
            
        except Exception as e:
            logger.error(f"Error in batch fetching: {e}")
            return {}

    async def get_current_price(self, symbol: str) -> Optional[float]:
        """Get current/latest price using official NSE API (prioritized) with fallbacks"""
        try:
            symbol = symbol.upper()
            clean_symbol = symbol.replace(NSE_SYMBOL_SUFFIX, "").replace(".BO", "")
            
            # Layer 1: Official NSE Scraper (Prioritized as per user request)
            price = None
            
            # Detect if it's likely an option (e.g. NIFTY24MAR22000CE)
            # Heuristic: Symbols longer than 12 chars often are option identifiers
            if len(clean_symbol) > 12:
                # Extract base symbol from option identifier (NIFTY, BANKNIFTY, RELIANCE, etc.)
                base_symbol = ""
                if "NIFTY" in clean_symbol:
                    base_symbol = "NIFTY" if "BANK" not in clean_symbol and "FIN" not in clean_symbol else \
                                  "BANKNIFTY" if "BANK" in clean_symbol else "FINNIFTY"
                else:
                    # For stocks, the first few letters are the symbol
                    # This is a bit tricky, but usually the first characters until the first digit
                    import re
                    match = re.search(r'([A-Z]+)\d+', clean_symbol)
                    if match:
                        base_symbol = match.group(1)
                
                if base_symbol:
                    logger.info(f"Detected OPTION symbol. Fetching derivative quote for base: {base_symbol}")
                    derivative_data = await nse_scraper.get_derivative_quote(base_symbol)
                    if derivative_data:
                        info = nse_scraper._extract_derivative_price_info(derivative_data, clean_symbol)
                        if info and info.get('price'):
                            price = float(info['price'])
                            logger.info(f"NSE REAL-TIME OPTION PRICE: {symbol} -> ₹{price}")
            else:
                # Standard Equity
                quote = await nse_scraper.get_live_quote(clean_symbol)
                if quote and quote.get('price'):
                    price = float(quote['price'])
                    logger.info(f"NSE REAL-TIME EQUITY PRICE: {symbol} -> ₹{price}")

            # Layer 2: yfinance Fallback (Only if NSE Scraper fails)
            if price is None:
                logger.warning(f"NSE Scraper failed for {symbol}. Falling back to yfinance.")
                yfinance_symbol = symbol if ".NS" in symbol or ".BO" in symbol else f"{clean_symbol}{NSE_SYMBOL_SUFFIX}"
                ticker = yf.Ticker(yfinance_symbol)
                df = ticker.history(period="1d", interval="1m")
                if not df.empty:
                    price = float(df['Close'].iloc[-1])
                    logger.info(f"Fallback yfinance price for {symbol}: ₹{price}")
                else:
                    info = ticker.info
                    price = info.get('regularMarketPrice') or info.get('currentPrice')
            
            return price
        except Exception as e:
            logger.error(f"Error fetching real-time price for {symbol} from NSE: {e}")
            return None
    
    async def get_live_indices_data(self) -> Optional[List[Dict[str, Any]]]:
        """Fetch real-time index data using scraper"""
        try:
            indices = await nse_scraper.get_live_indices()
            if indices:
                processed_indices = []
                for idx in indices:
                    processed_indices.append({
                        "symbol": idx.get('index'),
                        "price": idx.get('last'),
                        "change": idx.get('variation'),
                        "pChange": idx.get('percentChange'),
                        "open": idx.get('open'),
                        "high": idx.get('high'),
                        "low": idx.get('low'),
                        "timestamp": datetime.now().isoformat()
                    })
                return processed_indices
            return None
        except Exception as e:
            logger.error(f"Error fetching live indices: {e}")
            return None

    def get_index_data(self, index_symbol: str) -> Optional[pd.DataFrame]:
        """
        Fetch index data (NIFTY, BANKNIFTY) - Synchronous wrapper
        """
        try:
            ticker = yf.Ticker(index_symbol)
            df = ticker.history(period="1mo", interval="1d")
            
            if df.empty:
                return None
            
            df.columns = [col.lower().replace(' ', '_') for col in df.columns]
            df = df.sort_index()
            if df.index.tz is not None:
                df.index = df.index.tz_localize(None)
            return df
        except Exception as e:
            logger.error(f"Error fetching index data for {index_symbol}: {e}")
            return None
