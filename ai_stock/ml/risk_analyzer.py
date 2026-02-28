"""
Risk Analysis Module
Calculates risk metrics and provides risk-adjusted recommendations
"""
import logging
from typing import Dict, List
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)


class RiskAnalyzer:
    """Analyze risk metrics for stocks"""
    
    def __init__(self):
        self.risk_weights = {
            'volatility': 0.30,
            'liquidity': 0.20,
            'leverage': 0.25,
            'earnings_quality': 0.15,
            'market_correlation': 0.10
        }
    
    def calculate_volatility_risk(self, technical_data: Dict) -> float:
        """Calculate volatility risk (0-100, higher = more risky)"""
        rsi = technical_data.get('rsi', 50.0)
        price_change = abs(technical_data.get('price_change_pct', 0.0))
        volume_change = abs(technical_data.get('volume_change', 0.0))
        
        # High volatility indicators
        volatility_score = 0.0
        
        # RSI extremes indicate volatility
        if rsi > 70 or rsi < 30:
            volatility_score += 30
        
        # Large price movements
        if price_change > 5:
            volatility_score += min(30, price_change * 3)
        
        # High volume changes
        if volume_change > 50:
            volatility_score += min(20, (volume_change - 50) / 2)
        
        # Trend instability
        trend = technical_data.get('trend', 'NEUTRAL')
        if trend == 'NEUTRAL':
            volatility_score += 20
        
        return min(100, volatility_score)
    
    def calculate_liquidity_risk(self, technical_data: Dict, fundamental_data: Dict) -> float:
        """Calculate liquidity risk"""
        volume = technical_data.get('volume', 0)
        market_cap = fundamental_data.get('market_cap', 0)
        
        liquidity_score = 50.0  # Base score
        
        # Low volume = higher risk
        if volume < 1000000:  # Less than 1M volume
            liquidity_score += 30
        elif volume < 5000000:
            liquidity_score += 15
        
        # Small market cap = higher risk
        if market_cap and market_cap < 1e10:  # Less than 10B
            liquidity_score += 20
        
        return min(100, liquidity_score)
    
    def calculate_leverage_risk(self, fundamental_data: Dict) -> float:
        """Calculate leverage/debt risk"""
        debt_to_equity = fundamental_data.get('debt_to_equity', 0)
        current_ratio = fundamental_data.get('current_ratio', 1.0)
        
        leverage_score = 0.0
        
        # High debt-to-equity ratio
        if debt_to_equity:
            if debt_to_equity > 2.0:
                leverage_score += 40
            elif debt_to_equity > 1.0:
                leverage_score += 25
            elif debt_to_equity > 0.5:
                leverage_score += 10
        
        # Low current ratio (liquidity issues)
        if current_ratio and current_ratio < 1.0:
            leverage_score += 30
        elif current_ratio and current_ratio < 1.5:
            leverage_score += 15
        
        return min(100, leverage_score)
    
    def calculate_earnings_quality_risk(self, fundamental_data: Dict) -> float:
        """Calculate earnings quality risk"""
        earnings_growth = fundamental_data.get('earnings_growth', 0)
        profit_margin = fundamental_data.get('profit_margin', 0)
        roe = fundamental_data.get('roe', 0)
        
        quality_score = 50.0  # Base
        
        # Negative earnings growth
        if earnings_growth and earnings_growth < 0:
            quality_score += 30
        
        # Low profit margins
        if profit_margin and profit_margin < 0.05:  # Less than 5%
            quality_score += 20
        
        # Low ROE
        if roe and roe < 0.10:  # Less than 10%
            quality_score += 15
        
        return min(100, quality_score)
    
    def calculate_market_correlation_risk(self, technical_data: Dict) -> float:
        """Calculate market correlation risk (simplified)"""
        # In a real system, this would compare with market index
        # For now, use trend stability as proxy
        trend = technical_data.get('trend', 'NEUTRAL')
        buy_signals = technical_data.get('buy_count', 0)
        sell_signals = technical_data.get('sell_count', 0)
        
        correlation_score = 30.0  # Base
        
        # Mixed signals = higher correlation risk
        if buy_signals > 0 and sell_signals > 0:
            signal_ratio = min(buy_signals, sell_signals) / max(buy_signals, sell_signals)
            correlation_score += signal_ratio * 30
        
        # Neutral trend = higher risk
        if trend == 'NEUTRAL':
            correlation_score += 20
        
        return min(100, correlation_score)
    
    def calculate_overall_risk(self, technical_data: Dict, fundamental_data: Dict) -> Dict:
        """Calculate overall risk score"""
        volatility_risk = self.calculate_volatility_risk(technical_data)
        liquidity_risk = self.calculate_liquidity_risk(technical_data, fundamental_data)
        leverage_risk = self.calculate_leverage_risk(fundamental_data)
        earnings_risk = self.calculate_earnings_quality_risk(fundamental_data)
        correlation_risk = self.calculate_market_correlation_risk(technical_data)
        
        # Weighted average
        overall_risk = (
            self.risk_weights['volatility'] * volatility_risk +
            self.risk_weights['liquidity'] * liquidity_risk +
            self.risk_weights['leverage'] * leverage_risk +
            self.risk_weights['earnings_quality'] * earnings_risk +
            self.risk_weights['market_correlation'] * correlation_risk
        )
        
        # Dynamic adjustment based on regime if available (passed in technical_data potentially)
        # For now, we keep it standard but allow stricter penalty
        if volatility_risk > 80:
             overall_risk = max(overall_risk, volatility_risk * 0.9) # Volatility dominates risk profile
        
        # Risk level classification
        if overall_risk < 30:
            risk_level = "LOW"
        elif overall_risk < 50:
            risk_level = "MEDIUM"
        elif overall_risk < 70:
            risk_level = "HIGH"
        else:
            risk_level = "VERY HIGH"
        
        return {
            'overall_risk': round(overall_risk, 2),
            'risk_level': risk_level,
            'volatility_risk': round(volatility_risk, 2),
            'liquidity_risk': round(liquidity_risk, 2),
            'leverage_risk': round(leverage_risk, 2),
            'earnings_risk': round(earnings_risk, 2),
            'correlation_risk': round(correlation_risk, 2),
            'timestamp': datetime.now().isoformat()
        }
    
    def calculate_risk_adjusted_score(self, final_score: float, risk_data: Dict) -> float:
        """Calculate risk-adjusted final score"""
        overall_risk = risk_data.get('overall_risk', 50.0)
        
        # Penalize high risk stocks
        risk_penalty = (overall_risk - 50) * 0.3  # Max 15 point penalty
        
        risk_adjusted_score = final_score - risk_penalty
        
        risk_adjusted_score = final_score - risk_penalty
        
        return max(0, min(100, round(risk_adjusted_score, 2)))

    def calculate_kelly_position(self, win_rate: float, win_loss_ratio: float) -> float:
        """
        Calculate suggested position size using Kelly Criterion
        f = (p(b+1) - 1) / b
        where:
        f = fraction of bankroll
        p = probability of win
        b = odds received (win/loss ratio)
        """
        if win_loss_ratio <= 0:
            return 0.0
            
        kelly_pct = (win_rate * (win_loss_ratio + 1) - 1) / win_loss_ratio
        
        # Use fractional Kelly (half-Kelly) for safety
        safe_kelly = max(0, kelly_pct * 0.5)
        
        # Cap at reasonable max (e.g. 20% of portfolio)
        return min(0.20, safe_kelly)
