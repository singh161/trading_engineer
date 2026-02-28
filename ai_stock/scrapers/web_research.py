"""
Module 1: Web Research
Uses FREE APIs: NewsAPI, RSS Feeds, and optional paid APIs (SerpAPI/Bing)
"""
import os
import json
import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
from pathlib import Path
import feedparser

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WebResearchEngine:
    """Web research engine for collecting stock news - FREE APIs prioritized"""
    
    def __init__(self):
        # FREE APIs (prioritized)
        self.newsapi_key = os.getenv("NEWSAPI_KEY")  # FREE tier available
        self.use_rss_feeds = True  # Always free
        
        # Optional paid APIs (fallback)
        self.serpapi_key = os.getenv("SERPAPI_KEY")
        self.bing_api_key = os.getenv("BING_SEARCH_API_KEY")
        
        self.data_dir = Path(__file__).parent.parent / "data"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.raw_data_file = self.data_dir / "news_raw.json"
        
        # Search queries for daily collection - India focused
        self.search_queries = [
            "Best stocks to buy in India today NSE",
            "NSE BSE company earnings news India",
            "Stock market breaking news India NSE",
            "Indian stock market news today",
            "NSE listed companies news"
        ]
        
        # FREE RSS Feeds for Indian stock market news
        self.rss_feeds = [
            "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",  # ET Markets
            "https://www.moneycontrol.com/rss/business.xml",  # Moneycontrol Business
            "https://www.livemint.com/rss/markets",  # Livemint Markets
            "https://feeds.feedburner.com/ndtvprofit-latest",  # NDTV Profit
        ]
    
    async def search_newsapi(self, query: str, num_results: int = 10) -> List[Dict]:
        """Search using NewsAPI (FREE tier available)"""
        if not self.newsapi_key:
            logger.warning("NEWSAPI_KEY not found. Get free key from https://newsapi.org/register")
            return []
        
        # NewsAPI free tier: 100 requests/day
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": query,
            "apiKey": self.newsapi_key,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": min(num_results, 100),  # Free tier max
            "from": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
            "domains": "economictimes.indiatimes.com,moneycontrol.com,livemint.com,ndtv.com"  # India-focused sources
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        results = []
                        
                        articles = data.get("articles", [])
                        for article in articles:
                            results.append({
                                "title": article.get("title", ""),
                                "link": article.get("url", ""),
                                "snippet": article.get("description", ""),
                                "source": "newsapi",
                                "query": query,
                                "published_at": article.get("publishedAt", ""),
                                "timestamp": datetime.now().isoformat()
                            })
                        
                        logger.info(f"NewsAPI: Found {len(results)} results for '{query}'")
                        return results
                    elif response.status == 429:
                        logger.warning("NewsAPI rate limit reached (free tier: 100 requests/day)")
                        return []
                    else:
                        error_text = await response.text()
                        logger.error(f"NewsAPI error: {response.status} - {error_text}")
                        return []
        except Exception as e:
            logger.error(f"NewsAPI search error: {e}")
            return []
    
    async def search_rss_feeds(self, query: str = None) -> List[Dict]:
        """Search using FREE RSS feeds"""
        all_results = []
        
        for feed_url in self.rss_feeds:
            try:
                # Parse RSS feed
                feed = feedparser.parse(feed_url)
                
                for entry in feed.entries[:10]:  # Limit per feed
                    # Filter by query if provided
                    if query:
                        title_lower = entry.get("title", "").lower()
                        summary_lower = entry.get("summary", "").lower()
                        query_lower = query.lower()
                        
                        if query_lower not in title_lower and query_lower not in summary_lower:
                            continue
                    
                    all_results.append({
                        "title": entry.get("title", ""),
                        "link": entry.get("link", ""),
                        "snippet": entry.get("summary", "")[:200],  # First 200 chars
                        "source": "rss",
                        "query": query or "general",
                        "published_at": entry.get("published", ""),
                        "timestamp": datetime.now().isoformat()
                    })
                
                logger.info(f"RSS Feed: Found {len(feed.entries)} items from {feed_url}")
                
            except Exception as e:
                logger.error(f"Error parsing RSS feed {feed_url}: {e}")
                continue
        
        logger.info(f"RSS: Total {len(all_results)} results collected")
        return all_results
    
    async def search_serpapi(self, query: str, num_results: int = 10) -> List[Dict]:
        """Search using SerpAPI"""
        if not self.serpapi_key:
            logger.warning("SERPAPI_KEY not found in environment")
            return []
        
        url = "https://serpapi.com/search"
        params = {
            "q": query,
            "api_key": self.serpapi_key,
            "engine": "google",
            "num": num_results,
            "gl": "in",  # India
            "hl": "en"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        results = []
                        
                        # Extract organic results
                        organic_results = data.get("organic_results", [])
                        for result in organic_results:
                            results.append({
                                "title": result.get("title", ""),
                                "link": result.get("link", ""),
                                "snippet": result.get("snippet", ""),
                                "source": "serpapi",
                                "query": query,
                                "timestamp": datetime.now().isoformat()
                            })
                        
                        logger.info(f"SerpAPI: Found {len(results)} results for '{query}'")
                        return results
                    else:
                        logger.error(f"SerpAPI error: {response.status}")
                        return []
        except Exception as e:
            logger.error(f"SerpAPI search error: {e}")
            return []
    
    async def search_bing(self, query: str, num_results: int = 10) -> List[Dict]:
        """Search using Bing Search API"""
        if not self.bing_api_key:
            logger.warning("BING_SEARCH_API_KEY not found in environment")
            return []
        
        url = "https://api.bing.microsoft.com/v7.0/search"
        headers = {
            "Ocp-Apim-Subscription-Key": self.bing_api_key
        }
        params = {
            "q": query,
            "count": num_results,
            "mkt": "en-IN",  # India market
            "safeSearch": "Moderate"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        results = []
                        
                        # Extract web pages
                        web_pages = data.get("webPages", {}).get("value", [])
                        for page in web_pages:
                            results.append({
                                "title": page.get("name", ""),
                                "link": page.get("url", ""),
                                "snippet": page.get("snippet", ""),
                                "source": "bing",
                                "query": query,
                                "timestamp": datetime.now().isoformat()
                            })
                        
                        logger.info(f"Bing: Found {len(results)} results for '{query}'")
                        return results
                    else:
                        logger.error(f"Bing API error: {response.status}")
                        return []
        except Exception as e:
            logger.error(f"Bing search error: {e}")
            return []
    
    async def collect_daily_news(self) -> List[Dict]:
        """Collect daily news using FREE APIs first, then paid fallbacks"""
        all_results = []
        
        # Step 1: Use FREE RSS feeds (always available)
        logger.info("Collecting news from FREE RSS feeds...")
        rss_results = await self.search_rss_feeds()
        all_results.extend(rss_results)
        logger.info(f"RSS feeds: {len(rss_results)} results")
        
        # Step 2: Use FREE NewsAPI for specific queries
        if self.newsapi_key:
            logger.info("Collecting news from FREE NewsAPI...")
            for query in self.search_queries:
                newsapi_results = await self.search_newsapi(query)
                all_results.extend(newsapi_results)
                await asyncio.sleep(1)  # Rate limiting
        else:
            logger.info("NewsAPI key not found. Using RSS feeds only.")
        
        # Step 3: Fallback to paid APIs if available (optional)
        if not all_results:
            logger.info("No free API results, trying paid APIs as fallback...")
            for query in self.search_queries:
                results = await self.search_serpapi(query)
                if not results:
                    results = await self.search_bing(query)
                all_results.extend(results)
                await asyncio.sleep(1)
        
        # Remove duplicates based on title
        seen_titles = set()
        unique_results = []
        for result in all_results:
            title = result.get('title', '').lower().strip()
            if title and title not in seen_titles:
                seen_titles.add(title)
                unique_results.append(result)
        
        logger.info(f"Total unique results: {len(unique_results)}")
        return unique_results
    
    def save_raw_results(self, results: List[Dict]):
        """Save raw search results to JSON file"""
        try:
            # Load existing data if file exists
            existing_data = []
            if self.raw_data_file.exists():
                with open(self.raw_data_file, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
            
            # Add new results with date key
            date_key = datetime.now().strftime("%Y-%m-%d")
            existing_data.append({
                "date": date_key,
                "timestamp": datetime.now().isoformat(),
                "results": results,
                "total_results": len(results)
            })
            
            # Save updated data
            with open(self.raw_data_file, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(results)} raw results to {self.raw_data_file}")
        except Exception as e:
            logger.error(f"Error saving raw results: {e}")
    
    async def run_daily_collection(self):
        """Run daily news collection"""
        logger.info("Starting daily web research collection...")
        results = await self.collect_daily_news()
        self.save_raw_results(results)
        logger.info(f"Daily collection complete: {len(results)} results")
        return results


if __name__ == "__main__":
    # Test the web research engine
    async def test():
        engine = WebResearchEngine()
        results = await engine.run_daily_collection()
        print(f"Collected {len(results)} news items")
    
    asyncio.run(test())
