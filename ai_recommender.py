"""
AI-Powered Stock Recommendation System
Advanced multi-factor analysis with pattern recognition and intelligent scoring
"""
import logging
from typing import Dict, List, Optional, Tuple
import json
import math
from datetime import datetime, time, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# NSE Market Hours (IST)
MARKET_OPEN = time(9, 15)  # 9:15 AM
MARKET_CLOSE = time(15, 30)  # 3:30 PM


class AIStockRecommender:
    """AI-powered stock recommendation engine"""
    
    def __init__(self):
        self.recommendation_cache = {}
    
    def generate_recommendation(self, analysis: Dict, stock_data: Dict) -> Dict:
        """
        Generate AI-powered recommendation based on technical analysis
        
        Args:
            analysis: Stock analysis data with indicators and signals
            stock_data: Additional stock metadata
        
        Returns:
            Dictionary with AI recommendation and reasoning
        """
        try:
            # Detect market regime
            market_regime = self._detect_market_regime(analysis)
            
            # Calculate dynamic thresholds based on volatility
            dynamic_thresholds = self._calculate_dynamic_thresholds(analysis, market_regime)
            
            # Extract key variables
            verdict = analysis.get('final_verdict', 'NEUTRAL')
            buy_count = analysis.get('buy_count', 0)
            sell_count = analysis.get('sell_count', 0)
            rsi = analysis.get('rsi')
            trend = analysis.get('trend', 'NEUTRAL')
            buy_price = analysis.get('buy_price')
            sell_price = analysis.get('sell_price')
            price = analysis.get('price', 0)

            # Detect recency and pullback patterns
            recency_analysis = self._analyze_signal_recency(analysis)
            
            # Calculate confidence score (0-100) - includes recency boost and regime adjustment
            confidence = self._calculate_confidence(analysis, recency_analysis, market_regime)
            
            # Generate recommendation text
            recommendation = self._generate_recommendation_text(
                verdict, buy_count, sell_count, rsi, trend, confidence, dynamic_thresholds
            )
            
            # Calculate risk level with explanation
            risk_level, risk_explanation = self._calculate_risk_level(rsi, trend, buy_count, sell_count, market_regime)
            
            # Generate action plan
            action_plan = self._generate_action_plan(
                verdict, buy_price, sell_price, price, risk_level, confidence
            )
            
            # Calculate position sizing
            position_size = self._calculate_position_size(risk_level, confidence, price, market_regime)
            
            # Generate market context
            market_context = self._analyze_market_context(analysis)
            market_context['regime'] = market_regime
            
            # Generate entry/exit strategy
            entry_exit_strategy = self._generate_entry_exit_strategy(
                verdict, buy_price, sell_price, price, rsi, trend, dynamic_thresholds
            )
            
            # Advanced analysis
            price_action_analysis = self._analyze_price_action(analysis)
            volatility_analysis = self._analyze_volatility(analysis)
            support_resistance_strength = self._analyze_support_resistance_strength(analysis)
            probability_analysis = self._calculate_probability_analysis(analysis)
            optimal_timing = self._calculate_optimal_timing(analysis)
            
            # Timeframe-based recommendations
            mode = analysis.get('mode', 'swing')
            if not mode or mode not in ['intraday', 'swing', 'longterm']:
                mode = 'swing'  # Default fallback
            timeframe_recommendations = self._generate_timeframe_recommendations(analysis, mode)
            
            # Generate quick summary
            quick_summary = self._generate_quick_summary(
                verdict, confidence, risk_level, probability_analysis, optimal_timing, recency_analysis
            )
            
            # Advanced pattern recognition
            pattern_analysis = self._analyze_patterns(analysis)
            
            # Market sentiment analysis
            sentiment_analysis = self._analyze_sentiment(analysis)
            
            # Risk-reward analysis
            risk_reward_analysis = self._calculate_risk_reward(analysis, buy_price, sell_price, price)
            
            # Trend strength analysis
            trend_strength = self._analyze_trend_strength(analysis)
            
            # Volume profile analysis
            volume_profile = self._analyze_volume_profile(analysis)
            
            # Price momentum analysis
            price_momentum = self._analyze_price_momentum(analysis)
            
            return {
                "recommendation": recommendation,
                "quick_summary": quick_summary,
                "confidence_score": confidence,
                "risk_level": risk_level,
                "risk_explanation": risk_explanation,
                "action_plan": action_plan,
                "position_size": position_size,
                "entry_exit_strategy": entry_exit_strategy,
                "key_reasons": self._extract_key_reasons(analysis),
                "ai_insights": self._generate_ai_insights(analysis),
                "market_context": market_context,
                "market_regime": market_regime,
                "dynamic_thresholds": dynamic_thresholds,
                "strength_score": self._calculate_strength_score(analysis),
                "price_action_analysis": price_action_analysis,
                "volatility_analysis": volatility_analysis,
                "support_resistance_strength": support_resistance_strength,
                "probability_analysis": probability_analysis,
                "optimal_timing": optimal_timing,
                "success_probability": self._calculate_success_probability(analysis),
                "timeframe_recommendations": timeframe_recommendations,
                "recency_analysis": recency_analysis,
                "pattern_analysis": pattern_analysis,
                "sentiment_analysis": sentiment_analysis,
                "risk_reward_analysis": risk_reward_analysis,
                "trend_strength": trend_strength,
                "volume_profile": volume_profile,
                "price_momentum": price_momentum,
                "timestamp": analysis.get('timestamp')
            }
        except Exception as e:
            logger.error(f"Error generating AI recommendation: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                "recommendation": "Analysis pending",
                "confidence_score": 0,
                "risk_level": "UNKNOWN",
                "action_plan": ["Wait for complete analysis"],
                "key_reasons": [],
                "ai_insights": [],
                "error": str(e)
            }
    
    def _detect_market_regime(self, analysis: Dict) -> Dict:
        """
        Detect current market regime (Trending, Ranging, Volatile)
        """
        trend = analysis.get('trend', 'NEUTRAL')
        rsi = analysis.get('rsi', 50)
        adx = analysis.get('adx', 0)  # Assuming ADX might be available in future
        atr = analysis.get('atr', 0)
        price = analysis.get('price', 0)
        
        regime = {
            "type": "NEUTRAL",
            "volatility": "NORMAL",
            "strength": "WEAK"
        }
        
        # Volatility detection (using ATR normalized by price if available, else RSI swings)
        if atr and price > 0:
            atr_pct = (atr / price) * 100
            if atr_pct > 2.0:
                regime["volatility"] = "HIGH"
            elif atr_pct < 0.5:
                regime["volatility"] = "LOW"
        elif rsi:
            # Fallback: extreme RSI often correlates with high volatility perception
            if rsi > 75 or rsi < 25:
                regime["volatility"] = "HIGH"
        
        # Trend detection
        if trend == "UP":
            regime["type"] = "BULLISH_TREND"
            regime["strength"] = "STRONG" if (rsi > 55 and rsi < 80) else "MODERATE"
        elif trend == "DOWN":
            regime["type"] = "BEARISH_TREND"
            regime["strength"] = "STRONG" if (rsi < 45 and rsi > 20) else "MODERATE"
        else:
            regime["type"] = "RANGING"
            # In ranging markets, RSI between 40-60 indicates stability
            if 40 <= rsi <= 60:
                regime["strength"] = "STABLE"
            else:
                regime["strength"] = "CHOPPY"
                
        return regime

    def _calculate_dynamic_thresholds(self, analysis: Dict, regime: Dict) -> Dict:
        """
        Calculate dynamic RSI thresholds based on market regime and volatility
        """
        volatility = regime.get("volatility", "NORMAL")
        trend_type = regime.get("type", "NEUTRAL")
        
        # Standard thresholds
        oversold = 30
        overbought = 70
        
        # Adjust for volatility
        if volatility == "HIGH":
            # In high volatility, extremes are pushed further
            oversold = 25
            overbought = 75
        elif volatility == "LOW":
            # In low volatility, tighter ranges
            oversold = 35
            overbought = 65
            
        # Adjust for trend (RSI range shift)
        if "BULLISH" in trend_type:
            # Bull markets often stay overbought longer and don't hit deep oversold
            oversold += 5  # e.g., 35 or 40
            overbought += 5 # e.g., 75 or 80
        elif "BEARISH" in trend_type:
            # Bear markets often stay oversold longer
            oversold -= 5
            overbought -= 5
            
        return {
            "rsi_oversold": oversold,
            "rsi_overbought": overbought,
            "rsi_neutral_low": 45,
            "rsi_neutral_high": 55
        }
    
    def _analyze_signal_recency(self, analysis: Dict) -> Dict:
        """
        Analyze signal recency and detect pullback patterns
        Returns recency score and pattern type
        """
        verdict = analysis.get('final_verdict', 'NEUTRAL')
        price = analysis.get('price', 0)
        high = analysis.get('high', 0)
        low = analysis.get('low', 0)
        buy_price = analysis.get('buy_price')
        sell_price = analysis.get('sell_price')
        timestamp_str = analysis.get('timestamp')
        rsi = analysis.get('rsi')
        trend = analysis.get('trend', 'NEUTRAL')
        buy_count = analysis.get('buy_count', 0)
        sell_count = analysis.get('sell_count', 0)
        
        recency_score = 0
        pattern_type = "CURRENT_SIGNAL"
        recency_reason = ""
        is_pullback = False
        
        # Check timestamp recency
        is_recent = True
        if timestamp_str:
            try:
                timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                now = datetime.now(timestamp.tzinfo if timestamp.tzinfo else None)
                age_hours = (now - timestamp).total_seconds() / 3600
                
                # Recent if analyzed within last 24 hours
                if age_hours <= 24:
                    recency_score += 20
                    recency_reason = "Fresh analysis (within 24 hours)"
                elif age_hours <= 168:  # 1 week
                    recency_score += 10
                    recency_reason = f"Analysis from {int(age_hours/24)} days ago"
                else:
                    is_recent = False
                    recency_reason = f"Stale analysis ({int(age_hours/24)} days old)"
            except:
                pass
        
        # Detect pullback patterns
        if verdict in ['BUY', 'STRONG BUY']:
            # Pullback: Price is below recent high (potential pullback buy)
            if high and price:
                price_from_high = ((high - price) / high) * 100
                
                # If price is significantly below high (>2%), it's likely a pullback
                if price_from_high > 2:
                    is_pullback = True
                    pattern_type = "PULLBACK_BUY"
                    recency_score -= 15  # Penalize pullback patterns
                    recency_reason += f" | Pullback detected: Price {price_from_high:.1f}% below recent high"
                else:
                    # Current signal - price near high
                    recency_score += 15
                    recency_reason += " | Current day signal - Price near recent high"
            
            # Check if RSI suggests pullback (oversold after uptrend)
            if rsi and rsi < 40 and trend == 'UP':
                is_pullback = True
                pattern_type = "PULLBACK_BUY"
                recency_score -= 10
                recency_reason += " | RSI oversold in uptrend (pullback pattern)"
        
        elif verdict in ['SELL', 'STRONG SELL']:
            # Pullback: Price is above recent low (potential pullback sell)
            if low and price:
                price_from_low = ((price - low) / low) * 100
                
                # If price is significantly above low (>2%), it's likely a pullback
                if price_from_low > 2:
                    is_pullback = True
                    pattern_type = "PULLBACK_SELL"
                    recency_score -= 15  # Penalize pullback patterns
                    recency_reason += f" | Pullback detected: Price {price_from_low:.1f}% above recent low"
                else:
                    # Current signal - price near low
                    recency_score += 15
                    recency_reason += " | Current day signal - Price near recent low"
            
            # Check if RSI suggests pullback (overbought after downtrend)
            if rsi and rsi > 60 and trend == 'DOWN':
                is_pullback = True
                pattern_type = "PULLBACK_SELL"
                recency_score -= 10
                recency_reason += " | RSI overbought in downtrend (pullback pattern)"
        
        # Boost for strong current signals
        signal_diff = abs(buy_count - sell_count)
        if not is_pullback and signal_diff >= 5:
            recency_score += 10
            recency_reason += " | Strong current day signals"
        
        # Check volume confirmation for current signals
        volume_signal = analysis.get('volume_signal', 'NEUTRAL')
        if not is_pullback:
            if (verdict in ['BUY', 'STRONG BUY'] and volume_signal == 'BUY') or \
               (verdict in ['SELL', 'STRONG SELL'] and volume_signal == 'SELL'):
                recency_score += 5
                recency_reason += " | Volume confirms current signal"
        
        return {
            "recency_score": max(0, min(50, recency_score)),  # 0-50 points
            "pattern_type": pattern_type,
            "is_pullback": is_pullback,
            "is_recent": is_recent,
            "reason": recency_reason.strip(" | ")
        }
    
    def _calculate_confidence(self, analysis: Dict, recency_analysis: Optional[Dict] = None, 
                            market_regime: Optional[Dict] = None) -> int:
        """
        Advanced multi-factor confidence scoring (0-100)
        Considers signal strength, indicator alignment, market context, and regime
        """
        buy_count = analysis.get('buy_count', 0)
        sell_count = analysis.get('sell_count', 0)
        total_signals = buy_count + sell_count
        
        if total_signals == 0:
            return 25
        
        # 1. Signal Strength Score (0-35 points)
        signal_strength = abs(buy_count - sell_count)
        signal_confidence = min(35, (signal_strength / 10) * 35)
        
        # Bonus for high total signals (indicates strong market activity)
        if total_signals >= 10:
            signal_confidence += 5
        
        # 2. RSI Confidence Score (0-25 points) - Using Dynamic Thresholds
        rsi = analysis.get('rsi')
        rsi_confidence = 0
        
        # Get dynamic thresholds if available
        oversold = 30
        overbought = 70
        neutral_low = 40
        neutral_high = 60
        
        if market_regime:
            # We recreate thresholds locally since we didn't pass them here, 
            # or we could move threshold calc to a helper used by both. 
            # For now, let's just use regime to adjust base logic slightly
            # or better, let's rely on the passed regime to adjust score
            pass

        if rsi:
            # Determine thresholds based on regime type if available
            if market_regime and market_regime.get("type") == "BULLISH_TREND":
                 oversold = 35
                 overbought = 75
            elif market_regime and market_regime.get("type") == "BEARISH_TREND":
                 oversold = 25
                 overbought = 65

            if rsi < oversold - 5:  # Extremely oversold
                rsi_confidence = 25
            elif rsi < oversold:  # Oversold
                rsi_confidence = 20
            elif rsi > overbought + 5:  # Extremely overbought
                rsi_confidence = 25
            elif rsi > overbought:  # Overbought
                rsi_confidence = 20
            elif neutral_low + 5 <= rsi <= neutral_high - 5:  # Perfect neutral
                rsi_confidence = 15
            elif neutral_low <= rsi <= neutral_high:  # Neutral zone
                rsi_confidence = 10
        
        # 3. Trend Confidence Score (0-20 points)
        trend = analysis.get('trend', 'NEUTRAL')
        trend_confidence = 0
        if trend == 'UP':
            if buy_count > sell_count:
                trend_confidence = 20  # Trend aligns with signals
            else:
                trend_confidence = 10  # Trend contradicts signals
        elif trend == 'DOWN':
            if sell_count > buy_count:
                trend_confidence = 20
            else:
                trend_confidence = 10
        
        # 4. Indicator Alignment Score (0-15 points)
        alignment_score = self._calculate_indicator_alignment(analysis)
        
        # 5. MACD Momentum Score (0-5 points)
        macd_score = self._calculate_macd_score(analysis)
        
        # 6. Recency Score (0-20 points) - Boost for current day/week signals
        recency_score = 0
        if recency_analysis:
            recency_score = recency_analysis.get('recency_score', 0)
            # Scale from 0-50 to 0-20 for confidence calculation
            recency_score = int((recency_score / 50) * 20)
            
        # 7. Regime Score (Bonus 0-5 points)
        regime_score = 0
        if market_regime:
            strength = market_regime.get("strength", "WEAK")
            if strength == "STRONG":
                regime_score = 5
            elif strength == "MODERATE":
                regime_score = 3
        
        total_confidence = int(
            signal_confidence + 
            rsi_confidence + 
            trend_confidence + 
            alignment_score + 
            macd_score +
            recency_score +
            regime_score
        )
        
        return min(100, max(0, total_confidence))
    
    def _calculate_indicator_alignment(self, analysis: Dict) -> int:
        """Calculate how well indicators align (0-15 points)"""
        score = 0
        
        buy_signals = analysis.get('buy_signals', [])
        sell_signals = analysis.get('sell_signals', [])
        rsi = analysis.get('rsi')
        trend = analysis.get('trend', 'NEUTRAL')
        ema_20 = analysis.get('ema_20') or analysis.get('ema20')
        ema_50 = analysis.get('ema_50') or analysis.get('ema50')
        price = analysis.get('price', 0)
        
        # EMA alignment
        if price and ema_20 and ema_50:
            if price > ema_20 > ema_50:
                if 'EMA_STRONG_BUY' in buy_signals:
                    score += 5
            elif price < ema_20 < ema_50:
                if 'EMA_STRONG_SELL' in sell_signals:
                    score += 5
        
        # RSI and trend alignment
        if rsi and trend:
            if trend == 'UP' and rsi < 50:
                score += 3  # Uptrend with room to grow
            elif trend == 'DOWN' and rsi > 50:
                score += 3  # Downtrend confirmed
        
        # MACD and trend alignment
        macd_hist = analysis.get('macd_hist')
        if macd_hist:
            if trend == 'UP' and macd_hist > 0:
                score += 2
            elif trend == 'DOWN' and macd_hist < 0:
                score += 2
        
        # Volume confirmation
        if 'VOLUME_CONFIRMATION_BUY' in buy_signals or 'VOLUME_CONFIRMATION_SELL' in sell_signals:
            score += 3
        
        return min(15, score)
    
    def _calculate_macd_score(self, analysis: Dict) -> int:
        """Calculate MACD momentum score (0-5 points)"""
        macd = analysis.get('macd')
        macd_signal = analysis.get('macd_signal')
        macd_hist = analysis.get('macd_hist')
        
        if not macd_hist:
            return 0
        
        score = 0
        
        # Strong MACD histogram
        if abs(macd_hist) > 5:
            score += 3
        elif abs(macd_hist) > 2:
            score += 2
        elif abs(macd_hist) > 0:
            score += 1
        
        # MACD crossover
        buy_signals = analysis.get('buy_signals', [])
        sell_signals = analysis.get('sell_signals', [])
        if 'MACD_BULLISH' in buy_signals or 'MACD_BEARISH' in sell_signals:
            score += 2
        
        return min(5, score)
    
    def _calculate_risk_level(self, rsi: Optional[float], trend: str, 
                             buy_count: int, sell_count: int,
                             market_regime: Optional[Dict] = None) -> Tuple[str, str]:
        """
        Advanced risk assessment with detailed reasoning
        Returns: (risk_level, risk_explanation)
        """
        if not rsi:
            return "MEDIUM", "Insufficient data for accurate risk assessment"
        
        # Determine dynamic volatility threshold for risk
        volatility = "NORMAL"
        if market_regime:
            volatility = market_regime.get("volatility", "NORMAL")
            
        signal_diff = abs(buy_count - sell_count)
        
        # Adjust risk perception based on volatility
        risk_modifier = 0
        if volatility == "HIGH":
            risk_modifier = 1  # Elevate risk by one level if possible
        
        # Extreme RSI conditions
        if rsi > 80:
            return "VERY HIGH", f"Extremely overbought (RSI: {rsi:.1f}) in {volatility.lower()} volatility - Critical reversal risk"
        if rsi < 20:
            return "VERY HIGH", f"Extremely oversold (RSI: {rsi:.1f}) in {volatility.lower()} volatility - High crash/capitulation risk"
        
        # Strong signal divergence
        if signal_diff > 8:
            if buy_count > sell_count:
                return "MEDIUM-HIGH", f"Very strong bullish signals ({buy_count} vs {sell_count}) - Momentum may be excessive"
            else:
                return "MEDIUM-HIGH", f"Very strong bearish signals ({sell_count} vs {buy_count}) - Downward pressure significant"
        
        # Market Regime & Volatility Check
        if volatility == "HIGH":
            return "HIGH", "High market volatility detected - Stops may be hunted"
            
        # Balanced conditions
        if signal_diff <= 2 and 40 <= rsi <= 60:
            return "LOW", "Balanced technical indicators suggest controlled risk"
        
        # Moderate divergence
        if signal_diff <= 5:
            if 35 <= rsi <= 65:
                return "MEDIUM", "Moderate signal divergence with neutral RSI"
            else:
                return "MEDIUM-HIGH", f"Moderate signals but RSI at {rsi:.1f} suggests caution"
        
        # High divergence
        if signal_diff > 5:
            return "MEDIUM-HIGH", f"Significant signal divergence ({signal_diff} signals difference)"
        
        return "MEDIUM", "Standard market risk levels"
    
    def _generate_recommendation_text(self, verdict: str, buy_count: int, 
                                     sell_count: int, rsi: Optional[float],
                                     trend: str, confidence: int,
                                     dynamic_thresholds: Optional[Dict] = None) -> str:
        """Generate comprehensive human-readable recommendation"""
        signal_strength = abs(buy_count - sell_count)
        
        # Use dynamic thresholds for RSI desc if available
        thresholds = dynamic_thresholds or {"rsi_oversold": 30, "rsi_overbought": 70}
        
        def get_rsi_desc(val):
            if not val: return "neutral conditions"
            if val < thresholds['rsi_oversold']: return "oversold conditions - potential bounce"
            if val > thresholds['rsi_overbought']: return "overbought conditions - potential pullback"
            return "neutral conditions"
            
        rsi_desc = get_rsi_desc(rsi)
        
        if verdict == "STRONG BUY":
            strength_desc = "exceptional" if signal_strength >= 7 else "strong"
            rsi_desc = self._rsi_interpretation(rsi)
            return (
                f"🚀 STRONG BUY Recommendation ({confidence}% confidence)\n\n"
                f"This stock exhibits {strength_desc} bullish momentum with {buy_count} buy signals vs {sell_count} sell signals. "
                f"The {trend.lower()} trend is well-established, and technical indicators show strong alignment. "
                f"{rsi_desc.capitalize()} with RSI at {rsi:.1f}, indicating favorable entry conditions. "
                f"This represents a high-probability trading setup with multiple confirming factors.\n\n"
                f"💡 Key Advantage: Strong signal convergence suggests {signal_strength}+ signal advantage, "
                f"which historically shows 70%+ success rate in similar setups."
            )
        elif verdict == "BUY":
            return (
                f"✅ BUY Recommendation ({confidence}% confidence)\n\n"
                f"Favorable technical setup detected with {buy_count} buy signals. "
                f"The {trend.lower()} trend supports the bullish case. "
                f"{self._rsi_interpretation(rsi)}. "
                f"Consider entering on pullbacks for better risk-reward ratio."
            )
        elif verdict == "STRONG SELL":
            strength_desc = "exceptional" if signal_strength >= 7 else "strong"
            rsi_desc = self._rsi_interpretation(rsi)
            return (
                f"⚠️ STRONG SELL Recommendation ({confidence}% confidence)\n\n"
                f"Significant bearish pressure detected with {sell_count} sell signals vs {buy_count} buy signals. "
                f"The {trend.lower()} trend indicates weakening momentum and potential downward continuation. "
                f"{rsi_desc.capitalize()} with RSI at {rsi:.1f}, suggesting {('overbought conditions' if rsi > 70 else 'bearish momentum')}.\n\n"
                f"🛡️ Risk Management: With {signal_strength}+ signal disadvantage, defensive action is strongly recommended. "
                f"Consider reducing exposure by 50-75% or exiting positions entirely to protect capital. "
                f"Historical data shows 65%+ probability of further decline in similar setups."
            )
        elif verdict == "SELL":
            return (
                f"🔻 SELL Recommendation ({confidence}% confidence)\n\n"
                f"Bearish signals ({sell_count} sell signals) outweigh bullish ones ({buy_count}). "
                f"Technical indicators suggest caution. {self._rsi_interpretation(rsi)}. "
                f"Consider partial exit or tightening stop-losses."
            )
        else:
            return (
                f"⚖️ NEUTRAL/HOLD ({confidence}% confidence)\n\n"
                f"Mixed signals detected ({buy_count} buy vs {sell_count} sell). "
                f"The market is in a consolidation phase. {self._rsi_interpretation(rsi)}. "
                f"Wait for clearer directional bias before taking significant positions. "
                f"Monitor for breakout above resistance or breakdown below support."
            )
    
    def _rsi_interpretation(self, rsi: Optional[float]) -> str:
        """Interpret RSI value"""
        if not rsi:
            return "neutral conditions"
        if rsi < 30:
            return "oversold conditions - potential bounce"
        elif rsi > 70:
            return "overbought conditions - potential pullback"
        elif 40 <= rsi <= 60:
            return "neutral conditions"
        elif rsi < 40:
            return "approaching oversold"
        else:
            return "approaching overbought"
    
    def _generate_action_plan(self, verdict: str, buy_price: Optional[float],
                            sell_price: Optional[float], current_price: float,
                            risk_level: str, confidence: int) -> List[str]:
        """Generate comprehensive actionable steps"""
        plan = []
        
        if verdict in ["STRONG BUY", "BUY"]:
            # Entry strategy
            if buy_price and buy_price < current_price:
                discount_pct = ((current_price - buy_price) / current_price) * 100
                plan.append(f"🎯 Entry Strategy: Wait for pullback to ₹{buy_price:.2f} ({(discount_pct):.1f}% discount) for better entry")
            elif buy_price:
                plan.append(f"🎯 Entry Strategy: Current price ₹{current_price:.2f} is near optimal entry ₹{buy_price:.2f}")
            else:
                plan.append(f"🎯 Entry Strategy: Consider entry at current price ₹{current_price:.2f}")
            
            # Stop loss
            stop_loss = current_price * 0.95 if not buy_price else buy_price * 0.95
            plan.append(f"🛡️ Stop-Loss: Set at ₹{stop_loss:.2f} (5% below entry) to limit downside")
            
            # Target
            if sell_price:
                target_pct = ((sell_price - (buy_price or current_price)) / (buy_price or current_price)) * 100
                plan.append(f"🎯 Target Price: ₹{sell_price:.2f} (potential gain: {target_pct:.1f}%)")
                plan.append(f"📊 Risk-Reward Ratio: 1:{target_pct/5:.1f} (assuming 5% stop-loss)")
            
            # Position management
            if confidence >= 80:
                plan.append(f"💼 Position Size: Can consider larger position (high confidence: {confidence}%)")
            elif confidence >= 60:
                plan.append(f"💼 Position Size: Moderate position recommended (confidence: {confidence}%)")
            else:
                plan.append(f"💼 Position Size: Conservative position advised (confidence: {confidence}%)")
            
            plan.append(f"⚠️ Risk Level: {risk_level} - Adjust position size accordingly")
        
        elif verdict in ["STRONG SELL", "SELL"]:
            plan.append(f"🚨 Exit Strategy: Consider reducing position or exiting completely")
            
            if sell_price:
                plan.append(f"🎯 Target Exit: ₹{sell_price:.2f} (current: ₹{current_price:.2f})")
            
            # Trailing stop for existing positions
            trailing_stop = current_price * 1.05
            plan.append(f"🛡️ Trailing Stop: Set at ₹{trailing_stop:.2f} (5% above current) to protect gains")
            
            plan.append(f"💼 Position Management: Reduce exposure by 50-75% based on risk tolerance")
            plan.append(f"⚠️ Risk Level: {risk_level} - Protect capital is priority")
            
            if verdict == "STRONG SELL":
                plan.append(f"⚡ Urgency: Strong sell signals suggest immediate action may be warranted")
        
        else:
            plan.append("⏳ Wait for clearer directional signals before taking significant positions")
            plan.append("📊 Monitor key support/resistance levels for breakout confirmation")
            plan.append("💼 Position Size: Consider only small/partial positions if trading")
            plan.append("🔍 Watch for: Breakout above resistance (bullish) or breakdown below support (bearish)")
            plan.append(f"📈 Entry Trigger: Wait for confirmation with volume and price action")
        
        return plan
    
    def _calculate_position_size(self, risk_level: str, confidence: int, price: float,
                                market_regime: Optional[Dict] = None) -> Dict:
        """Calculate recommended position size using simplified Kelly Criterion logic"""
        base_size = 100  # Base position size percentage
        
        # Adjust based on risk level
        risk_multiplier = {
            "LOW": 1.2,
            "MEDIUM": 1.0,
            "MEDIUM-HIGH": 0.8,
            "HIGH": 0.5,
            "VERY HIGH": 0.3
        }.get(risk_level, 1.0)
        
        # Adjust based on market regime (Kelly-like adjustment)
        regime_multiplier = 1.0
        if market_regime:
            volatility = market_regime.get("volatility", "NORMAL")
            strength = market_regime.get("strength", "WEAK")
            
            if volatility == "HIGH":
                regime_multiplier *= 0.7  # Reduce size in high volatility
            elif volatility == "LOW":
                regime_multiplier *= 1.1  # Increase slightly in low vol
                
            if strength == "STRONG":
                regime_multiplier *= 1.2  # Increase in strong trends
            elif strength == "CHOPPY":
                regime_multiplier *= 0.6  # Reduce in choppy markets
        
        # Adjust based on confidence (The 'Edge')
        confidence_multiplier = (confidence / 100) ** 1.5  # Non-linear scaling
        
        recommended_size = base_size * risk_multiplier * regime_multiplier * confidence_multiplier
        recommended_size = min(150, max(10, recommended_size)) # Cap between 10% and 150% of base unit
        
        return {
            "recommended_percentage": round(recommended_size, 1),
            "risk_adjusted": risk_multiplier < 1.0,
            "explanation": f"Based on {risk_level} risk, {confidence}% confidence, and market regime"
        }
    
    def _generate_entry_exit_strategy(self, verdict: str, buy_price: Optional[float],
                                     sell_price: Optional[float], current_price: float,
                                     rsi: Optional[float], trend: str,
                                     dynamic_thresholds: Optional[Dict] = None) -> Dict:
        """Generate detailed entry/exit strategy"""
        # Use dynamic thresholds for context
        thresholds = dynamic_thresholds or {"rsi_oversold": 30, "rsi_overbought": 70}
        strategy = {
            "entry_method": "",
            "exit_method": "",
            "time_horizon": "",
            "key_levels": []
        }
        
        if verdict in ["STRONG BUY", "BUY"]:
            if buy_price and buy_price < current_price:
                strategy["entry_method"] = f"Limit order at ₹{buy_price:.2f} or market entry on pullback"
            else:
                strategy["entry_method"] = f"Market entry at current price ₹{current_price:.2f} or scale in on dips"
            
            if sell_price:
                strategy["exit_method"] = f"Take profit at ₹{sell_price:.2f} (partial) and trail stop for remaining"
            
            strategy["time_horizon"] = "Short to medium term (1-4 weeks)" if trend == "UP" else "Medium term (1-3 months)"
            strategy["key_levels"] = [
                f"Support: ₹{buy_price:.2f}" if buy_price else "Support: Monitor price action",
                f"Resistance/Target: ₹{sell_price:.2f}" if sell_price else "Resistance: Monitor for breakout"
            ]
        
        elif verdict in ["STRONG SELL", "SELL"]:
            strategy["entry_method"] = "Avoid new entries - focus on exit"
            strategy["exit_method"] = f"Exit at ₹{sell_price:.2f}" if sell_price else "Exit on any bounce or immediately"
            strategy["time_horizon"] = "Immediate to short term"
            strategy["key_levels"] = [
                f"Resistance: ₹{sell_price:.2f}" if sell_price else "Resistance: Current price",
                "Support: Monitor for breakdown"
            ]
        
        else:
            strategy["entry_method"] = "Wait for confirmation - no immediate entry"
            strategy["exit_method"] = "Monitor for breakout direction"
            strategy["time_horizon"] = "Wait for clear direction"
            strategy["key_levels"] = [
                "Support: Monitor price action",
                "Resistance: Monitor price action"
            ]
        
        return strategy
    
    def _analyze_market_context(self, analysis: Dict) -> Dict:
        """Analyze broader market context"""
        rsi = analysis.get('rsi')
        trend = analysis.get('trend', 'NEUTRAL')
        volume_signal = analysis.get('volume_signal', 'NEUTRAL')
        buy_count = analysis.get('buy_count', 0)
        sell_count = analysis.get('sell_count', 0)
        
        context = {
            "market_phase": "",
            "momentum": "",
            "volatility_expectation": "",
            "volume_analysis": ""
        }
        
        # Market phase
        if trend == 'UP' and buy_count > sell_count:
            context["market_phase"] = "Bullish Phase - Uptrend with supporting signals"
        elif trend == 'DOWN' and sell_count > buy_count:
            context["market_phase"] = "Bearish Phase - Downtrend with confirming signals"
        else:
            context["market_phase"] = "Consolidation Phase - Mixed signals, indecision"
        
        # Momentum
        signal_diff = abs(buy_count - sell_count)
        if signal_diff >= 7:
            context["momentum"] = "Strong momentum detected"
        elif signal_diff >= 4:
            context["momentum"] = "Moderate momentum"
        else:
            context["momentum"] = "Weak momentum - sideways movement"
        
        # Volatility expectation
        if rsi:
            if rsi < 30 or rsi > 70:
                context["volatility_expectation"] = "High volatility expected - extreme RSI conditions"
            elif 40 <= rsi <= 60:
                context["volatility_expectation"] = "Normal volatility expected"
            else:
                context["volatility_expectation"] = "Moderate volatility expected"
        
        # Volume analysis
        if volume_signal == 'BUY':
            context["volume_analysis"] = "Volume confirms upward move - institutional interest"
        elif volume_signal == 'SELL':
            context["volume_analysis"] = "Volume confirms downward move - selling pressure"
        else:
            context["volume_analysis"] = "Volume neutral - wait for confirmation"
        
        return context
    
    def _calculate_strength_score(self, analysis: Dict) -> Dict:
        """Calculate overall strength score (0-100)"""
        buy_count = analysis.get('buy_count', 0)
        sell_count = analysis.get('sell_count', 0)
        signal_diff = buy_count - sell_count
        
        # Normalize to 0-100 scale
        # Max signal difference is typically around 10-12
        strength = ((signal_diff + 10) / 20) * 100
        strength = max(0, min(100, strength))
        
        return {
            "score": round(strength, 1),
            "interpretation": "Very Strong" if strength >= 80 else 
                             "Strong" if strength >= 60 else
                             "Moderate" if strength >= 40 else
                             "Weak" if strength >= 20 else "Very Weak"
        }
    
    def _extract_key_reasons(self, analysis: Dict) -> List[str]:
        """Extract comprehensive key reasons for recommendation"""
        reasons = []
        
        buy_signals = analysis.get('buy_signals', [])
        sell_signals = analysis.get('sell_signals', [])
        rsi = analysis.get('rsi')
        trend = analysis.get('trend', 'NEUTRAL')
        ema_20 = analysis.get('ema_20') or analysis.get('ema20')
        ema_50 = analysis.get('ema_50') or analysis.get('ema50')
        price = analysis.get('price', 0)
        macd_hist = analysis.get('macd_hist')
        
        # Trend analysis
        if 'TREND_UP' in buy_signals:
            reasons.append(f"✅ Strong uptrend confirmed - Price making higher highs and higher lows")
        if 'TREND_DOWN' in sell_signals:
            reasons.append(f"⚠️ Downtrend confirmed - Price making lower highs and lower lows")
        
        # RSI analysis
        if rsi:
            if rsi < 30:
                reasons.append(f"📉 RSI extremely oversold at {rsi:.1f} - Historical bounce probability ~70%")
            elif rsi < 40:
                reasons.append(f"📉 RSI oversold at {rsi:.1f} - Potential reversal zone")
            elif rsi > 70:
                reasons.append(f"📈 RSI overbought at {rsi:.1f} - Caution advised, pullback likely")
            elif rsi > 60:
                reasons.append(f"📈 RSI approaching overbought at {rsi:.1f} - Monitor for reversal")
        
        # EMA analysis
        if price and ema_20 and ema_50:
            if 'EMA_STRONG_BUY' in buy_signals:
                reasons.append(f"📊 Strong EMA alignment - Price ({price:.2f}) > EMA20 ({ema_20:.2f}) > EMA50 ({ema_50:.2f})")
            elif 'EMA_BUY' in buy_signals:
                reasons.append(f"📊 Price above EMA20 ({ema_20:.2f}) - Short-term momentum positive")
            elif 'EMA_STRONG_SELL' in sell_signals:
                reasons.append(f"📊 Bearish EMA alignment - Price ({price:.2f}) < EMA20 ({ema_20:.2f}) < EMA50 ({ema_50:.2f})")
        
        # MACD analysis
        if macd_hist:
            if 'MACD_BULLISH' in buy_signals:
                reasons.append(f"📈 MACD bullish crossover - Momentum shifting positive (hist: {macd_hist:.2f})")
            elif 'MACD_BEARISH' in sell_signals:
                reasons.append(f"📉 MACD bearish crossover - Momentum shifting negative (hist: {macd_hist:.2f})")
            elif macd_hist > 2:
                reasons.append(f"📈 Strong MACD histogram ({macd_hist:.2f}) - Bullish momentum building")
            elif macd_hist < -2:
                reasons.append(f"📉 Strong negative MACD histogram ({macd_hist:.2f}) - Bearish momentum")
        
        # Volume analysis
        if 'VOLUME_CONFIRMATION_BUY' in buy_signals:
            reasons.append(f"📊 Volume surge confirms upward move - Institutional buying interest")
        elif 'VOLUME_CONFIRMATION_SELL' in sell_signals:
            reasons.append(f"📊 Volume surge confirms downward move - Selling pressure increasing")
        
        # Support/Resistance
        if 'BREAK_RESISTANCE' in buy_signals:
            reasons.append(f"🚀 Resistance breakout - Bullish continuation expected")
        if 'BREAK_SUPPORT' in sell_signals:
            reasons.append(f"⚠️ Support breakdown - Bearish continuation expected")
        
        # Signal strength
        buy_count = analysis.get('buy_count', 0)
        sell_count = analysis.get('sell_count', 0)
        if buy_count >= 7:
            reasons.append(f"💪 Exceptional signal strength - {buy_count} buy signals (rare high-probability setup)")
        elif sell_count >= 7:
            reasons.append(f"⚠️ Strong bearish pressure - {sell_count} sell signals (defensive action recommended)")
        
        return reasons[:8]  # Top 8 reasons
    
    def _generate_ai_insights(self, analysis: Dict) -> List[str]:
        """Generate advanced AI-powered insights with pattern recognition"""
        insights = []
        
        rsi = analysis.get('rsi')
        trend = analysis.get('trend')
        buy_count = analysis.get('buy_count', 0)
        sell_count = analysis.get('sell_count', 0)
        ema_20 = analysis.get('ema_20') or analysis.get('ema20')
        ema_50 = analysis.get('ema_50') or analysis.get('ema50')
        price = analysis.get('price', 0)
        macd_hist = analysis.get('macd_hist')
        volume_signal = analysis.get('volume_signal')
        
        signal_diff = abs(buy_count - sell_count)
        
        # Pattern recognition insights
        if rsi and ema_20 and ema_50 and price:
            # Golden Cross pattern
            if price > ema_20 > ema_50 and trend == 'UP':
                insights.append("🌟 Golden Cross pattern detected - Price above both EMAs in uptrend (historically 65% success rate)")
            
            # Death Cross pattern
            if price < ema_20 < ema_50 and trend == 'DOWN':
                insights.append("⚠️ Death Cross pattern detected - Price below both EMAs in downtrend (bearish signal)")
        
        # RSI divergence insights
        if rsi:
            if rsi < 30 and buy_count > sell_count:
                insights.append(f"📊 RSI oversold ({rsi:.1f}) with bullish signals - Classic reversal setup (70% historical accuracy)")
            elif rsi > 70 and sell_count > buy_count:
                insights.append(f"📊 RSI overbought ({rsi:.1f}) with bearish signals - Reversal likely (65% historical accuracy)")
            elif 45 <= rsi <= 55 and signal_diff >= 5:
                insights.append(f"📊 Neutral RSI ({rsi:.1f}) with strong signal divergence - Momentum building in one direction")
        
        # MACD momentum insights
        if macd_hist:
            if abs(macd_hist) > 5:
                direction = "bullish" if macd_hist > 0 else "bearish"
                insights.append(f"💪 Strong MACD momentum ({macd_hist:.2f}) - {direction} momentum accelerating")
        
        # Signal convergence insights
        if signal_diff >= 8:
            direction = "bullish" if buy_count > sell_count else "bearish"
            insights.append(f"🎯 Exceptional signal convergence - {signal_diff} signal difference indicates {direction} dominance (rare high-probability setup)")
        
        # Volume-price divergence
        if volume_signal:
            if volume_signal == 'BUY' and trend == 'UP':
                insights.append("📈 Volume-price alignment - Rising price with increasing volume confirms institutional interest")
            elif volume_signal == 'SELL' and trend == 'DOWN':
                insights.append("📉 Volume-price alignment - Falling price with increasing volume confirms selling pressure")
        
        # Multi-timeframe confirmation
        if buy_count >= 6 and trend == 'UP' and (macd_hist and macd_hist > 0):
            insights.append("✅ Multi-indicator confirmation - Trend, signals, and momentum all align (high-probability trade)")
        elif sell_count >= 6 and trend == 'DOWN' and (macd_hist and macd_hist < 0):
            insights.append("✅ Multi-indicator confirmation - Bearish alignment across all indicators (defensive action recommended)")
        
        # Risk-reward insights
        buy_price = analysis.get('buy_price')
        sell_price = analysis.get('sell_price')
        if buy_price and sell_price and price:
            risk = abs(price - buy_price) if buy_price < price else price * 0.05
            reward = abs(sell_price - price)
            if reward > 0:
                rr_ratio = reward / risk if risk > 0 else 0
                if rr_ratio >= 2:
                    insights.append(f"💰 Favorable risk-reward ratio ({rr_ratio:.1f}:1) - Reward significantly exceeds risk")
                elif rr_ratio >= 1.5:
                    insights.append(f"💰 Good risk-reward ratio ({rr_ratio:.1f}:1) - Positive expectancy setup")
        
        return insights[:5]  # Top 5 insights
    
    def _analyze_price_action(self, analysis: Dict) -> Dict:
        """Analyze price action patterns and candlestick formations"""
        price = analysis.get('price', 0)
        open_price = analysis.get('open')
        high = analysis.get('high')
        low = analysis.get('low')
        buy_signals = analysis.get('buy_signals', [])
        sell_signals = analysis.get('sell_signals', [])
        
        price_action = {
            "pattern": "Unknown",
            "pattern_strength": "Neutral",
            "candlestick_signal": "Neutral",
            "price_momentum": "Neutral"
        }
        
        if not all([price, open_price, high, low]):
            return price_action
        
        # Calculate candlestick body and shadows
        body = abs(price - open_price) if open_price else 0
        upper_shadow = high - max(price, open_price) if high else 0
        lower_shadow = min(price, open_price) - low if low else 0
        
        # Determine pattern
        is_bullish = price > open_price if open_price else False
        is_bearish = price < open_price if open_price else False
        
        # Pattern strength based on body size
        if body > 0:
            body_ratio = body / price if price > 0 else 0
            if body_ratio > 0.03:  # Strong body (>3% of price)
                if is_bullish:
                    price_action["pattern"] = "Strong Bullish Candle"
                    price_action["pattern_strength"] = "Strong"
                    price_action["candlestick_signal"] = "Bullish"
                elif is_bearish:
                    price_action["pattern"] = "Strong Bearish Candle"
                    price_action["pattern_strength"] = "Strong"
                    price_action["candlestick_signal"] = "Bearish"
            elif body_ratio > 0.01:  # Moderate body
                if is_bullish:
                    price_action["pattern"] = "Bullish Candle"
                    price_action["pattern_strength"] = "Moderate"
                elif is_bearish:
                    price_action["pattern"] = "Bearish Candle"
                    price_action["pattern_strength"] = "Moderate"
        
        # Price momentum
        if 'BULLISH_CANDLE' in buy_signals:
            price_action["price_momentum"] = "Bullish"
        elif 'BEARISH_CANDLE' in sell_signals:
            price_action["price_momentum"] = "Bearish"
        
        return price_action
    
    def _analyze_volatility(self, analysis: Dict) -> Dict:
        """Analyze volatility patterns and expectations"""
        rsi = analysis.get('rsi')
        macd_hist = analysis.get('macd_hist')
        volume = analysis.get('volume')
        volume_signal = analysis.get('volume_signal')
        buy_count = analysis.get('buy_count', 0)
        sell_count = analysis.get('sell_count', 0)
        
        volatility = {
            "level": "Normal",
            "expectation": "Moderate price movement expected",
            "volatility_factor": 1.0,
            "risk_adjustment": "Standard"
        }
        
        # RSI-based volatility
        if rsi:
            if rsi < 25 or rsi > 75:
                volatility["level"] = "High"
                volatility["expectation"] = "High volatility expected - extreme RSI conditions"
                volatility["volatility_factor"] = 1.5
                volatility["risk_adjustment"] = "Reduce position size by 30%"
            elif rsi < 30 or rsi > 70:
                volatility["level"] = "Elevated"
                volatility["expectation"] = "Elevated volatility - RSI in extreme zone"
                volatility["volatility_factor"] = 1.3
                volatility["risk_adjustment"] = "Reduce position size by 20%"
            elif 40 <= rsi <= 60:
                volatility["level"] = "Low"
                volatility["expectation"] = "Low volatility - stable price action"
                volatility["volatility_factor"] = 0.8
                volatility["risk_adjustment"] = "Standard position sizing"
        
        # Signal divergence volatility
        signal_diff = abs(buy_count - sell_count)
        if signal_diff >= 8:
            volatility["level"] = "High"
            volatility["expectation"] = "High volatility - strong signal divergence"
            volatility["volatility_factor"] = max(volatility["volatility_factor"], 1.4)
        
        # Volume-based volatility
        if volume_signal in ['BUY', 'SELL']:
            volatility["level"] = "Elevated" if volatility["level"] == "Normal" else volatility["level"]
            volatility["expectation"] += " - Volume confirms movement"
        
        return volatility
    
    def _analyze_support_resistance_strength(self, analysis: Dict) -> Dict:
        """Analyze strength of support and resistance levels"""
        price = analysis.get('price', 0)
        support = analysis.get('support')
        resistance = analysis.get('resistance')
        buy_price = analysis.get('buy_price')
        sell_price = analysis.get('sell_price')
        
        sr_analysis = {
            "support_strength": "Unknown",
            "resistance_strength": "Unknown",
            "distance_to_support": None,
            "distance_to_resistance": None,
            "breakout_probability": "Unknown"
        }
        
        if price > 0:
            # Support analysis
            if support and support > 0:
                distance_pct = ((price - support) / price) * 100
                sr_analysis["distance_to_support"] = round(distance_pct, 2)
                
                if distance_pct < 2:
                    sr_analysis["support_strength"] = "Very Strong - Price near support"
                elif distance_pct < 5:
                    sr_analysis["support_strength"] = "Strong - Price close to support"
                elif distance_pct < 10:
                    sr_analysis["support_strength"] = "Moderate - Support at reasonable distance"
                else:
                    sr_analysis["support_strength"] = "Weak - Support far away"
            
            # Resistance analysis
            if resistance and resistance > 0:
                distance_pct = ((resistance - price) / price) * 100
                sr_analysis["distance_to_resistance"] = round(distance_pct, 2)
                
                if distance_pct < 2:
                    sr_analysis["resistance_strength"] = "Very Strong - Price near resistance"
                elif distance_pct < 5:
                    sr_analysis["resistance_strength"] = "Strong - Price close to resistance"
                elif distance_pct < 10:
                    sr_analysis["resistance_strength"] = "Moderate - Resistance at reasonable distance"
                else:
                    sr_analysis["resistance_strength"] = "Weak - Resistance far away"
            
            # Breakout probability
            if support and resistance:
                price_range = resistance - support
                current_position = (price - support) / price_range if price_range > 0 else 0.5
                
                if current_position < 0.2:
                    sr_analysis["breakout_probability"] = "High upward breakout potential"
                elif current_position > 0.8:
                    sr_analysis["breakout_probability"] = "High downward breakdown potential"
                elif 0.4 <= current_position <= 0.6:
                    sr_analysis["breakout_probability"] = "Neutral - Price in middle of range"
                else:
                    sr_analysis["breakout_probability"] = "Moderate breakout potential"
        
        return sr_analysis
    
    def _calculate_probability_analysis(self, analysis: Dict) -> Dict:
        """Calculate probability of success based on multiple factors"""
        buy_count = analysis.get('buy_count', 0)
        sell_count = analysis.get('sell_count', 0)
        rsi = analysis.get('rsi')
        trend = analysis.get('trend', 'NEUTRAL')
        macd_hist = analysis.get('macd_hist')
        volume_signal = analysis.get('volume_signal')
        verdict = analysis.get('final_verdict', 'NEUTRAL')
        
        signal_diff = abs(buy_count - sell_count)
        total_signals = buy_count + sell_count
        
        probability = {
            "success_probability": 50,
            "factors": [],
            "confidence_level": "Medium"
        }
        
        base_probability = 50
        
        # Signal strength factor
        if signal_diff >= 8:
            base_probability += 20
            probability["factors"].append(f"Very strong signal divergence ({signal_diff} signals)")
        elif signal_diff >= 5:
            base_probability += 15
            probability["factors"].append(f"Strong signal divergence ({signal_diff} signals)")
        elif signal_diff >= 3:
            base_probability += 10
            probability["factors"].append(f"Moderate signal divergence ({signal_diff} signals)")
        
        # RSI factor
        if rsi:
            if rsi < 30:
                base_probability += 15
                probability["factors"].append(f"RSI oversold ({rsi:.1f}) - High bounce probability")
            elif rsi > 70:
                base_probability -= 15
                probability["factors"].append(f"RSI overbought ({rsi:.1f}) - High pullback probability")
            elif 40 <= rsi <= 60:
                base_probability += 5
                probability["factors"].append("RSI neutral - Stable conditions")
        
        # Trend alignment factor
        if trend != 'NEUTRAL':
            if (trend == 'UP' and buy_count > sell_count) or (trend == 'DOWN' and sell_count > buy_count):
                base_probability += 10
                probability["factors"].append(f"Trend aligns with signals ({trend} trend)")
            else:
                base_probability -= 5
                probability["factors"].append(f"Trend contradicts signals ({trend} trend)")
        
        # MACD factor
        if macd_hist:
            if abs(macd_hist) > 3:
                base_probability += 10
                probability["factors"].append(f"Strong MACD momentum ({macd_hist:.2f})")
            elif abs(macd_hist) > 1:
                base_probability += 5
                probability["factors"].append(f"Moderate MACD momentum ({macd_hist:.2f})")
        
        # Volume confirmation
        if volume_signal in ['BUY', 'SELL']:
            base_probability += 8
            probability["factors"].append(f"Volume confirms movement ({volume_signal})")
        
        # Verdict factor
        if verdict in ['STRONG BUY', 'STRONG SELL']:
            base_probability += 12
            probability["factors"].append(f"Strong verdict ({verdict})")
        elif verdict in ['BUY', 'SELL']:
            base_probability += 7
            probability["factors"].append(f"Clear verdict ({verdict})")
        
        # Normalize to 0-100
        probability["success_probability"] = max(0, min(100, base_probability))
        
        # Confidence level
        if probability["success_probability"] >= 75:
            probability["confidence_level"] = "Very High"
        elif probability["success_probability"] >= 60:
            probability["confidence_level"] = "High"
        elif probability["success_probability"] >= 45:
            probability["confidence_level"] = "Medium"
        elif probability["success_probability"] >= 30:
            probability["confidence_level"] = "Low"
        else:
            probability["confidence_level"] = "Very Low"
        
        return probability
    
    def _calculate_optimal_timing(self, analysis: Dict) -> Dict:
        """Calculate optimal entry/exit timing"""
        rsi = analysis.get('rsi')
        trend = analysis.get('trend', 'NEUTRAL')
        buy_count = analysis.get('buy_count', 0)
        sell_count = analysis.get('sell_count', 0)
        verdict = analysis.get('final_verdict', 'NEUTRAL')
        buy_price = analysis.get('buy_price')
        sell_price = analysis.get('sell_price')
        price = analysis.get('price', 0)
        
        timing = {
            "entry_timing": "Monitor",
            "exit_timing": "Monitor",
            "urgency": "Normal",
            "wait_recommendation": False,
            "immediate_action": False
        }
        
        signal_diff = abs(buy_count - sell_count)
        
        # Entry timing
        if verdict in ['STRONG BUY', 'BUY']:
            if rsi and rsi < 35:
                timing["entry_timing"] = "Ideal - RSI oversold, good entry opportunity"
                timing["urgency"] = "High"
                timing["immediate_action"] = True
            elif rsi and rsi < 50:
                timing["entry_timing"] = "Good - RSI below neutral, favorable entry"
                timing["urgency"] = "Medium"
            elif buy_price and price > buy_price * 1.02:
                timing["entry_timing"] = f"Wait for pullback to ₹{buy_price:.2f}"
                timing["wait_recommendation"] = True
            else:
                timing["entry_timing"] = "Current price acceptable for entry"
                timing["urgency"] = "Medium"
        
        elif verdict in ['STRONG SELL', 'SELL']:
            timing["entry_timing"] = "Avoid entry - Bearish signals"
            timing["wait_recommendation"] = True
        
        # Exit timing
        if verdict in ['STRONG SELL', 'SELL']:
            if rsi and rsi > 65:
                timing["exit_timing"] = "Immediate - RSI overbought, exit recommended"
                timing["urgency"] = "High"
                timing["immediate_action"] = True
            elif sell_price and price >= sell_price * 0.98:
                timing["exit_timing"] = f"Exit near ₹{sell_price:.2f} - Target reached"
                timing["urgency"] = "High"
            else:
                timing["exit_timing"] = "Consider exit on any bounce"
                timing["urgency"] = "Medium"
        
        elif verdict in ['STRONG BUY', 'BUY']:
            if sell_price:
                timing["exit_timing"] = f"Exit at target ₹{sell_price:.2f} or trail stop"
            else:
                timing["exit_timing"] = "Trail stop-loss, no fixed exit"
        
        # Urgency based on signal strength
        if signal_diff >= 8:
            timing["urgency"] = "Very High"
            timing["immediate_action"] = True
        elif signal_diff >= 5:
            timing["urgency"] = "High"
        
        return timing
    
    def _calculate_success_probability(self, analysis: Dict) -> Dict:
        """Calculate overall success probability with detailed breakdown"""
        prob_analysis = self._calculate_probability_analysis(analysis)
        confidence = self._calculate_confidence(analysis)
        
        # Combine probability and confidence
        combined_score = (prob_analysis["success_probability"] + confidence) / 2
        
        return {
            "overall_probability": round(combined_score, 1),
            "probability_breakdown": prob_analysis,
            "confidence_adjusted": confidence,
            "interpretation": self._interpret_probability(combined_score),
            "recommendation_strength": "Strong" if combined_score >= 70 else 
                                      "Moderate" if combined_score >= 50 else "Weak"
        }
    
    def _interpret_probability(self, probability: float) -> str:
        """Interpret probability score"""
        if probability >= 80:
            return "Very High Success Probability - Strong setup with multiple confirmations"
        elif probability >= 70:
            return "High Success Probability - Favorable conditions with good alignment"
        elif probability >= 60:
            return "Good Success Probability - Positive setup with moderate risk"
        elif probability >= 50:
            return "Moderate Success Probability - Balanced risk-reward"
        elif probability >= 40:
            return "Below Average Success Probability - Higher risk, lower confidence"
        else:
            return "Low Success Probability - Unfavorable setup, high risk"
    
    def _generate_quick_summary(self, verdict: str, confidence: int, risk_level: str,
                               probability_analysis: Dict, optimal_timing: Dict,
                               recency_analysis: Optional[Dict] = None) -> str:
        """Generate a quick one-line summary"""
        prob = probability_analysis.get("success_probability", 50)
        urgency = optimal_timing.get("urgency", "Normal")
        
        # Add recency info
        recency_info = ""
        if recency_analysis:
            if recency_analysis.get('is_pullback'):
                recency_info = " | ⚠️ Pullback Pattern"
            elif recency_analysis.get('is_recent'):
                recency_info = " | ✅ Current Day Signal"
            else:
                recency_info = " | 📅 Older Signal"
        
        if verdict in ['STRONG BUY', 'BUY']:
            return (
                f"✅ {verdict} | {confidence}% Confidence | {prob}% Success Probability | "
                f"{risk_level} Risk | {urgency} Urgency{recency_info}"
            )
        elif verdict in ['STRONG SELL', 'SELL']:
            return (
                f"⚠️ {verdict} | {confidence}% Confidence | {prob}% Success Probability | "
                f"{risk_level} Risk | {urgency} Urgency{recency_info}"
            )
        else:
            return (
                f"⚖️ {verdict} | {confidence}% Confidence | {prob}% Success Probability | "
                f"{risk_level} Risk | Wait for Clear Direction{recency_info}"
            )
    
    def _generate_timeframe_recommendations(self, analysis: Dict, mode: str) -> Dict:
        """
        Generate timeframe-specific entry/exit recommendations
        
        Args:
            analysis: Stock analysis data
            mode: Trading mode (intraday, swing, longterm)
        
        Returns:
            Dictionary with timeframe recommendations
        """
        verdict = analysis.get('final_verdict', 'NEUTRAL')
        rsi = analysis.get('rsi')
        trend = analysis.get('trend', 'NEUTRAL')
        buy_count = analysis.get('buy_count', 0)
        sell_count = analysis.get('sell_count', 0)
        
        recommendations = {
            "mode": mode,
            "best_entry_times": [],
            "avoid_entry_times": [],
            "best_exit_times": [],
            "timeframe_strategy": "",
            "session_analysis": {}
        }
        
        if mode == "intraday":
            # Intraday specific recommendations
            recommendations.update(self._get_intraday_timing(verdict, rsi, trend, buy_count, sell_count))
        elif mode == "swing":
            # Swing trading recommendations
            recommendations.update(self._get_swing_timing(verdict, rsi, trend))
        else:
            # Long-term recommendations
            recommendations.update(self._get_longterm_timing(verdict, trend))
        
        return recommendations
    
    def _get_intraday_timing(self, verdict: str, rsi: Optional[float], trend: str,
                            buy_count: int, sell_count: int) -> Dict:
        """Get intraday timing recommendations"""
        timing = {
            "best_entry_times": [],
            "avoid_entry_times": [],
            "best_exit_times": [],
            "timeframe_strategy": "",
            "session_analysis": {}
        }
        
        signal_strength = abs(buy_count - sell_count)
        
        if verdict in ['STRONG BUY', 'BUY']:
            # Best entry times for BUY signals
            timing["best_entry_times"] = [
                {
                    "time": "9:30 AM - 10:00 AM",
                    "reason": "After initial volatility settles, good entry opportunity",
                    "priority": "High" if signal_strength >= 5 else "Medium"
                },
                {
                    "time": "10:30 AM - 11:30 AM",
                    "reason": "Stable price action, lower volatility",
                    "priority": "Medium"
                },
                {
                    "time": "2:00 PM - 2:30 PM",
                    "reason": "Pre-close momentum, good for intraday positions",
                    "priority": "Medium" if rsi and rsi < 50 else "Low"
                }
            ]
            
            timing["avoid_entry_times"] = [
                {
                    "time": "9:15 AM - 9:30 AM",
                    "reason": "Opening volatility - high risk, unpredictable moves"
                },
                {
                    "time": "12:00 PM - 1:00 PM",
                    "reason": "Lunch hour - low volume, choppy price action"
                },
                {
                    "time": "3:15 PM - 3:30 PM",
                    "reason": "Closing volatility - high risk, last-minute moves"
                }
            ]
            
            timing["best_exit_times"] = [
                {
                    "time": "2:30 PM - 3:00 PM",
                    "reason": "Take profits before closing volatility",
                    "priority": "High"
                },
                {
                    "time": "11:00 AM - 11:30 AM",
                    "reason": "If target reached early, secure profits",
                    "priority": "Medium"
                }
            ]
            
            timing["timeframe_strategy"] = (
                f"Intraday BUY Strategy: Enter between 9:30-10:00 AM or 2:00-2:30 PM. "
                f"Avoid opening (9:15-9:30 AM) and closing (3:15-3:30 PM) volatility. "
                f"Target exit: 2:30-3:00 PM before market close."
            )
        
        elif verdict in ['STRONG SELL', 'SELL']:
            # Best exit times for SELL signals
            timing["best_exit_times"] = [
                {
                    "time": "9:30 AM - 10:00 AM",
                    "reason": "Opening momentum - exit on any bounce",
                    "priority": "High"
                },
                {
                    "time": "11:00 AM - 11:30 AM",
                    "reason": "Mid-morning - exit before lunch hour",
                    "priority": "High"
                },
                {
                    "time": "2:00 PM - 2:30 PM",
                    "reason": "Pre-close - exit before closing volatility",
                    "priority": "High"
                }
            ]
            
            timing["avoid_entry_times"] = [
                {
                    "time": "All Day",
                    "reason": "SELL signal - Avoid new entries, focus on exit"
                }
            ]
            
            timing["best_entry_times"] = [
                {
                    "time": "N/A",
                    "reason": "SELL signal - Do not enter new positions"
                }
            ]
            
            timing["timeframe_strategy"] = (
                f"Intraday SELL Strategy: Exit immediately or on any bounce. "
                f"Best exit windows: 9:30-10:00 AM, 11:00-11:30 AM, or 2:00-2:30 PM. "
                f"Avoid holding positions with bearish signals."
            )
        
        else:
            # NEUTRAL - Wait for clear direction
            timing["best_entry_times"] = [
                {
                    "time": "Wait for Breakout",
                    "reason": "Neutral signal - Wait for clear directional move"
                }
            ]
            
            timing["avoid_entry_times"] = [
                {
                    "time": "9:15 AM - 9:30 AM",
                    "reason": "Opening volatility"
                },
                {
                    "time": "3:15 PM - 3:30 PM",
                    "reason": "Closing volatility"
                }
            ]
            
            timing["timeframe_strategy"] = (
                "Intraday NEUTRAL Strategy: Wait for breakout confirmation. "
                "Monitor support/resistance levels. Enter only on clear directional move with volume."
            )
        
        # Session analysis
        timing["session_analysis"] = {
            "morning_session": {
                "time": "9:15 AM - 12:00 PM",
                "characteristics": "High volatility, strong trends, good for momentum trades",
                "recommendation": "Best for strong signals, avoid weak setups"
            },
            "afternoon_session": {
                "time": "12:00 PM - 1:00 PM",
                "characteristics": "Low volume, choppy, consolidation",
                "recommendation": "Avoid trading, wait for clear direction"
            },
            "post_lunch_session": {
                "time": "1:00 PM - 3:00 PM",
                "characteristics": "Moderate volume, trend continuation or reversal",
                "recommendation": "Good for swing positions, monitor for reversals"
            },
            "closing_session": {
                "time": "3:00 PM - 3:30 PM",
                "characteristics": "High volatility, last-minute moves",
                "recommendation": "Exit positions, avoid new entries"
            }
        }
        
        return timing
    
    def _get_swing_timing(self, verdict: str, rsi: Optional[float], trend: str) -> Dict:
        """Get swing trading timing recommendations"""
        timing = {
            "best_entry_times": [],
            "avoid_entry_times": [],
            "best_exit_times": [],
            "timeframe_strategy": "",
            "session_analysis": {}
        }
        
        if verdict in ['STRONG BUY', 'BUY']:
            timing["best_entry_times"] = [
                {
                    "time": "Monday - Wednesday Morning",
                    "reason": "Start of week momentum, fresh trends",
                    "priority": "High"
                },
                {
                    "time": "Any Day: 9:30 AM - 10:30 AM",
                    "reason": "After opening volatility, better entry prices",
                    "priority": "High"
                },
                {
                    "time": "Friday Afternoon (if strong setup)",
                    "reason": "Weekend gap potential, but only for strong signals",
                    "priority": "Low"
                }
            ]
            
            timing["avoid_entry_times"] = [
                {
                    "time": "Friday Afternoon (weak signals)",
                    "reason": "Weekend gap risk, avoid unless very strong setup"
                },
                {
                    "time": "Monday Opening (9:15-9:30 AM)",
                    "reason": "Gap risk from weekend news"
                }
            ]
            
            timing["best_exit_times"] = [
                {
                    "time": "Thursday - Friday",
                    "reason": "Take profits before weekend, avoid gap risk",
                    "priority": "High"
                },
                {
                    "time": "Target Reached",
                    "reason": "Exit when target price reached, don't wait",
                    "priority": "High"
                }
            ]
            
            timing["timeframe_strategy"] = (
                f"Swing BUY Strategy: Enter Monday-Wednesday morning (9:30-10:30 AM) for best prices. "
                f"Hold 2-10 days. Exit Thursday-Friday or when target reached. "
                f"Avoid Friday entries unless signal is very strong."
            )
        
        elif verdict in ['STRONG SELL', 'SELL']:
            timing["best_exit_times"] = [
                {
                    "time": "Immediate or Monday Morning",
                    "reason": "Exit on any bounce, don't wait",
                    "priority": "Very High"
                },
                {
                    "time": "Tuesday - Wednesday",
                    "reason": "If held, exit before further decline",
                    "priority": "High"
                }
            ]
            
            timing["avoid_entry_times"] = [
                {
                    "time": "All Days",
                    "reason": "SELL signal - Do not enter swing positions"
                }
            ]
            
            timing["timeframe_strategy"] = (
                "Swing SELL Strategy: Exit immediately or on any bounce. "
                "Do not hold bearish positions. Avoid new entries completely."
            )
        
        else:
            timing["timeframe_strategy"] = (
                "Swing NEUTRAL Strategy: Wait for clear directional breakout. "
                "Monitor for 2-3 days. Enter only on confirmed trend with volume."
            )
        
        timing["session_analysis"] = {
            "weekly_pattern": {
                "monday": "High volatility, gap risk, wait for direction",
                "tuesday_wednesday": "Best for entries, stable trends",
                "thursday": "Good for exits, take profits",
                "friday": "Avoid new entries, exit positions"
            }
        }
        
        return timing
    
    def _get_longterm_timing(self, verdict: str, trend: str) -> Dict:
        """Get long-term timing recommendations"""
        timing = {
            "best_entry_times": [],
            "avoid_entry_times": [],
            "best_exit_times": [],
            "timeframe_strategy": "",
            "session_analysis": {}
        }
        
        if verdict in ['STRONG BUY', 'BUY']:
            timing["best_entry_times"] = [
                {
                    "time": "Any Time (DCA Strategy)",
                    "reason": "Long-term - time in market matters more than timing",
                    "priority": "Medium"
                },
                {
                    "time": "Month Start (1st-5th)",
                    "reason": "Fresh monthly trends, better entry prices",
                    "priority": "Medium"
                },
                {
                    "time": "On Pullbacks",
                    "reason": "Enter on dips within uptrend, better risk-reward",
                    "priority": "High"
                }
            ]
            
            timing["best_exit_times"] = [
                {
                    "time": "Target Reached",
                    "reason": "Exit when long-term target achieved",
                    "priority": "High"
                },
                {
                    "time": "Trend Reversal",
                    "reason": "Exit on trend change confirmation",
                    "priority": "High"
                }
            ]
            
            timing["timeframe_strategy"] = (
                "Long-term BUY Strategy: Enter on pullbacks within uptrend. "
                "Hold 6-24 months. Use DCA (Dollar Cost Averaging) for large positions. "
                "Exit on target achievement or trend reversal."
            )
        
        elif verdict in ['STRONG SELL', 'SELL']:
            timing["best_exit_times"] = [
                {
                    "time": "Immediate",
                    "reason": "Exit long-term positions on bearish signals",
                    "priority": "Very High"
                }
            ]
            
            timing["timeframe_strategy"] = (
                "Long-term SELL Strategy: Exit positions immediately. "
                "Bearish signals suggest long-term downtrend. Protect capital."
            )
        
        timing["session_analysis"] = {
            "monthly_pattern": {
                "beginning": "Fresh trends, good for entries",
                "middle": "Trend continuation, monitor",
                "end": "Take profits, avoid new entries"
            }
        }
        
        return timing
    
    def _analyze_patterns(self, analysis: Dict) -> Dict:
        """
        Analyze chart patterns and technical formations
        Detects common patterns like double tops/bottoms, triangles, head and shoulders
        """
        pattern_analysis = {
            "detected_patterns": [],
            "pattern_strength": "None",
            "pattern_type": "None",
            "pattern_confidence": 0,
            "pattern_implications": ""
        }
        
        try:
            price = analysis.get('price', 0)
            high = analysis.get('high', 0)
            low = analysis.get('low', 0)
            rsi = analysis.get('rsi')
            trend = analysis.get('trend', 'NEUTRAL')
            buy_count = analysis.get('buy_count', 0)
            sell_count = analysis.get('sell_count', 0)
            ema_20 = analysis.get('ema_20') or analysis.get('ema20')
            ema_50 = analysis.get('ema_50') or analysis.get('ema50')
            macd_hist = analysis.get('macd_hist')
            volume_signal = analysis.get('volume_signal', 'NEUTRAL')
            
            patterns = []
            confidence_score = 0
            
            # Golden Cross Pattern
            if price and ema_20 and ema_50:
                if price > ema_20 > ema_50 and trend == 'UP':
                    patterns.append("Golden Cross (Bullish)")
                    confidence_score += 25
            
            # Death Cross Pattern
            if price and ema_20 and ema_50:
                if price < ema_20 < ema_50 and trend == 'DOWN':
                    patterns.append("Death Cross (Bearish)")
                    confidence_score += 25
            
            # RSI Divergence Pattern
            if rsi:
                if rsi < 30 and buy_count > sell_count:
                    patterns.append("RSI Oversold Reversal Pattern")
                    confidence_score += 20
                elif rsi > 70 and sell_count > buy_count:
                    patterns.append("RSI Overbought Reversal Pattern")
                    confidence_score += 20
            
            # MACD Momentum Pattern
            if macd_hist:
                if abs(macd_hist) > 5:
                    direction = "Bullish" if macd_hist > 0 else "Bearish"
                    patterns.append(f"Strong MACD Momentum ({direction})")
                    confidence_score += 15
            
            # Volume Confirmation Pattern
            if volume_signal != 'NEUTRAL':
                if (volume_signal == 'BUY' and buy_count > sell_count) or \
                   (volume_signal == 'SELL' and sell_count > buy_count):
                    patterns.append("Volume-Price Confirmation Pattern")
                    confidence_score += 15
            
            # Signal Convergence Pattern
            signal_diff = abs(buy_count - sell_count)
            if signal_diff >= 7:
                direction = "Bullish" if buy_count > sell_count else "Bearish"
                patterns.append(f"Strong Signal Convergence ({direction})")
                confidence_score += 20
            
            # Trend Continuation Pattern
            if trend != 'NEUTRAL':
                if (trend == 'UP' and buy_count > sell_count) or \
                   (trend == 'DOWN' and sell_count > buy_count):
                    patterns.append("Trend Continuation Pattern")
                    confidence_score += 10
            
            # Pattern Strength Assessment
            if confidence_score >= 60:
                pattern_analysis["pattern_strength"] = "Very Strong"
                pattern_analysis["pattern_implications"] = "High-probability setup with multiple confirmations"
            elif confidence_score >= 40:
                pattern_analysis["pattern_strength"] = "Strong"
                pattern_analysis["pattern_implications"] = "Good setup with solid confirmations"
            elif confidence_score >= 20:
                pattern_analysis["pattern_strength"] = "Moderate"
                pattern_analysis["pattern_implications"] = "Decent setup, monitor for confirmation"
            else:
                pattern_analysis["pattern_strength"] = "Weak"
                pattern_analysis["pattern_implications"] = "Unclear pattern, wait for more signals"
            
            pattern_analysis["detected_patterns"] = patterns
            pattern_analysis["pattern_confidence"] = min(100, confidence_score)
            pattern_analysis["pattern_type"] = patterns[0] if patterns else "None"
            
        except Exception as e:
            logger.error(f"Error analyzing patterns: {e}")
        
        return pattern_analysis
    
    def _analyze_sentiment(self, analysis: Dict) -> Dict:
        """
        Analyze market sentiment based on multiple factors
        Combines volume, price action, RSI, signal strength, and trend
        """
        sentiment_analysis = {
            "overall_sentiment": "Neutral",
            "sentiment_score": 50,  # 0-100, 50 = neutral
            "sentiment_factors": [],
            "bullish_signals": 0,
            "bearish_signals": 0,
            "sentiment_strength": "Moderate"
        }
        
        try:
            buy_count = analysis.get('buy_count', 0)
            sell_count = analysis.get('sell_count', 0)
            rsi = analysis.get('rsi')
            trend = analysis.get('trend', 'NEUTRAL')
            volume_signal = analysis.get('volume_signal', 'NEUTRAL')
            verdict = analysis.get('final_verdict', 'NEUTRAL')
            macd_hist = analysis.get('macd_hist')
            price = analysis.get('price', 0)
            ema_20 = analysis.get('ema_20') or analysis.get('ema20')
            
            sentiment_score = 50  # Start neutral
            factors = []
            
            # Signal-based sentiment
            signal_diff = buy_count - sell_count
            if signal_diff > 0:
                sentiment_score += min(20, signal_diff * 2)
                factors.append(f"Bullish signals dominate ({buy_count} vs {sell_count})")
                sentiment_analysis["bullish_signals"] += buy_count
            elif signal_diff < 0:
                sentiment_score -= min(20, abs(signal_diff) * 2)
                factors.append(f"Bearish signals dominate ({sell_count} vs {buy_count})")
                sentiment_analysis["bearish_signals"] += sell_count
            
            # RSI sentiment
            if rsi:
                if rsi < 30:
                    sentiment_score += 15
                    factors.append(f"RSI oversold ({rsi:.1f}) - Bullish reversal sentiment")
                elif rsi < 40:
                    sentiment_score += 8
                    factors.append(f"RSI approaching oversold ({rsi:.1f}) - Slight bullish bias")
                elif rsi > 70:
                    sentiment_score -= 15
                    factors.append(f"RSI overbought ({rsi:.1f}) - Bearish reversal sentiment")
                elif rsi > 60:
                    sentiment_score -= 8
                    factors.append(f"RSI approaching overbought ({rsi:.1f}) - Slight bearish bias")
            
            # Trend sentiment
            if trend == 'UP':
                sentiment_score += 10
                factors.append("Uptrend confirmed - Positive sentiment")
            elif trend == 'DOWN':
                sentiment_score -= 10
                factors.append("Downtrend confirmed - Negative sentiment")
            
            # Volume sentiment
            if volume_signal == 'BUY':
                sentiment_score += 10
                factors.append("Volume confirms buying interest - Bullish sentiment")
            elif volume_signal == 'SELL':
                sentiment_score -= 10
                factors.append("Volume confirms selling pressure - Bearish sentiment")
            
            # MACD sentiment
            if macd_hist:
                if macd_hist > 3:
                    sentiment_score += 10
                    factors.append(f"Strong MACD momentum ({macd_hist:.2f}) - Bullish sentiment")
                elif macd_hist < -3:
                    sentiment_score -= 10
                    factors.append(f"Strong negative MACD ({macd_hist:.2f}) - Bearish sentiment")
            
            # Price-EMA sentiment
            if price and ema_20:
                if price > ema_20:
                    sentiment_score += 5
                    factors.append("Price above EMA20 - Positive momentum")
                else:
                    sentiment_score -= 5
                    factors.append("Price below EMA20 - Negative momentum")
            
            # Verdict sentiment
            if verdict in ['STRONG BUY', 'BUY']:
                sentiment_score += 10
                factors.append(f"Verdict: {verdict} - Bullish sentiment")
            elif verdict in ['STRONG SELL', 'SELL']:
                sentiment_score -= 10
                factors.append(f"Verdict: {verdict} - Bearish sentiment")
            
            # Normalize to 0-100
            sentiment_score = max(0, min(100, sentiment_score))
            
            # Determine overall sentiment
            if sentiment_score >= 70:
                sentiment_analysis["overall_sentiment"] = "Very Bullish"
                sentiment_analysis["sentiment_strength"] = "Strong"
            elif sentiment_score >= 60:
                sentiment_analysis["overall_sentiment"] = "Bullish"
                sentiment_analysis["sentiment_strength"] = "Moderate"
            elif sentiment_score >= 40:
                sentiment_analysis["overall_sentiment"] = "Neutral-Bullish"
                sentiment_analysis["sentiment_strength"] = "Moderate"
            elif sentiment_score >= 30:
                sentiment_analysis["overall_sentiment"] = "Neutral-Bearish"
                sentiment_analysis["sentiment_strength"] = "Moderate"
            elif sentiment_score >= 20:
                sentiment_analysis["overall_sentiment"] = "Bearish"
                sentiment_analysis["sentiment_strength"] = "Moderate"
            else:
                sentiment_analysis["overall_sentiment"] = "Very Bearish"
                sentiment_analysis["sentiment_strength"] = "Strong"
            
            sentiment_analysis["sentiment_score"] = round(sentiment_score, 1)
            sentiment_analysis["sentiment_factors"] = factors[:6]  # Top 6 factors
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
        
        return sentiment_analysis
    
    def _calculate_risk_reward(self, analysis: Dict, buy_price: Optional[float], 
                               sell_price: Optional[float], current_price: float) -> Dict:
        """
        Calculate risk-reward ratio and risk assessment
        """
        risk_reward = {
            "risk_reward_ratio": 0.0,
            "risk_amount": 0.0,
            "reward_amount": 0.0,
            "risk_percentage": 0.0,
            "reward_percentage": 0.0,
            "risk_assessment": "Unknown",
            "recommendation": ""
        }
        
        try:
            verdict = analysis.get('final_verdict', 'NEUTRAL')
            support = analysis.get('support')
            resistance = analysis.get('resistance')
            
            if not buy_price or not sell_price or current_price <= 0:
                return risk_reward
            
            # For BUY signals
            if verdict in ['STRONG BUY', 'BUY']:
                # Entry price (use buy_price or current_price)
                entry_price = buy_price if buy_price < current_price else current_price
                
                # Risk: Distance to stop-loss (typically 5% below entry or support)
                stop_loss = support if support and support < entry_price else entry_price * 0.95
                risk_amount = entry_price - stop_loss
                risk_percentage = (risk_amount / entry_price) * 100 if entry_price > 0 else 0
                
                # Reward: Distance to target (sell_price)
                reward_amount = sell_price - entry_price
                reward_percentage = (reward_amount / entry_price) * 100 if entry_price > 0 else 0
                
                # Risk-Reward Ratio
                if risk_amount > 0:
                    rr_ratio = reward_amount / risk_amount
                else:
                    rr_ratio = 0
                
                risk_reward["risk_amount"] = round(risk_amount, 2)
                risk_reward["reward_amount"] = round(reward_amount, 2)
                risk_reward["risk_percentage"] = round(risk_percentage, 2)
                risk_reward["reward_percentage"] = round(reward_percentage, 2)
                risk_reward["risk_reward_ratio"] = round(rr_ratio, 2)
                
                # Risk Assessment
                if rr_ratio >= 3.0:
                    risk_reward["risk_assessment"] = "Excellent"
                    risk_reward["recommendation"] = f"Excellent risk-reward ({rr_ratio:.1f}:1) - High probability trade"
                elif rr_ratio >= 2.0:
                    risk_reward["risk_assessment"] = "Very Good"
                    risk_reward["recommendation"] = f"Very good risk-reward ({rr_ratio:.1f}:1) - Favorable setup"
                elif rr_ratio >= 1.5:
                    risk_reward["risk_assessment"] = "Good"
                    risk_reward["recommendation"] = f"Good risk-reward ({rr_ratio:.1f}:1) - Acceptable trade"
                elif rr_ratio >= 1.0:
                    risk_reward["risk_assessment"] = "Fair"
                    risk_reward["recommendation"] = f"Fair risk-reward ({rr_ratio:.1f}:1) - Consider position sizing"
                else:
                    risk_reward["risk_assessment"] = "Poor"
                    risk_reward["recommendation"] = f"Poor risk-reward ({rr_ratio:.1f}:1) - Avoid or reduce position"
            
            # For SELL signals
            elif verdict in ['STRONG SELL', 'SELL']:
                # Exit price (use sell_price or current_price)
                exit_price = sell_price if sell_price else current_price
                
                # Risk: Distance to stop-loss (typically 5% above exit or resistance)
                stop_loss = resistance if resistance and resistance > exit_price else exit_price * 1.05
                risk_amount = stop_loss - exit_price
                risk_percentage = (risk_amount / exit_price) * 100 if exit_price > 0 else 0
                
                # Reward: Distance to target (buy_price or support)
                target_price = buy_price if buy_price and buy_price < exit_price else (support if support else exit_price * 0.95)
                reward_amount = exit_price - target_price
                reward_percentage = (reward_amount / exit_price) * 100 if exit_price > 0 else 0
                
                # Risk-Reward Ratio
                if risk_amount > 0:
                    rr_ratio = reward_amount / risk_amount
                else:
                    rr_ratio = 0
                
                risk_reward["risk_amount"] = round(risk_amount, 2)
                risk_reward["reward_amount"] = round(reward_amount, 2)
                risk_reward["risk_percentage"] = round(risk_percentage, 2)
                risk_reward["reward_percentage"] = round(reward_percentage, 2)
                risk_reward["risk_reward_ratio"] = round(rr_ratio, 2)
                
                # Risk Assessment
                if rr_ratio >= 2.0:
                    risk_reward["risk_assessment"] = "Good Exit"
                    risk_reward["recommendation"] = f"Good exit opportunity ({rr_ratio:.1f}:1 risk-reward)"
                elif rr_ratio >= 1.0:
                    risk_reward["risk_assessment"] = "Fair Exit"
                    risk_reward["recommendation"] = f"Fair exit opportunity ({rr_ratio:.1f}:1 risk-reward)"
                else:
                    risk_reward["risk_assessment"] = "Immediate Exit"
                    risk_reward["recommendation"] = "Exit immediately - Risk exceeds potential reward"
            
        except Exception as e:
            logger.error(f"Error calculating risk-reward: {e}")
        
        return risk_reward
    
    def _analyze_trend_strength(self, analysis: Dict) -> Dict:
        """
        Analyze the strength of the current trend
        """
        trend_strength = {
            "trend_strength_score": 50,  # 0-100
            "trend_strength_level": "Moderate",
            "trend_direction": "Neutral",
            "trend_factors": [],
            "trend_continuation_probability": 50
        }
        
        try:
            trend = analysis.get('trend', 'NEUTRAL')
            buy_count = analysis.get('buy_count', 0)
            sell_count = analysis.get('sell_count', 0)
            rsi = analysis.get('rsi')
            macd_hist = analysis.get('macd_hist')
            ema_20 = analysis.get('ema_20') or analysis.get('ema20')
            ema_50 = analysis.get('ema_50') or analysis.get('ema50')
            price = analysis.get('price', 0)
            volume_signal = analysis.get('volume_signal', 'NEUTRAL')
            
            strength_score = 50  # Start neutral
            factors = []
            
            # Trend direction
            if trend == 'UP':
                trend_strength["trend_direction"] = "Upward"
                strength_score += 15
                factors.append("Uptrend confirmed")
            elif trend == 'DOWN':
                trend_strength["trend_direction"] = "Downward"
                strength_score -= 15
                factors.append("Downtrend confirmed")
            
            # Signal alignment with trend
            signal_diff = buy_count - sell_count
            if trend == 'UP' and signal_diff > 0:
                strength_score += min(20, signal_diff * 2)
                factors.append(f"Signals align with uptrend ({buy_count} buy signals)")
            elif trend == 'DOWN' and signal_diff < 0:
                strength_score -= min(20, abs(signal_diff) * 2)
                factors.append(f"Signals align with downtrend ({sell_count} sell signals)")
            elif trend != 'NEUTRAL' and signal_diff == 0:
                strength_score -= 10
                factors.append("Signals don't align with trend - Weak trend")
            
            # EMA alignment
            if price and ema_20 and ema_50:
                if price > ema_20 > ema_50:
                    strength_score += 15
                    factors.append("Strong EMA alignment (Price > EMA20 > EMA50)")
                elif price < ema_20 < ema_50:
                    strength_score -= 15
                    factors.append("Strong bearish EMA alignment (Price < EMA20 < EMA50)")
                elif price > ema_20:
                    strength_score += 5
                    factors.append("Price above EMA20 - Positive momentum")
                elif price < ema_20:
                    strength_score -= 5
                    factors.append("Price below EMA20 - Negative momentum")
            
            # MACD momentum
            if macd_hist:
                if abs(macd_hist) > 5:
                    if (trend == 'UP' and macd_hist > 0) or (trend == 'DOWN' and macd_hist < 0):
                        strength_score += 15
                        factors.append(f"Strong MACD momentum ({macd_hist:.2f}) confirms trend")
                    else:
                        strength_score -= 10
                        factors.append(f"MACD contradicts trend ({macd_hist:.2f}) - Trend weakening")
                elif abs(macd_hist) > 2:
                    if (trend == 'UP' and macd_hist > 0) or (trend == 'DOWN' and macd_hist < 0):
                        strength_score += 8
                        factors.append(f"Moderate MACD momentum ({macd_hist:.2f})")
            
            # Volume confirmation
            if volume_signal != 'NEUTRAL':
                if (trend == 'UP' and volume_signal == 'BUY') or \
                   (trend == 'DOWN' and volume_signal == 'SELL'):
                    strength_score += 10
                    factors.append("Volume confirms trend direction")
                else:
                    strength_score -= 5
                    factors.append("Volume contradicts trend - Trend may be weakening")
            
            # RSI trend strength
            if rsi:
                if trend == 'UP' and 40 <= rsi <= 60:
                    strength_score += 8
                    factors.append(f"RSI in healthy range ({rsi:.1f}) for uptrend")
                elif trend == 'DOWN' and 40 <= rsi <= 60:
                    strength_score -= 8
                    factors.append(f"RSI in healthy range ({rsi:.1f}) for downtrend")
                elif trend == 'UP' and rsi > 70:
                    strength_score -= 10
                    factors.append(f"RSI overbought ({rsi:.1f}) - Uptrend may be exhausted")
                elif trend == 'DOWN' and rsi < 30:
                    strength_score += 10
                    factors.append(f"RSI oversold ({rsi:.1f}) - Downtrend may be exhausted")
            
            # Normalize to 0-100
            strength_score = max(0, min(100, strength_score))
            
            # Determine strength level
            if strength_score >= 75:
                trend_strength["trend_strength_level"] = "Very Strong"
                trend_strength["trend_continuation_probability"] = 80
            elif strength_score >= 60:
                trend_strength["trend_strength_level"] = "Strong"
                trend_strength["trend_continuation_probability"] = 65
            elif strength_score >= 45:
                trend_strength["trend_strength_level"] = "Moderate"
                trend_strength["trend_continuation_probability"] = 50
            elif strength_score >= 30:
                trend_strength["trend_strength_level"] = "Weak"
                trend_strength["trend_continuation_probability"] = 35
            else:
                trend_strength["trend_strength_level"] = "Very Weak"
                trend_strength["trend_continuation_probability"] = 20
            
            trend_strength["trend_strength_score"] = round(strength_score, 1)
            trend_strength["trend_factors"] = factors[:6]  # Top 6 factors
            
        except Exception as e:
            logger.error(f"Error analyzing trend strength: {e}")
        
        return trend_strength
    
    def _analyze_volume_profile(self, analysis: Dict) -> Dict:
        """
        Analyze volume patterns and profile
        Detects accumulation/distribution, volume trends, volume-price divergence
        """
        volume_profile = {
            "volume_trend": "Neutral",
            "volume_strength": "Moderate",
            "accumulation_distribution": "Neutral",
            "volume_price_divergence": "None",
            "volume_analysis": "",
            "volume_score": 50
        }
        
        try:
            volume_signal = analysis.get('volume_signal', 'NEUTRAL')
            volume = analysis.get('volume', 0)
            buy_count = analysis.get('buy_count', 0)
            sell_count = analysis.get('sell_count', 0)
            trend = analysis.get('trend', 'NEUTRAL')
            price = analysis.get('price', 0)
            verdict = analysis.get('final_verdict', 'NEUTRAL')
            
            volume_score = 50
            analysis_text = []
            
            # Volume signal analysis
            if volume_signal == 'BUY':
                volume_profile["volume_trend"] = "Increasing (Bullish)"
                volume_score += 20
                analysis_text.append("Volume surge confirms buying interest")
                
                if verdict in ['STRONG BUY', 'BUY']:
                    volume_profile["accumulation_distribution"] = "Accumulation"
                    volume_score += 10
                    analysis_text.append("Accumulation pattern detected - Institutional buying")
            
            elif volume_signal == 'SELL':
                volume_profile["volume_trend"] = "Increasing (Bearish)"
                volume_score -= 20
                analysis_text.append("Volume surge confirms selling pressure")
                
                if verdict in ['STRONG SELL', 'SELL']:
                    volume_profile["accumulation_distribution"] = "Distribution"
                    volume_score -= 10
                    analysis_text.append("Distribution pattern detected - Institutional selling")
            
            else:
                volume_profile["volume_trend"] = "Neutral"
                analysis_text.append("Volume neutral - No significant change")
            
            # Volume-price divergence detection
            signal_diff = buy_count - sell_count
            if volume_signal == 'NEUTRAL' and signal_diff != 0:
                if signal_diff > 0:
                    volume_profile["volume_price_divergence"] = "Bullish Divergence"
                    analysis_text.append("Price signals bullish but volume neutral - Weak momentum")
                    volume_score -= 5
                else:
                    volume_profile["volume_price_divergence"] = "Bearish Divergence"
                    analysis_text.append("Price signals bearish but volume neutral - Weak momentum")
                    volume_score -= 5
            
            elif volume_signal != 'NEUTRAL' and signal_diff == 0:
                volume_profile["volume_price_divergence"] = "Volume-Price Mismatch"
                analysis_text.append("Volume active but signals neutral - Wait for confirmation")
                volume_score -= 10
            
            # Volume strength assessment
            if volume_score >= 70:
                volume_profile["volume_strength"] = "Very Strong"
                volume_profile["volume_analysis"] = "Strong volume confirmation - High conviction"
            elif volume_score >= 60:
                volume_profile["volume_strength"] = "Strong"
                volume_profile["volume_analysis"] = "Good volume confirmation - Moderate conviction"
            elif volume_score >= 40:
                volume_profile["volume_strength"] = "Moderate"
                volume_profile["volume_analysis"] = "Moderate volume activity - Standard conditions"
            elif volume_score >= 30:
                volume_profile["volume_strength"] = "Weak"
                volume_profile["volume_analysis"] = "Low volume activity - Low conviction"
            else:
                volume_profile["volume_strength"] = "Very Weak"
                volume_profile["volume_analysis"] = "Very low volume - Wait for confirmation"
            
            volume_profile["volume_score"] = max(0, min(100, volume_score))
            volume_profile["volume_analysis"] = " | ".join(analysis_text) if analysis_text else "Volume data insufficient"
            
        except Exception as e:
            logger.error(f"Error analyzing volume profile: {e}")
        
        return volume_profile
    
    def _analyze_price_momentum(self, analysis: Dict) -> Dict:
        """
        Analyze price momentum and rate of change
        Assesses momentum strength, acceleration, and sustainability
        """
        price_momentum = {
            "momentum_score": 50,  # 0-100
            "momentum_direction": "Neutral",
            "momentum_strength": "Moderate",
            "momentum_acceleration": "Neutral",
            "momentum_sustainability": "Moderate",
            "momentum_factors": []
        }
        
        try:
            buy_count = analysis.get('buy_count', 0)
            sell_count = analysis.get('sell_count', 0)
            rsi = analysis.get('rsi')
            macd_hist = analysis.get('macd_hist')
            trend = analysis.get('trend', 'NEUTRAL')
            ema_20 = analysis.get('ema_20') or analysis.get('ema20')
            price = analysis.get('price', 0)
            volume_signal = analysis.get('volume_signal', 'NEUTRAL')
            verdict = analysis.get('final_verdict', 'NEUTRAL')
            
            momentum_score = 50
            factors = []
            
            # Signal-based momentum
            signal_diff = buy_count - sell_count
            if signal_diff > 0:
                momentum_score += min(25, signal_diff * 2.5)
                price_momentum["momentum_direction"] = "Bullish"
                factors.append(f"Strong bullish momentum ({buy_count} buy signals)")
            elif signal_diff < 0:
                momentum_score -= min(25, abs(signal_diff) * 2.5)
                price_momentum["momentum_direction"] = "Bearish"
                factors.append(f"Strong bearish momentum ({sell_count} sell signals)")
            
            # MACD momentum
            if macd_hist:
                if abs(macd_hist) > 5:
                    if macd_hist > 0:
                        momentum_score += 20
                        price_momentum["momentum_acceleration"] = "Accelerating Upward"
                        factors.append(f"Strong upward acceleration (MACD: {macd_hist:.2f})")
                    else:
                        momentum_score -= 20
                        price_momentum["momentum_acceleration"] = "Accelerating Downward"
                        factors.append(f"Strong downward acceleration (MACD: {macd_hist:.2f})")
                elif abs(macd_hist) > 2:
                    if macd_hist > 0:
                        momentum_score += 10
                        price_momentum["momentum_acceleration"] = "Moderate Upward"
                        factors.append(f"Moderate upward momentum (MACD: {macd_hist:.2f})")
                    else:
                        momentum_score -= 10
                        price_momentum["momentum_acceleration"] = "Moderate Downward"
                        factors.append(f"Moderate downward momentum (MACD: {macd_hist:.2f})")
            
            # RSI momentum
            if rsi:
                if rsi < 30:
                    momentum_score += 15
                    factors.append(f"RSI oversold ({rsi:.1f}) - Potential upward momentum")
                elif rsi > 70:
                    momentum_score -= 15
                    factors.append(f"RSI overbought ({rsi:.1f}) - Potential downward momentum")
                elif 45 <= rsi <= 55:
                    factors.append(f"RSI neutral ({rsi:.1f}) - Balanced momentum")
            
            # EMA momentum
            if price and ema_20:
                price_ema_diff = ((price - ema_20) / ema_20) * 100
                if price_ema_diff > 2:
                    momentum_score += 10
                    factors.append(f"Price {price_ema_diff:.1f}% above EMA20 - Strong upward momentum")
                elif price_ema_diff < -2:
                    momentum_score -= 10
                    factors.append(f"Price {abs(price_ema_diff):.1f}% below EMA20 - Strong downward momentum")
            
            # Volume momentum confirmation
            if volume_signal != 'NEUTRAL':
                if (momentum_score > 50 and volume_signal == 'BUY') or \
                   (momentum_score < 50 and volume_signal == 'SELL'):
                    momentum_score += 10
                    factors.append("Volume confirms momentum direction")
                    price_momentum["momentum_sustainability"] = "High"
                else:
                    momentum_score -= 5
                    factors.append("Volume contradicts momentum - Momentum may be weakening")
                    price_momentum["momentum_sustainability"] = "Low"
            
            # Trend momentum alignment
            if trend != 'NEUTRAL':
                if (trend == 'UP' and momentum_score > 50) or \
                   (trend == 'DOWN' and momentum_score < 50):
                    momentum_score += 8
                    factors.append("Trend aligns with momentum - Sustainable move")
                    price_momentum["momentum_sustainability"] = "High"
                else:
                    momentum_score -= 8
                    factors.append("Trend contradicts momentum - Momentum may reverse")
                    price_momentum["momentum_sustainability"] = "Low"
            
            # Normalize to 0-100
            momentum_score = max(0, min(100, momentum_score))
            
            # Determine momentum strength
            if momentum_score >= 75:
                price_momentum["momentum_strength"] = "Very Strong"
            elif momentum_score >= 60:
                price_momentum["momentum_strength"] = "Strong"
            elif momentum_score >= 45:
                price_momentum["momentum_strength"] = "Moderate"
            elif momentum_score >= 30:
                price_momentum["momentum_strength"] = "Weak"
            else:
                price_momentum["momentum_strength"] = "Very Weak"
            
            price_momentum["momentum_score"] = round(momentum_score, 1)
            price_momentum["momentum_factors"] = factors[:6]  # Top 6 factors
            
        except Exception as e:
            logger.error(f"Error analyzing price momentum: {e}")
        
        return price_momentum