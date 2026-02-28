"""
Module 5: Smart Ranking System
Combines technical, sentiment, fundamental, and momentum scores
"""
import logging
from typing import Dict, List, Tuple
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RankingEngine:
    """Smart ranking engine for stock recommendations"""
    
    def __init__(self, weights: Dict[str, float] = None):
        # Weight configuration
        self.weights = weights or {
            "technical": 0.35,
            "sentiment": 0.25,
            "fundamental": 0.25,
            "momentum": 0.15
        }
    
    def calculate_technical_score(self, analysis: Dict) -> float:
        """Calculate technical score from signal analysis"""
        buy_count = analysis.get('buy_count', 0)
        sell_count = analysis.get('sell_count', 0)
        total_signals = buy_count + sell_count
        
        if total_signals == 0:
            return 50.0  # Neutral score
        
        # Score based on signal ratio
        buy_ratio = buy_count / total_signals
        
        # Map to 0-100 scale
        # 100 = all buy signals, 0 = all sell signals, 50 = neutral
        technical_score = buy_ratio * 100
        
        # Adjust based on final verdict
        verdict = analysis.get('final_verdict', 'NEUTRAL')
        if verdict == 'STRONG BUY':
            technical_score = min(100, technical_score + 20)
        elif verdict == 'BUY':
            technical_score = min(100, technical_score + 10)
        elif verdict == 'STRONG SELL':
            technical_score = max(0, technical_score - 20)
        elif verdict == 'SELL':
            technical_score = max(0, technical_score - 10)
        
        return max(0, min(100, technical_score))
    
    def calculate_sentiment_score(self, sentiment_data: Dict) -> float:
        """Calculate sentiment score (0-100)"""
        sentiment_score = sentiment_data.get('avg_sentiment_score', 0.0)
        confidence = sentiment_data.get('avg_confidence', 0.0)
        total_news = sentiment_data.get('total_news', 0)
        
        # Normalize sentiment score from -1 to 1 range to 0-100
        normalized_score = (sentiment_score + 1) * 50
        
        # Adjust by confidence and news volume
        if total_news > 0:
            # More news = more reliable
            news_factor = min(1.0, total_news / 10.0)
            normalized_score = normalized_score * (0.5 + 0.5 * confidence * news_factor)
        
        return max(0, min(100, normalized_score))
    
    def calculate_fundamental_score(self, fundamental_data: Dict) -> float:
        """Get fundamental score (already 0-100)"""
        return fundamental_data.get('fundamental_score', 50.0)
    
    def calculate_momentum_score(self, analysis: Dict) -> float:
        """Calculate momentum score (0-100)"""
        trend = analysis.get('trend', 'NEUTRAL')
        rsi = analysis.get('rsi', 50.0)
        macd_hist = analysis.get('macd_hist', 0.0)
        volume_signal = analysis.get('volume_signal', 'NEUTRAL')
        
        momentum_score = 50.0  # Base neutral
        
        # Trend contribution
        if trend == 'UP':
            momentum_score += 20
        elif trend == 'DOWN':
            momentum_score -= 20
        
        # RSI contribution (momentum when away from 50)
        rsi_momentum = abs(rsi - 50) / 50 * 20  # Max 20 points
        if rsi > 50:
            momentum_score += rsi_momentum
        else:
            momentum_score -= rsi_momentum
        
        # MACD contribution
        if macd_hist > 0:
            momentum_score += min(15, macd_hist * 5)
        else:
            momentum_score -= min(15, abs(macd_hist) * 5)
        
        # Volume confirmation
        if volume_signal == 'BUY':
            momentum_score += 10
        elif volume_signal == 'SELL':
            momentum_score -= 10
            
        # Advanced momentum (ADX-like proxy using range expansion)
        # If price range is expanding, momentum is increasing
        price = analysis.get('price', 0)
        high = analysis.get('high', 0)
        low = analysis.get('low', 0)
        
        if price > 0 and high > low:
            daily_range_pct = ((high - low) / price) * 100
            # If range > 2%, strong momentum potential
            if daily_range_pct > 2.0:
                 momentum_score += 5
        
        return max(0, min(100, momentum_score))
    
    def calculate_final_score(self, technical_data: Dict, sentiment_data: Dict,
                             fundamental_data: Dict) -> Dict:
        """Calculate final composite score"""
        # Calculate individual scores
        technical_score = self.calculate_technical_score(technical_data)
        sentiment_score = self.calculate_sentiment_score(sentiment_data)
        fundamental_score = self.calculate_fundamental_score(fundamental_data)
        momentum_score = self.calculate_momentum_score(technical_data)
        
        # Weighted combination
        final_score = (
            self.weights["technical"] * technical_score +
            self.weights["sentiment"] * sentiment_score +
            self.weights["fundamental"] * fundamental_score +
            self.weights["momentum"] * momentum_score
        )
        
        return {
            "final_score": round(final_score, 2),
            "technical_score": round(technical_score, 2),
            "sentiment_score": round(sentiment_score, 2),
            "fundamental_score": round(fundamental_score, 2),
            "momentum_score": round(momentum_score, 2),
            "weights": self.weights,
            "timestamp": datetime.now().isoformat()
        }
    
    def rank_stocks(self, stocks_data: List[Dict]) -> Dict[str, List[Dict]]:
        """Rank stocks into BUY, HOLD, SELL categories"""
        ranked_stocks = []
        
        for stock_data in stocks_data:
            symbol = stock_data.get('symbol')
            technical_data = stock_data.get('technical_analysis', {})
            sentiment_data = stock_data.get('sentiment_analysis', {})
            fundamental_data = stock_data.get('fundamental_analysis', {})
            
            # Calculate final score
            score_result = self.calculate_final_score(
                technical_data, sentiment_data, fundamental_data
            )
            
            # Apply risk adjustment if available
            risk_data = stock_data.get('risk_analysis', {})
            if risk_data and risk_data.get('overall_risk'):
                from .risk_analyzer import RiskAnalyzer
                risk_analyzer = RiskAnalyzer()
                risk_adjusted_score = risk_analyzer.calculate_risk_adjusted_score(
                    score_result['final_score'], risk_data
                )
                score_result['risk_adjusted_score'] = risk_adjusted_score
                score_result['original_score'] = score_result['final_score']
                score_result['final_score'] = risk_adjusted_score
            
            # Determine recommendation based on risk-adjusted score
            final_score = score_result.get('risk_adjusted_score', score_result['final_score'])
            if final_score >= 70:
                recommendation = "BUY"
            elif final_score >= 40:
                recommendation = "HOLD"
            else:
                recommendation = "SELL"
            
            ranked_stock = {
                "symbol": symbol,
                "recommendation": recommendation,
                **score_result,
                "technical_analysis": technical_data,
                "sentiment_analysis": sentiment_data,
                "fundamental_analysis": fundamental_data,
                "target_price": stock_data.get('target_price', {}),
                "current_price": technical_data.get('price', 0.0)
            }
            
            # Include risk_analysis if available
            if stock_data.get('risk_analysis'):
                ranked_stock['risk_analysis'] = stock_data['risk_analysis']
            
            ranked_stocks.append(ranked_stock)
        
        # Sort by final score (descending)
        ranked_stocks.sort(key=lambda x: x['final_score'], reverse=True)
        
        # Categorize
        buy_stocks = [s for s in ranked_stocks if s['recommendation'] == 'BUY']
        hold_stocks = [s for s in ranked_stocks if s['recommendation'] == 'HOLD']
        sell_stocks = [s for s in ranked_stocks if s['recommendation'] == 'SELL']
        
        return {
            "top_5_buy": buy_stocks[:5],
            "top_5_hold": hold_stocks[:5],
            "top_5_sell": sell_stocks[:5],
            "all_ranked": ranked_stocks,
            "timestamp": datetime.now().isoformat()
        }


if __name__ == "__main__":
    # Test ranking engine
    engine = RankingEngine()
    
    # Sample data
    test_stock = {
        "symbol": "RELIANCE",
        "technical_analysis": {
            "buy_count": 8,
            "sell_count": 2,
            "final_verdict": "STRONG BUY",
            "trend": "UP",
            "rsi": 65.0,
            "macd_hist": 2.5,
            "volume_signal": "BUY",
            "price": 2500.0
        },
        "sentiment_analysis": {
            "avg_sentiment_score": 0.6,
            "avg_confidence": 0.8,
            "total_news": 5
        },
        "fundamental_analysis": {
            "fundamental_score": 75.0
        }
    }
    
    result = engine.calculate_final_score(
        test_stock["technical_analysis"],
        test_stock["sentiment_analysis"],
        test_stock["fundamental_analysis"]
    )
    
    print(f"Final Score: {result['final_score']}")
    print(f"Technical: {result['technical_score']}, Sentiment: {result['sentiment_score']}")
    print(f"Fundamental: {result['fundamental_score']}, Momentum: {result['momentum_score']}")
