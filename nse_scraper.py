import aiohttp
import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class NSEScraper:
    """
    Async Scraper for NSE India website to get real-time stock data.
    Uses cookies and headers to mimic a real browser to avoid being blocked.
    """
    
    def __init__(self):
        self.base_url = "https://www.nseindia.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
            "Referer": "https://www.nseindia.com/",
        }
        self.session: Optional[aiohttp.ClientSession] = None
        self.cookies_fetched = False
        self._lock = asyncio.Lock()
        self.last_cookie_time = None

    async def _ensure_session(self):
        """Ensure aiohttp session is initialized with correct headers"""
        if self.session is None or self.session.closed:
            connector = aiohttp.TCPConnector(limit=10, ttl_dns_cache=300)
            self.session = aiohttp.ClientSession(headers=self.headers, connector=connector)
            self.cookies_fetched = False

    async def _fetch_cookies(self, force=False):
        """Fetch initial cookies from the main page with locking"""
        async with self._lock:
            now = datetime.now()
            if not force and self.cookies_fetched and self.last_cookie_time and (now - self.last_cookie_time).seconds < 300:
                return

            await self._ensure_session()
            try:
                logger.info("Refreshing NSE cookies...")
                async with self.session.get(self.base_url, timeout=12) as response:
                    await response.text()
                    async with self.session.get(f"{self.base_url}/api/marketStatus", timeout=8) as status_res:
                        await status_res.text()
                    
                self.cookies_fetched = True
                self.last_cookie_time = now
                logger.info("NSE Cookies refreshed successfully")
            except Exception as e:
                logger.error(f"Failed to fetch NSE cookies: {e}")
                self.cookies_fetched = False

    async def get_live_indices(self) -> Optional[List[Dict[str, Any]]]:
        """Fetch all indices from NSE (Async)"""
        await self._ensure_session()
        if not self.cookies_fetched:
            await self._fetch_cookies()
            
        url = "https://www.nseindia.com/api/allIndices"
        try:
            async with self.session.get(url, timeout=12) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('data', [])
                elif response.status in [401, 403]:
                    await self._fetch_cookies(force=True)
                    async with self.session.get(url, timeout=12) as response_retry:
                        if response_retry.status == 200:
                            data = await response_retry.json()
                            return data.get('data', [])
            return None
        except Exception as e:
            logger.error(f"Error scraping indices: {e}")
            return None

    async def get_index_constituents(self, index_name: str) -> Optional[Dict[str, Any]]:
        """Fetch index constituents from NSE (Async) with retry logic"""
        await self._ensure_session()
        if not self.cookies_fetched:
            await self._fetch_cookies()
            
        from urllib.parse import quote
        encoded_index = quote(index_name)
        url = f"https://www.nseindia.com/api/equity-stockIndices?index={encoded_index}"
        
        max_retries = 2
        for attempt in range(max_retries):
            try:
                async with self.session.get(url, timeout=15) as response:
                    if response.status == 200:
                        return await response.json()
                    elif response.status in [401, 403]:
                        await self._fetch_cookies(force=True)
                        await asyncio.sleep(1)
                        continue
            except Exception as e:
                logger.warning(f"Attempt {attempt+1} failed for {index_name}")
                await asyncio.sleep(1)
        return None

    async def get_live_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get live quote for a symbol (Async)"""
        await self._ensure_session()
        if not self.cookies_fetched:
            await self._fetch_cookies()

        url = f"https://www.nseindia.com/api/quote-equity?symbol={symbol.upper()}"
        try:
            async with self.session.get(url, timeout=12) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._extract_price_info(data, symbol)
                elif response.status in [401, 403]:
                    await self._fetch_cookies(force=True)
                    async with self.session.get(url, timeout=12) as retry_res:
                        if retry_res.status == 200:
                            data = await retry_res.json()
                            return self._extract_price_info(data, symbol)
            return None
        except Exception as e:
            logger.error(f"Error scraping NSE for {symbol}: {e}")
            return None

    def _extract_price_info(self, data, symbol):
        price_info = data.get('priceInfo', {})
        return {
            "symbol": symbol.upper(),
            "price": price_info.get('lastPrice'),
            "change": price_info.get('change'),
            "pChange": price_info.get('pChange'),
            "timestamp": datetime.now().isoformat()
        }

    async def get_derivative_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get live derivative (Option/Future) quote for a symbol (Async)"""
        await self._ensure_session()
        if not self.cookies_fetched:
            await self._fetch_cookies()

        url = f"https://www.nseindia.com/api/quote-derivative?symbol={symbol.upper()}"
        try:
            async with self.session.get(url, timeout=12) as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                elif response.status in [401, 403]:
                    await self._fetch_cookies(force=True)
                    async with self.session.get(url, timeout=12) as retry_res:
                        if retry_res.status == 200:
                            return await retry_res.json()
            return None
        except Exception as e:
            logger.error(f"Error scraping NSE derivatives for {symbol}: {e}")
            return None

    def _extract_derivative_price_info(self, data: Dict, target_identifier: str) -> Optional[Dict]:
        """Extract price for a specific option/future from derivative quote data"""
        try:
            stocks = data.get('stocks', [])
            for s in stocks:
                # Identifier matches the specific option contract
                if s.get('metadata', {}).get('identifier') == target_identifier:
                    market_dept = s.get('marketDeptOrderBook', {})
                    trade_info = s.get('metadata', {})
                    return {
                        "symbol": target_identifier,
                        "price": market_dept.get('tradeInfo', {}).get('lastPrice'),
                        "change": market_dept.get('tradeInfo', {}).get('change'),
                        "pChange": market_dept.get('tradeInfo', {}).get('pChange'),
                        "timestamp": datetime.now().isoformat()
                    }
            return None
        except Exception as e:
            logger.error(f"Error extracting derivative info: {e}")
            return None

    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()

# Global instance
nse_scraper = NSEScraper()
