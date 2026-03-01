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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.nseindia.com/",
        }
        self.session: Optional[aiohttp.ClientSession] = None
        self.cookies_fetched = False

    async def _ensure_session(self):
        """Ensure aiohttp session is initialized"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(headers=self.headers)
            self.cookies_fetched = False

    async def _fetch_cookies(self):
        """Fetch initial cookies from the main page"""
        await self._ensure_session()
        try:
            logger.info("Fetching fresh cookies from NSE...")
            async with self.session.get(self.base_url, timeout=10) as response:
                await response.text()
                self.cookies_fetched = True
        except Exception as e:
            logger.error(f"Failed to fetch cookies: {e}")

    async def get_live_indices(self) -> Optional[List[Dict[str, Any]]]:
        """Fetch all indices from NSE (Async)"""
        await self._ensure_session()
        if not self.cookies_fetched:
            await self._fetch_cookies()
            
        url = "https://www.nseindia.com/api/allIndices"
        try:
            async with self.session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('data', [])
                elif response.status == 401:
                    await self._fetch_cookies()
                    async with self.session.get(url, timeout=10) as response_retry:
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
            
        # URL encode the index name
        from urllib.parse import quote
        encoded_index = quote(index_name)
        url = f"https://www.nseindia.com/api/equity-stockIndices?index={encoded_index}"
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with self.session.get(url, timeout=15) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    elif response.status == 401:
                        await self._fetch_cookies()
                        async with self.session.get(url, timeout=15) as response_retry:
                            if response_retry.status == 200:
                                data = await response_retry.json()
                                return data
                    elif response.status == 429:
                        # Rate limited — wait and retry
                        wait_time = (attempt + 1) * 3  # 3s, 6s, 9s
                        logger.warning(f"Rate limited on {index_name}, waiting {wait_time}s (attempt {attempt+1}/{max_retries})")
                        await asyncio.sleep(wait_time)
                        await self._fetch_cookies()  # Refresh cookies
                        continue
                    else:
                        logger.warning(f"NSE returned {response.status} for {index_name}")
                        
            except asyncio.TimeoutError:
                logger.warning(f"Timeout fetching {index_name} (attempt {attempt+1}/{max_retries})")
                await asyncio.sleep(2)
            except Exception as e:
                logger.error(f"Error scraping index constituents {index_name}: {e}")
                await asyncio.sleep(2)
        
        logger.error(f"Failed to fetch {index_name} after {max_retries} retries")
        return None

    async def get_live_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get live quote for a symbol (Async)"""
        await self._ensure_session()
        
        if not self.cookies_fetched:
            await self._fetch_cookies()

        url = f"https://www.nseindia.com/api/quote-equity?symbol={symbol.upper()}"
        
        try:
            async with self.session.get(url, timeout=10) as response:
                # If forbidden, try refreshing cookies once
                if response.status == 401:
                    await self._fetch_cookies()
                    async with self.session.get(url, timeout=10) as response_retry:
                        return await self._parse_quote(response_retry, symbol)
                
                return await self._parse_quote(response, symbol)
                
        except Exception as e:
            logger.error(f"Error scraping NSE for {symbol}: {e}")
            return None

    async def _parse_quote(self, response, symbol: str) -> Optional[Dict[str, Any]]:
        if response.status == 200:
            data = await response.json()
            price_info = data.get('priceInfo', {})
            
            return {
                "symbol": symbol.upper(),
                "price": price_info.get('lastPrice'),
                "change": price_info.get('change'),
                "pChange": price_info.get('pChange'),
                "timestamp": datetime.now().isoformat()
            }
        return None

    async def close(self):
        """Close the session"""
        if self.session and not self.session.closed:
            await self.session.close()

# Global instance
nse_scraper = NSEScraper()
