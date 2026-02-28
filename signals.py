"""
Signal Analysis Engine
Applies trading rules and generates BUY/SELL signals
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
import logging
from indicators import TechnicalIndicators
from config import (
    RSI_OVERSOLD, RSI_OVERBOUGHT, RSI_NEUTRAL_LOW, RSI_NEUTRAL_HIGH,
    EMA_SHORT, EMA_LONG, SIGNAL_THRESHOLD
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SignalAnalyzer:
    """Analyzes technical indicators and generates trading signals"""
    
    def __init__(self, indicators: TechnicalIndicators):
        """
        Initialize with TechnicalIndicators instance
        
        Args:
            indicators: TechnicalIndicators instance with calculated indicators
        """
        self.indicators = indicators
        self.df = indicators.df
        self.values = indicators.get_latest_values()
        self.trend = indicators.detect_trend()
    
    def analyze(self) -> Dict[str, any]:
        """
        Perform complete analysis and return signals
        
        Returns:
            Dictionary with buy_signals, sell_signals, and final_verdict
        """
        buy_signals = []
        sell_signals = []
        
        # 1. Trend Analysis
        trend_signal = self._analyze_trend()
        if trend_signal == "BUY":
            buy_signals.append("TREND_UP")
        elif trend_signal == "SELL":
            sell_signals.append("TREND_DOWN")
        
        # 2. EMA Analysis
        ema_signal = self._analyze_ema()
        if ema_signal == "STRONG_BUY":
            buy_signals.extend(["EMA_STRONG_BUY", "EMA_STRONG_BUY"])
        elif ema_signal == "BUY":
            buy_signals.append("EMA_BUY")
        elif ema_signal == "STRONG_SELL":
            sell_signals.extend(["EMA_STRONG_SELL", "EMA_STRONG_SELL"])
        elif ema_signal == "SELL":
            sell_signals.append("EMA_SELL")
        
        # 3. RSI Analysis
        rsi_signal = self._analyze_rsi()
        if rsi_signal == "BUY":
            buy_signals.append("RSI_OVERSOLD")
        elif rsi_signal == "SELL":
            sell_signals.append("RSI_OVERBOUGHT")
        elif rsi_signal == "NEUTRAL":
            pass  # Neutral doesn't add signals
        
        # 4. MACD Analysis
        macd_signal = self._analyze_macd()
        if macd_signal == "BUY":
            buy_signals.append("MACD_BULLISH")
        elif macd_signal == "SELL":
            sell_signals.append("MACD_BEARISH")
        
        # 5. Support & Resistance
        sr_signal = self._analyze_support_resistance()
        if sr_signal == "BUY":
            buy_signals.append("BREAK_RESISTANCE")
        elif sr_signal == "SELL":
            sell_signals.append("BREAK_SUPPORT")
        
        # 6. Volume Analysis
        volume_signal = self._analyze_volume()
        if volume_signal == "BUY":
            buy_signals.append("VOLUME_CONFIRMATION_BUY")
        elif volume_signal == "SELL":
            sell_signals.append("VOLUME_CONFIRMATION_SELL")
        
        # 7. Candlestick Patterns
        candle_signal = self._analyze_candlestick()
        if candle_signal == "BUY":
            buy_signals.append("BULLISH_CANDLE")
        elif candle_signal == "SELL":
            sell_signals.append("BEARISH_CANDLE")
        
        # 8. Gap Analysis
        gap_signal = self._analyze_gap()
        if gap_signal == "BUY":
            buy_signals.append("GAP_UP")
        elif gap_signal == "SELL":
            sell_signals.append("GAP_DOWN")
        
        # 9. Open High Low Analysis
        ohl_signal = self._analyze_open_high_low()
        if ohl_signal == "BUY":
            buy_signals.append("BREAK_DAY_HIGH")
        elif ohl_signal == "SELL":
            sell_signals.append("BREAK_DAY_LOW")
        
        # Calculate final verdict
        buy_count = len(buy_signals)
        sell_count = len(sell_signals)
        
        if buy_count >= SIGNAL_THRESHOLD:
            final_verdict = "STRONG BUY"
        elif sell_count >= SIGNAL_THRESHOLD:
            final_verdict = "STRONG SELL"
        elif buy_count > sell_count:
            final_verdict = "BUY"
        elif sell_count > buy_count:
            final_verdict = "SELL"
        else:
            final_verdict = "NEUTRAL"
        
        # Calculate buy/sell price recommendations (pass verdict to avoid recursion)
        buy_price, sell_price = self._calculate_price_recommendations(final_verdict)
        
        return {
            "buy_signals": buy_signals,
            "sell_signals": sell_signals,
            "buy_count": buy_count,
            "sell_count": sell_count,
            "final_verdict": final_verdict,
            "trend": self.trend,
            "volume_signal": volume_signal,
            "buy_price": buy_price,
            "sell_price": sell_price
        }
    
    def _analyze_trend(self) -> str:
        """Analyze trend: BUY, SELL, or NEUTRAL"""
        if self.trend == "UP":
            return "BUY"
        elif self.trend == "DOWN":
            return "SELL"
        return "NEUTRAL"
    
    def _analyze_ema(self) -> str:
        """Analyze EMA signals"""
        price = self.values.get('price')
        ema_20 = self.values.get('ema_20')
        ema_50 = self.values.get('ema_50')
        
        if price is None or ema_20 is None or ema_50 is None:
            return "NEUTRAL"
        
        # Strong Buy: Price > 20 EMA > 50 EMA
        if price > ema_20 > ema_50:
            return "STRONG_BUY"
        
        # Strong Sell: Price < 20 EMA < 50 EMA
        if price < ema_20 < ema_50:
            return "STRONG_SELL"
        
        # Buy: Price > 20 EMA
        if price > ema_20:
            return "BUY"
        
        # Sell: Price < 20 EMA
        if price < ema_20:
            return "SELL"
        
        return "NEUTRAL"
    
    def _analyze_rsi(self) -> str:
        """Analyze RSI signals"""
        rsi = self.values.get('rsi')
        
        if rsi is None:
            return "NEUTRAL"
        
        if rsi < RSI_OVERSOLD:
            return "BUY"
        elif rsi > RSI_OVERBOUGHT:
            return "SELL"
        elif RSI_NEUTRAL_LOW <= rsi <= RSI_NEUTRAL_HIGH:
            return "NEUTRAL"
        else:
            return "NEUTRAL"
    
    def _analyze_macd(self) -> str:
        """Analyze MACD signals"""
        macd = self.values.get('macd')
        macd_signal = self.values.get('macd_signal')
        macd_hist = self.values.get('macd_hist')
        prev_macd = self.values.get('prev_macd')
        prev_macd_signal = self.values.get('prev_macd_signal')
        
        if macd is None or macd_signal is None:
            return "NEUTRAL"
        
        # Bullish crossover: MACD crosses above signal line
        if prev_macd is not None and prev_macd_signal is not None:
            if prev_macd <= prev_macd_signal and macd > macd_signal:
                return "BUY"
            # Bearish crossover: MACD crosses below signal line
            if prev_macd >= prev_macd_signal and macd < macd_signal:
                return "SELL"
        
        # Current position
        if macd_hist is not None:
            if macd_hist > 0:
                return "BUY"
            elif macd_hist < 0:
                return "SELL"
        
        return "NEUTRAL"
    
    def _analyze_support_resistance(self) -> str:
        """Analyze support and resistance breaks"""
        if len(self.df) < 2:
            return "NEUTRAL"
        
        try:
            latest = self.df.iloc[-1]
            prev = self.df.iloc[-2]
            
            price = latest['close']
            resistance = latest.get('resistance')
            support = latest.get('support')
            prev_resistance = prev.get('resistance')
            prev_support = prev.get('support')
            
            if pd.isna(resistance) or pd.isna(support):
                return "NEUTRAL"
            
            # Break resistance (price crosses above resistance)
            if prev_resistance is not None and price > resistance and prev['close'] <= prev_resistance:
                return "BUY"
            
            # Break support (price crosses below support)
            if prev_support is not None and price < support and prev['close'] >= prev_support:
                return "SELL"
            
            return "NEUTRAL"
        except Exception as e:
            logger.error(f"Error analyzing support/resistance: {e}")
            return "NEUTRAL"
    
    def _analyze_volume(self) -> str:
        """Analyze volume signals"""
        if len(self.df) < 2:
            return "NEUTRAL"
        
        try:
            latest = self.df.iloc[-1]
            prev = self.df.iloc[-2]
            
            price_change = latest['close'] - prev['close']
            volume = latest['volume']
            volume_ma = latest.get('volume_ma')
            
            if pd.isna(volume_ma) or volume_ma == 0:
                return "NEUTRAL"
            
            # Price up + volume up → Buy
            if price_change > 0 and volume > volume_ma * 1.2:
                return "BUY"
            
            # Price down + volume up → Sell
            if price_change < 0 and volume > volume_ma * 1.2:
                return "SELL"
            
            return "NEUTRAL"
        except Exception as e:
            logger.error(f"Error analyzing volume: {e}")
            return "NEUTRAL"
    
    def _analyze_candlestick(self) -> str:
        """Analyze candlestick patterns"""
        if len(self.df) < 1:
            return "NEUTRAL"
        
        try:
            latest = self.df.iloc[-1]
            
            is_bullish = latest.get('is_bullish', False)
            is_bearish = latest.get('is_bearish', False)
            
            body = latest.get('body', 0)
            upper_shadow = latest.get('upper_shadow', 0)
            lower_shadow = latest.get('lower_shadow', 0)
            
            # Strong bullish pattern: large body, small shadows
            if is_bullish and body > (upper_shadow + lower_shadow) * 2:
                return "BUY"
            
            # Strong bearish pattern: large body, small shadows
            if is_bearish and body > (upper_shadow + lower_shadow) * 2:
                return "SELL"
            
            # Simple bullish/bearish
            if is_bullish:
                return "BUY"
            if is_bearish:
                return "SELL"
            
            return "NEUTRAL"
        except Exception as e:
            logger.error(f"Error analyzing candlestick: {e}")
            return "NEUTRAL"
    
    def _analyze_gap(self) -> str:
        """Analyze gap patterns"""
        if len(self.df) < 2:
            return "NEUTRAL"
        
        try:
            latest = self.df.iloc[-1]
            gap = latest.get('gap', 0)
            gap_pct = latest.get('gap_pct', 0)
            volume = latest['volume']
            volume_ma = latest.get('volume_ma', 0)
            
            if pd.isna(gap) or pd.isna(gap_pct):
                return "NEUTRAL"
            
            # Gap up with volume
            if gap > 0 and gap_pct > 0.01 and volume > volume_ma * 1.1:
                return "BUY"
            
            # Gap down with volume
            if gap < 0 and gap_pct < -0.01 and volume > volume_ma * 1.1:
                return "SELL"
            
            return "NEUTRAL"
        except Exception as e:
            logger.error(f"Error analyzing gap: {e}")
            return "NEUTRAL"
    
    def _analyze_open_high_low(self) -> str:
        """Analyze open-high-low breakouts"""
        if len(self.df) < 1:
            return "NEUTRAL"
        
        try:
            latest = self.df.iloc[-1]
            
            open_price = latest['open']
            high = latest['high']
            low = latest['low']
            close = latest['close']
            
            # Break day high (close near high)
            if close >= high * 0.99:
                return "BUY"
            
            # Break day low (close near low)
            if close <= low * 1.01:
                return "SELL"
            
            return "NEUTRAL"
        except Exception as e:
            logger.error(f"Error analyzing open-high-low: {e}")
            return "NEUTRAL"
    
    def _calculate_price_recommendations(self, final_verdict: str = 'NEUTRAL') -> Tuple[float, float]:
        """
        Calculate recommended buy and sell prices based on technical analysis
        Now signal-aware: Adjusts recommendations based on final verdict
        
        Args:
            final_verdict: Final trading verdict (STRONG BUY, BUY, SELL, STRONG SELL, NEUTRAL)
        
        Returns:
            Tuple of (buy_price, sell_price)
        """
        try:
            if len(self.df) < 1:
                return None, None
            
            latest = self.df.iloc[-1]
            current_price = latest['close']
            
            # Get support and resistance levels
            support = latest.get('support') if 'support' in latest.index else None
            resistance = latest.get('resistance') if 'resistance' in latest.index else None
            
            # Convert to float if not NaN
            if support is not None:
                try:
                    support = float(support) if pd.notna(support) else None
                except (ValueError, TypeError):
                    support = None
            
            if resistance is not None:
                try:
                    resistance = float(resistance) if pd.notna(resistance) else None
                except (ValueError, TypeError):
                    resistance = None
            
            # Get EMA levels
            ema_20 = self.values.get('ema_20')
            ema_50 = self.values.get('ema_50')
            
            # Get RSI for price adjustment
            rsi = self.values.get('rsi')
            
            # Signal-aware price calculation
            if final_verdict in ['STRONG SELL', 'SELL']:
                # For SELL signals: Focus on exit strategy
                # Buy price = Support level (for reference, but NOT recommended)
                # Sell price = Current price or resistance (exit target)
                
                sell_candidates = []
                
                # Primary: Current price (immediate exit)
                sell_candidates.append(current_price)
                
                # Secondary: Resistance or EMA above current
                if resistance is not None and resistance > 0:
                    sell_candidates.append(resistance)
                
                if ema_50 and ema_50 > current_price:
                    sell_candidates.append(ema_50)
                
                if ema_20 and ema_20 > current_price:
                    sell_candidates.append(ema_20)
                
                # If RSI overbought, add premium
                if rsi and rsi > RSI_OVERBOUGHT:
                    sell_candidates.append(current_price * 1.02)
                
                # Sell price: Use highest (best exit)
                sell_price = max(sell_candidates) if sell_candidates else current_price * 1.01
                
                # Buy price: Show support (for reference only, NOT recommended)
                buy_candidates = []
                if support is not None and support > 0:
                    buy_candidates.append(support)
                if ema_20 and ema_20 < current_price:
                    buy_candidates.append(ema_20)
                if ema_50 and ema_50 < current_price:
                    buy_candidates.append(ema_50)
                
                buy_price = min(buy_candidates) if buy_candidates else current_price * 0.95
                
            elif final_verdict in ['STRONG BUY', 'BUY']:
                # For BUY signals: Focus on entry strategy
                # Buy price = Support or EMA (entry point)
                # Sell price = Resistance or EMA (target)
                
                buy_candidates = []
                
                # Use support level if available
                if support is not None and support > 0:
                    buy_candidates.append(support)
                
                # Use EMA-20 if available and below current price
                if ema_20 and ema_20 < current_price:
                    buy_candidates.append(ema_20)
                
                # Use EMA-50 if available and below current price
                if ema_50 and ema_50 < current_price:
                    buy_candidates.append(ema_50)
                
                # If RSI is oversold, suggest buying slightly below current price
                if rsi and rsi < RSI_OVERSOLD:
                    buy_candidates.append(current_price * 0.98)  # 2% discount
                
                # If RSI is neutral-low, suggest buying at current price or slightly below
                if rsi and RSI_OVERSOLD <= rsi < RSI_NEUTRAL_LOW:
                    buy_candidates.append(current_price * 0.995)  # 0.5% discount
                
                # Default: use current price with small discount
                if not buy_candidates:
                    buy_candidates.append(current_price * 0.99)  # 1% discount
                
                # Buy price: Use the lowest (most conservative)
                buy_price = min(buy_candidates) if buy_candidates else current_price * 0.99
                
                # Calculate sell price (target)
                sell_candidates = []
                
                # Use resistance level if available
                if resistance is not None and resistance > 0:
                    sell_candidates.append(resistance)
                
                # Use EMA-50 if available and above current price
                if ema_50 and ema_50 > current_price:
                    sell_candidates.append(ema_50)
                
                # Use EMA-20 if available and above current price
                if ema_20 and ema_20 > current_price:
                    sell_candidates.append(ema_20)
                
                # If RSI is overbought, suggest selling slightly above current price
                if rsi and rsi > RSI_OVERBOUGHT:
                    sell_candidates.append(current_price * 1.02)  # 2% premium
                
                # Default: use current price with small premium
                if not sell_candidates:
                    sell_candidates.append(current_price * 1.01)  # 1% premium
                
                # Sell price: Use the highest (most conservative)
                sell_price = max(sell_candidates) if sell_candidates else current_price * 1.01
                
            else:
                # NEUTRAL: Show both levels for reference
                buy_candidates = []
                sell_candidates = []
                
                # Buy candidates
                if support is not None and support > 0:
                    buy_candidates.append(support)
                if ema_20 and ema_20 < current_price:
                    buy_candidates.append(ema_20)
                if ema_50 and ema_50 < current_price:
                    buy_candidates.append(ema_50)
                if not buy_candidates:
                    buy_candidates.append(current_price * 0.99)
                
                # Sell candidates
                if resistance is not None and resistance > 0:
                    sell_candidates.append(resistance)
                if ema_50 and ema_50 > current_price:
                    sell_candidates.append(ema_50)
                if ema_20 and ema_20 > current_price:
                    sell_candidates.append(ema_20)
                if not sell_candidates:
                    sell_candidates.append(current_price * 1.01)
                
                buy_price = min(buy_candidates) if buy_candidates else current_price * 0.99
                sell_price = max(sell_candidates) if sell_candidates else current_price * 1.01
            
            # Round to 2 decimal places
            buy_price = round(buy_price, 2)
            sell_price = round(sell_price, 2)
            
            # Ensure buy_price < sell_price (unless SELL signal where sell might be lower)
            if final_verdict not in ['STRONG SELL', 'SELL']:
                if buy_price >= sell_price:
                    buy_price = round(sell_price * 0.98, 2)
            
            return buy_price, sell_price
            
        except Exception as e:
            logger.error(f"Error calculating price recommendations: {e}")
            # Return conservative defaults
            current_price = self.values.get('price', 0)
            if current_price > 0:
                return round(current_price * 0.99, 2), round(current_price * 1.01, 2)
            return None, None
