import sys
import os
import logging
from datetime import datetime

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_recommender import AIStockRecommender
from ai_stock.ml.ranking_engine import RankingEngine
from ai_stock.ml.risk_analyzer import RiskAnalyzer
from ai_stock.ml.target_price_predictor import TargetPricePredictor
import inspect

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AI_VERIFICATION")

def test_ai_improvements():
    print("="*50)
    print("TESTING AI RECOMMENDATION IMPROVEMENTS")
    print("="*50)
    
    # 1. Test DYNAMIC THRESHOLDS & REGIME DETECTION
    print("\n[1] Testing AI Recommender (Dynamic Thresholds & Regime)...")
    recommender = AIStockRecommender()
    
    sample_analysis = {
        'symbol': 'TEST_STOCK',
        'price': 1000,
        'high': 1020,
        'low': 980,
        'trend': 'UP',
        'rsi': 72, # Overbought normally
        'atr': 25, # High volatility (2.5%)
        'buy_count': 8,
        'sell_count': 2,
        'final_verdict': 'STRONG BUY',
        'timestamp': datetime.now().isoformat()
    }
    
    rec = recommender.generate_recommendation(sample_analysis, {})
    
    print(f"Regime Detected: {rec.get('market_regime')}")
    print(f"Dynamic Thresholds: {rec.get('dynamic_thresholds')}")
    print(f"Improvement: RSI of 72 might not be 'overbought' if threshold raised.")
    print(f"Recommendation: {rec['recommendation'][:100]}...")
    
    # 2. Test CONFIGURABLE RANKING
    print("\n[2] Testing Ranking Engine (Configurable Weights)...")
    custom_weights = {
        "technical": 0.5,
        "sentiment": 0.1,
        "fundamental": 0.2,
        "momentum": 0.2
    }
    engine = RankingEngine(weights=custom_weights)
    print(f"Weights Configured: {engine.weights}")
    
    # Test momentum
    score = engine.calculate_momentum_score(sample_analysis)
    print(f"Momentum Score (with range expansion logic): {score}")
    
    
    # 3. Test RISK ANALYZER (Kelly & Volatility)
    print("\n[3] Testing Risk Analyzer (Kelly Criterion)...")
    risk_analyzer = RiskAnalyzer()
    
    # Simulate a win rate and ratio
    kelly_pos = risk_analyzer.calculate_kelly_position(win_rate=0.6, win_loss_ratio=2.0)
    print(f"Calculated Kelly Position (WinRate=60%, Ratio=2.0): {kelly_pos:.2%}")
    
    
    # 4. Test PRICE PREDICTOR FALLBACK
    print("\n[4] Testing Target Price Predictor (Regression Fallback)...")
    predictor = TargetPricePredictor()
    # Ensure model is not loaded/trained for this test
    predictor.model = None 
    
    fallback_pred = predictor.predict({
        'price': 1000,
        'ema_20': 950,
        'ema_50': 900, # Strong uptrend
        'trend': 'UP'
    })
    
    print(f"Fallback Prediction: {fallback_pred}")
    
    print("\n" + "="*50)
    print("VERIFICATION COMPLETE")
    print("="*50)

if __name__ == "__main__":
    test_ai_improvements()
