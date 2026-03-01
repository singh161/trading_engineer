"""
NSE Stock List Manager — No MySQL.
Fetches stock lists directly from NSE API.
Caches the result in memory to avoid repeated calls.
"""
import logging
import asyncio
from typing import List, Dict, Optional
from nse_scraper import NSEScraper
from config import NSE_INDICES

logger = logging.getLogger(__name__)

# Memory cache
_stocks_cache: List[Dict] = []
_cache_populated = False

# Use indices from config.py (single source of truth)
DEFAULT_INDICES = NSE_INDICES


class DatabaseManager:
    """
    Replaces MySQL — now fetches stock list from NSE API.
    Provides the same interface so rest of the code doesn't break.
    """

    @classmethod
    def initialize_pool(cls, pool_size: int = 5):
        """No-op: previously initialized MySQL pool. Not needed anymore."""
        logger.info("✅ No database pool needed — using NSE API directly.")

    @classmethod
    def get_connection(cls):
        """No-op: previously returned a MySQL connection."""
        return None

    @classmethod
    def test_connection(cls) -> bool:
        """Always True — no DB to test."""
        return True

    @classmethod
    def get_all_stocks(cls) -> List[Dict]:
        """
        Return cached stock list.
        If empty, trigger a one-time async fill synchronously using asyncio.
        """
        global _stocks_cache, _cache_populated
        if _stocks_cache:
            return _stocks_cache

        logger.info("🔄 Stock cache empty. Fetching from NSE synchronously...")

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # We're inside an async context — a task is needed, return empty for now
                logger.warning("⚠️  Called from async context before preload. Return empty list safely.")
                return []
            else:
                stocks = loop.run_until_complete(cls.fetch_stocks_from_nse())
                return stocks
        except Exception as e:
            logger.error(f"Error fetching stock list from NSE: {e}")
            return []

    @classmethod
    async def fetch_stocks_from_nse(cls, indices: List[str] = None) -> List[Dict]:
        """
        Fetch stock list from NSE API using index constituents.
        Returns list of dicts with 'symbol', 'name', 'industry', 'sector'.
        """
        global _stocks_cache, _cache_populated
        
        if _cache_populated and _stocks_cache:
            return _stocks_cache

        if indices is None:
            indices = DEFAULT_INDICES

        scraper = NSEScraper()
        seen_symbols = set()
        stocks = []
        failed_indices = []

        for index_name in indices:
            try:
                logger.info(f"📡 Fetching constituents of {index_name} from NSE...")
                data = await scraper.get_index_constituents(index_name)

                if not data or 'data' not in data:
                    logger.warning(f"⚠️  No data for index {index_name}")
                    failed_indices.append(index_name)
                    continue

                for row in data['data']:
                    symbol = row.get('symbol', '').strip().upper()
                    if not symbol or symbol in seen_symbols:
                        continue
                    seen_symbols.add(symbol)

                    stocks.append({
                        "symbol": symbol,
                        "name": row.get('meta', {}).get('companyName', symbol),
                        "industry": row.get('meta', {}).get('industry', ''),
                        "sector": row.get('meta', {}).get('sector', ''),
                    })
                logger.info(f"✅ Got {len(data['data'])} stocks from {index_name}")
            except Exception as e:
                logger.error(f"Error fetching {index_name}: {e}")
                failed_indices.append(index_name)
            
            # Delay between index fetches to avoid rate limiting
            await asyncio.sleep(2)

        # Retry failed indices once after a longer delay
        if failed_indices:
            logger.info(f"🔄 Retrying {len(failed_indices)} failed indices after 5s delay...")
            await asyncio.sleep(5)
            for index_name in failed_indices:
                try:
                    logger.info(f"🔄 Retry: Fetching {index_name}...")
                    data = await scraper.get_index_constituents(index_name)
                    if data and 'data' in data:
                        for row in data['data']:
                            symbol = row.get('symbol', '').strip().upper()
                            if not symbol or symbol in seen_symbols:
                                continue
                            seen_symbols.add(symbol)
                            stocks.append({
                                "symbol": symbol,
                                "name": row.get('meta', {}).get('companyName', symbol),
                                "industry": row.get('meta', {}).get('industry', ''),
                                "sector": row.get('meta', {}).get('sector', ''),
                            })
                        logger.info(f"✅ Retry success: Got stocks from {index_name}")
                except Exception as e:
                    logger.error(f"❌ Retry failed for {index_name}: {e}")
                await asyncio.sleep(3)

        await scraper.close()

        if stocks:
            _stocks_cache = stocks
            _cache_populated = True
            logger.info(f"✅ Total {len(stocks)} unique stocks loaded from NSE")
        else:
            logger.error("❌ Failed to fetch stocks from NSE. List is empty.")

        return stocks

    @classmethod
    def get_stock_by_symbol(cls, symbol: str) -> Optional[Dict]:
        """Look up a stock from the in-memory cache by symbol."""
        for stock in _stocks_cache:
            if stock.get('symbol', '').upper() == symbol.upper():
                return stock
        return None
