"""
News Filtering and Quality Improvement
Filters duplicate news, scores relevance, improves quality
"""
import logging
from typing import List, Dict
from datetime import datetime
import hashlib
from collections import defaultdict

logger = logging.getLogger(__name__)


class NewsFilter:
    """Filter and improve news quality"""
    
    def __init__(self):
        self.seen_hashes = set()
    
    def calculate_relevance_score(self, news_item: Dict, ticker_list: List[str]) -> float:
        """Calculate relevance score (0-1) for news item"""
        score = 0.0
        title = news_item.get('title', '').upper()
        snippet = news_item.get('snippet', '').upper()
        text = f"{title} {snippet}"
        
        # Check for ticker mentions
        for ticker in ticker_list:
            if ticker.upper() in text:
                score += 0.4
                break
        
        # Check for stock market keywords
        keywords = ['STOCK', 'SHARE', 'EQUITY', 'NSE', 'BSE', 'MARKET', 
                   'TRADING', 'INVESTMENT', 'EARNINGS', 'QUARTERLY', 'REVENUE',
                   'PROFIT', 'GROWTH', 'BUY', 'SELL', 'RATING', 'TARGET']
        
        keyword_count = sum(1 for kw in keywords if kw in text)
        score += min(0.3, keyword_count * 0.05)
        
        # Check for financial terms
        financial_terms = ['CRORE', 'LAKH', 'RS', 'RUPEES', 'PERCENT', '%',
                          'BULLISH', 'BEARISH', 'VOLATILE', 'MOMENTUM']
        
        term_count = sum(1 for term in financial_terms if term in text)
        score += min(0.2, term_count * 0.03)
        
        # Recency bonus (more recent = higher score)
        published_at = news_item.get('published_at', '')
        if published_at:
            try:
                pub_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                hours_old = (datetime.now() - pub_date.replace(tzinfo=None)).total_seconds() / 3600
                if hours_old < 24:
                    score += 0.1
            except:
                pass
        
        return min(1.0, score)
    
    def generate_content_hash(self, news_item: Dict) -> str:
        """Generate hash for duplicate detection"""
        title = news_item.get('title', '').lower().strip()
        snippet = news_item.get('snippet', '').lower().strip()[:200]  # First 200 chars
        content = f"{title} {snippet}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def filter_duplicates(self, news_items: List[Dict]) -> List[Dict]:
        """Remove duplicate news items"""
        unique_items = []
        seen_hashes = set()
        
        for item in news_items:
            content_hash = self.generate_content_hash(item)
            if content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                unique_items.append(item)
            else:
                logger.debug(f"Filtered duplicate: {item.get('title', '')[:50]}")
        
        logger.info(f"Filtered {len(news_items) - len(unique_items)} duplicates from {len(news_items)} items")
        return unique_items
    
    def filter_by_relevance(self, news_items: List[Dict], ticker_list: List[str],
                           min_relevance: float = 0.2) -> List[Dict]:
        """Filter news by relevance score"""
        scored_items = []
        
        for item in news_items:
            relevance = self.calculate_relevance_score(item, ticker_list)
            item['relevance_score'] = relevance
            
            if relevance >= min_relevance:
                scored_items.append(item)
        
        # Sort by relevance
        scored_items.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
        
        logger.info(f"Filtered to {len(scored_items)} relevant items (min relevance: {min_relevance})")
        return scored_items
    
    def improve_news_quality(self, news_items: List[Dict], ticker_list: List[str]) -> List[Dict]:
        """Complete news quality improvement pipeline"""
        # Step 1: Remove duplicates
        unique_items = self.filter_duplicates(news_items)
        
        # Step 2: Filter by relevance
        relevant_items = self.filter_by_relevance(unique_items, ticker_list)
        
        # Step 3: Add quality metadata
        for item in relevant_items:
            item['quality_score'] = item.get('relevance_score', 0)
            item['filtered_at'] = datetime.now().isoformat()
        
        return relevant_items
