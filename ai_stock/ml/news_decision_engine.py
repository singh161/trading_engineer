"""
News-Based Decision Engine
Uses news sentiment and analysis to make trading decisions
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)


class NewsDecisionEngine:
    """Make trading decisions based on news sentiment and analysis"""
    
    def __init__(self):
        # Decision thresholds
        self.buy_threshold = 0.3  # Positive sentiment threshold for BUY
        self.sell_threshold = -0.3  # Negative sentiment threshold for SELL
        self.strong_buy_threshold = 0.6  # Strong positive for STRONG BUY
        self.strong_sell_threshold = -0.6  # Strong negative for STRONG SELL
        
        # News recency weights (more recent = higher weight)
        self.recency_weights = {
            '1h': 1.0,   # Last 1 hour
            '6h': 0.9,   # Last 6 hours
            '24h': 0.7,  # Last 24 hours
            '3d': 0.5,   # Last 3 days
            '7d': 0.3,   # Last 7 days
            'older': 0.1  # Older than 7 days
        }
        
        # News volume thresholds
        self.min_news_count = 2  # Minimum news articles for decision
        self.high_volume_threshold = 10  # High volume threshold
    
    def analyze_news_for_decision(self, news_items: List[Dict], ticker: str) -> Dict:
        """
        Analyze news items for a specific ticker and make decision
        
        Args:
            news_items: List of news items with sentiment
            ticker: Stock ticker symbol
            
        Returns:
            Decision dictionary with recommendation and reasoning
        """
        # Filter news for this ticker
        ticker_news = [
            item for item in news_items 
            if item.get('ticker', '').upper() == ticker.upper() or 
               ticker.upper() in item.get('title', '').upper() or
               ticker.upper() in item.get('snippet', '').upper()
        ]
        
        if not ticker_news:
            return {
                'ticker': ticker,
                'decision': 'NO_DATA',
                'recommendation': 'HOLD',
                'confidence': 0.0,
                'reasoning': f'No news found for {ticker}',
                'news_count': 0,
                'sentiment_score': 0.0
            }
        
        # Calculate weighted sentiment score
        weighted_sentiment = self._calculate_weighted_sentiment(ticker_news)
        
        # Count news by sentiment
        positive_count = sum(1 for n in ticker_news if n.get('sentiment_score', 0) > 0.1)
        negative_count = sum(1 for n in ticker_news if n.get('sentiment_score', 0) < -0.1)
        neutral_count = len(ticker_news) - positive_count - negative_count
        
        # Calculate news volume score
        news_volume_score = min(1.0, len(ticker_news) / self.high_volume_threshold)
        
        # Calculate confidence based on news count and sentiment consistency
        confidence = self._calculate_confidence(ticker_news, weighted_sentiment)
        
        # Make decision
        decision = self._make_decision(weighted_sentiment, len(ticker_news), confidence)
        
        # Get reasoning
        reasoning = self._generate_reasoning(
            ticker, weighted_sentiment, len(ticker_news), 
            positive_count, negative_count, neutral_count, decision
        )
        
        # Get key news headlines
        key_headlines = self._get_key_headlines(ticker_news, decision)
        
        return {
            'ticker': ticker,
            'decision': decision['action'],
            'recommendation': decision['recommendation'],
            'confidence': round(confidence, 3),
            'sentiment_score': round(weighted_sentiment, 3),
            'news_count': len(ticker_news),
            'positive_news': positive_count,
            'negative_news': negative_count,
            'neutral_news': neutral_count,
            'news_volume_score': round(news_volume_score, 2),
            'reasoning': reasoning,
            'key_headlines': key_headlines,
            'timestamp': datetime.now().isoformat()
        }
    
    def _calculate_weighted_sentiment(self, news_items: List[Dict]) -> float:
        """Calculate time-weighted sentiment score"""
        if not news_items:
            return 0.0
        
        total_weighted_score = 0.0
        total_weight = 0.0
        
        for news in news_items:
            sentiment_score = news.get('sentiment_score', 0.0)
            published_at = news.get('published_at', '')
            
            # Get recency weight
            weight = self._get_recency_weight(published_at)
            
            # Also weight by confidence if available
            confidence = news.get('confidence', 0.5)
            adjusted_weight = weight * confidence
            
            total_weighted_score += sentiment_score * adjusted_weight
            total_weight += adjusted_weight
        
        if total_weight == 0:
            return 0.0
        
        return total_weighted_score / total_weight
    
    def _get_recency_weight(self, published_at: str) -> float:
        """Get weight based on news recency"""
        if not published_at:
            return self.recency_weights['older']
        
        try:
            # Parse datetime
            if isinstance(published_at, str):
                # Try different formats
                for fmt in ['%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d']:
                    try:
                        pub_date = datetime.strptime(published_at.split('+')[0].split('.')[0], fmt)
                        break
                    except:
                        continue
                else:
                    return self.recency_weights['older']
            else:
                pub_date = published_at
            
            now = datetime.now()
            if isinstance(pub_date, str):
                return self.recency_weights['older']
            
            age = now - pub_date
            
            if age < timedelta(hours=1):
                return self.recency_weights['1h']
            elif age < timedelta(hours=6):
                return self.recency_weights['6h']
            elif age < timedelta(days=1):
                return self.recency_weights['24h']
            elif age < timedelta(days=3):
                return self.recency_weights['3d']
            elif age < timedelta(days=7):
                return self.recency_weights['7d']
            else:
                return self.recency_weights['older']
        except:
            return self.recency_weights['older']
    
    def _calculate_confidence(self, news_items: List[Dict], sentiment_score: float) -> float:
        """Calculate confidence in decision based on news quality and consistency"""
        if not news_items:
            return 0.0
        
        confidence = 0.3  # Base confidence
        
        # More news = higher confidence
        news_count = len(news_items)
        if news_count >= self.high_volume_threshold:
            confidence += 0.3
        elif news_count >= self.min_news_count:
            confidence += 0.2
        
        # Sentiment consistency
        sentiment_scores = [n.get('sentiment_score', 0) for n in news_items]
        if sentiment_scores:
            sentiment_std = sum(abs(s - sentiment_score) for s in sentiment_scores) / len(sentiment_scores)
            if sentiment_std < 0.2:  # Low variance = consistent sentiment
                confidence += 0.2
            elif sentiment_std < 0.4:
                confidence += 0.1
        
        # Strong sentiment = higher confidence
        if abs(sentiment_score) > 0.6:
            confidence += 0.2
        elif abs(sentiment_score) > 0.3:
            confidence += 0.1
        
        return min(1.0, confidence)
    
    def _make_decision(self, sentiment_score: float, news_count: int, confidence: float) -> Dict:
        """Make trading decision based on sentiment and confidence"""
        # Need minimum news for decision
        if news_count < self.min_news_count:
            return {
                'action': 'INSUFFICIENT_DATA',
                'recommendation': 'HOLD',
                'strength': 'NEUTRAL'
            }
        
        # Strong buy
        if sentiment_score >= self.strong_buy_threshold and confidence >= 0.6:
            return {
                'action': 'STRONG_BUY',
                'recommendation': 'STRONG BUY',
                'strength': 'STRONG'
            }
        
        # Buy
        if sentiment_score >= self.buy_threshold:
            return {
                'action': 'BUY',
                'recommendation': 'BUY',
                'strength': 'MODERATE' if confidence >= 0.5 else 'WEAK'
            }
        
        # Strong sell
        if sentiment_score <= self.strong_sell_threshold and confidence >= 0.6:
            return {
                'action': 'STRONG_SELL',
                'recommendation': 'STRONG SELL',
                'strength': 'STRONG'
            }
        
        # Sell
        if sentiment_score <= self.sell_threshold:
            return {
                'action': 'SELL',
                'recommendation': 'SELL',
                'strength': 'MODERATE' if confidence >= 0.5 else 'WEAK'
            }
        
        # Hold (neutral sentiment)
        return {
            'action': 'HOLD',
            'recommendation': 'HOLD',
            'strength': 'NEUTRAL'
        }
    
    def _generate_reasoning(self, ticker: str, sentiment_score: float, news_count: int,
                           positive_count: int, negative_count: int, neutral_count: int,
                           decision: Dict) -> str:
        """Generate human-readable reasoning for decision"""
        reasoning_parts = []
        
        reasoning_parts.append(f"Based on {news_count} news articles for {ticker}:")
        
        if positive_count > 0:
            reasoning_parts.append(f"{positive_count} positive news")
        if negative_count > 0:
            reasoning_parts.append(f"{negative_count} negative news")
        if neutral_count > 0:
            reasoning_parts.append(f"{neutral_count} neutral news")
        
        sentiment_label = "very positive" if sentiment_score > 0.5 else \
                         "positive" if sentiment_score > 0.1 else \
                         "neutral" if abs(sentiment_score) < 0.1 else \
                         "negative" if sentiment_score > -0.5 else "very negative"
        
        reasoning_parts.append(f"Overall sentiment is {sentiment_label} ({sentiment_score:.2f})")
        
        if decision['strength'] == 'STRONG':
            reasoning_parts.append(f"Strong {decision['recommendation']} recommendation")
        elif decision['strength'] == 'MODERATE':
            reasoning_parts.append(f"Moderate {decision['recommendation']} recommendation")
        elif decision['strength'] == 'WEAK':
            reasoning_parts.append(f"Weak {decision['recommendation']} recommendation")
        
        return ". ".join(reasoning_parts) + "."
    
    def _get_key_headlines(self, news_items: List[Dict], decision: Dict, max_headlines: int = 3) -> List[str]:
        """Get key headlines that influenced the decision"""
        # Sort by sentiment relevance to decision
        if decision['action'] in ['BUY', 'STRONG_BUY']:
            # Get most positive news
            sorted_news = sorted(
                news_items, 
                key=lambda x: x.get('sentiment_score', 0), 
                reverse=True
            )
        elif decision['action'] in ['SELL', 'STRONG_SELL']:
            # Get most negative news
            sorted_news = sorted(
                news_items, 
                key=lambda x: x.get('sentiment_score', 0)
            )
        else:
            # Get most recent news
            sorted_news = sorted(
                news_items,
                key=lambda x: x.get('published_at', ''),
                reverse=True
            )
        
        headlines = []
        for news in sorted_news[:max_headlines]:
            title = news.get('title', '')
            if title:
                headlines.append(title)
        
        return headlines
    
    def make_batch_decisions(self, news_items: List[Dict], tickers: List[str]) -> Dict[str, Dict]:
        """Make decisions for multiple tickers"""
        decisions = {}
        
        for ticker in tickers:
            decision = self.analyze_news_for_decision(news_items, ticker)
            decisions[ticker] = decision
        
        return decisions
    
    def get_top_news_decisions(self, decisions: Dict[str, Dict], 
                               category: str = 'BUY', limit: int = 5) -> List[Dict]:
        """Get top decisions by category"""
        filtered = [
            decision for decision in decisions.values()
            if decision['recommendation'] == category
        ]
        
        # Sort by confidence and sentiment score
        filtered.sort(
            key=lambda x: (x['confidence'], abs(x['sentiment_score'])), 
            reverse=True
        )
        
        return filtered[:limit]


if __name__ == "__main__":
    # Test news decision engine
    engine = NewsDecisionEngine()
    
    # Sample news items
    test_news = [
        {
            'ticker': 'TCS',
            'title': 'TCS reports strong quarterly earnings',
            'sentiment_score': 0.7,
            'confidence': 0.8,
            'published_at': datetime.now().isoformat()
        },
        {
            'ticker': 'TCS',
            'title': 'TCS wins major contract',
            'sentiment_score': 0.6,
            'confidence': 0.7,
            'published_at': (datetime.now() - timedelta(hours=2)).isoformat()
        }
    ]
    
    decision = engine.analyze_news_for_decision(test_news, 'TCS')
    print(f"Decision: {decision['recommendation']}")
    print(f"Confidence: {decision['confidence']}")
    print(f"Reasoning: {decision['reasoning']}")
