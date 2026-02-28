"""
Technical Indicators Calculator
Manual implementation of technical indicators (compatible with Python 3.14)
"""
import pandas as pd
import numpy as np
from typing import Dict, Optional, Tuple
import logging
from config import EMA_SHORT, EMA_LONG, RSI_OVERSOLD, RSI_OVERBOUGHT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TechnicalIndicators:
    """Calculates all technical indicators for stock analysis"""
    
    def __init__(self, df: pd.DataFrame):
        """
        Initialize with OHLCV DataFrame
        
        Args:
            df: DataFrame with columns: open, high, low, close, volume
        """
        if df is None or df.empty:
            raise ValueError("DataFrame is empty or None")
        
        self.df = df.copy()
        self._validate_dataframe()
    
    def _validate_dataframe(self):
        """Validate that required columns exist"""
        required_cols = ['open', 'high', 'low', 'close', 'volume']
        missing = [col for col in required_cols if col not in self.df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")
    
    def calculate_all(self) -> pd.DataFrame:
        """Calculate all technical indicators"""
        df = self.df.copy()
        
        # Price-based indicators
        df = self._calculate_ema(df)
        df = self._calculate_rsi(df)
        df = self._calculate_macd(df)
        df = self._calculate_bollinger_bands(df)
        
        # Volume indicators
        df = self._calculate_volume_indicators(df)
        
        # Price patterns
        df = self._calculate_price_patterns(df)
        
        # Support and Resistance
        df = self._calculate_support_resistance(df)
        
        return df
    
    def _calculate_ema(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate Exponential Moving Averages"""
        try:
            df['ema_20'] = df['close'].ewm(span=EMA_SHORT, adjust=False).mean()
            df['ema_50'] = df['close'].ewm(span=EMA_LONG, adjust=False).mean()
            return df
        except Exception as e:
            logger.error(f"Error calculating EMA: {e}")
            df['ema_20'] = np.nan
            df['ema_50'] = np.nan
            return df
    
    def _calculate_rsi(self, df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """Calculate Relative Strength Index"""
        try:
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
            rs = gain / loss
            df['rsi'] = 100 - (100 / (1 + rs))
            return df
        except Exception as e:
            logger.error(f"Error calculating RSI: {e}")
            df['rsi'] = np.nan
            return df
    
    def _calculate_macd(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate MACD (Moving Average Convergence Divergence)"""
        try:
            # MACD Line: 12-period EMA - 26-period EMA
            ema_12 = df['close'].ewm(span=12, adjust=False).mean()
            ema_26 = df['close'].ewm(span=26, adjust=False).mean()
            df['macd'] = ema_12 - ema_26
            
            # Signal Line: 9-period EMA of MACD
            df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
            
            # Histogram: MACD - Signal
            df['macd_hist'] = df['macd'] - df['macd_signal']
            
            return df
        except Exception as e:
            logger.error(f"Error calculating MACD: {e}")
            df['macd'] = np.nan
            df['macd_signal'] = np.nan
            df['macd_hist'] = np.nan
            return df
    
    def _calculate_bollinger_bands(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate Bollinger Bands"""
        try:
            period = 20
            std_multiplier = 2
            sma = df['close'].rolling(window=period).mean()
            std = df['close'].rolling(window=period).std()
            
            df['bb_middle'] = sma
            df['bb_upper'] = sma + (std * std_multiplier)
            df['bb_lower'] = sma - (std * std_multiplier)
            
            return df
        except Exception as e:
            logger.error(f"Error calculating Bollinger Bands: {e}")
            df['bb_upper'] = np.nan
            df['bb_middle'] = np.nan
            df['bb_lower'] = np.nan
            return df
    
    def _calculate_volume_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate volume-based indicators"""
        try:
            # Volume Moving Average
            df['volume_ma'] = df['volume'].rolling(window=20).mean()
            
            # Volume Rate of Change
            df['volume_roc'] = df['volume'].pct_change(periods=5) * 100
            
            return df
        except Exception as e:
            logger.error(f"Error calculating volume indicators: {e}")
            df['volume_ma'] = np.nan
            df['volume_roc'] = np.nan
            return df
    
    def _calculate_price_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate price patterns and candlestick patterns"""
        try:
            # Calculate price change
            df['price_change'] = df['close'].pct_change()
            
            # Calculate high-low range
            df['hl_range'] = df['high'] - df['low']
            df['hl_range_pct'] = df['hl_range'] / df['low']
            
            # Calculate gap (for daily/weekly data)
            df['gap'] = df['open'] - df['close'].shift(1)
            df['gap_pct'] = df['gap'] / df['close'].shift(1)
            
            # Simple candlestick patterns
            df['body'] = abs(df['close'] - df['open'])
            df['upper_shadow'] = df['high'] - df[['open', 'close']].max(axis=1)
            df['lower_shadow'] = df[['open', 'close']].min(axis=1) - df['low']
            
            # Bullish/Bearish candle
            df['is_bullish'] = df['close'] > df['open']
            df['is_bearish'] = df['close'] < df['open']
            
            return df
        except Exception as e:
            logger.error(f"Error calculating price patterns: {e}")
            return df
    
    def _calculate_support_resistance(self, df: pd.DataFrame, window: int = 20) -> pd.DataFrame:
        """Calculate support and resistance levels"""
        try:
            # Rolling high/low for support/resistance
            df['resistance'] = df['high'].rolling(window=window).max()
            df['support'] = df['low'].rolling(window=window).min()
            
            # Distance from support/resistance
            df['dist_to_resistance'] = (df['resistance'] - df['close']) / df['close']
            df['dist_to_support'] = (df['close'] - df['support']) / df['close']
            
            return df
        except Exception as e:
            logger.error(f"Error calculating support/resistance: {e}")
            df['resistance'] = np.nan
            df['support'] = np.nan
            return df
    
    def get_latest_values(self) -> Dict[str, Optional[float]]:
        """Get latest values of all indicators"""
        if self.df.empty:
            return {}
        
        latest = self.df.iloc[-1]
        prev = self.df.iloc[-2] if len(self.df) > 1 else None
        
        values = {
            'price': float(latest['close']),
            'open': float(latest['open']),
            'high': float(latest['high']),
            'low': float(latest['low']),
            'volume': float(latest['volume']),
            'rsi': float(latest['rsi']) if pd.notna(latest.get('rsi')) else None,
            'ema_20': float(latest['ema_20']) if pd.notna(latest.get('ema_20')) else None,
            'ema_50': float(latest['ema_50']) if pd.notna(latest.get('ema_50')) else None,
            'macd': float(latest['macd']) if pd.notna(latest.get('macd')) else None,
            'macd_signal': float(latest['macd_signal']) if pd.notna(latest.get('macd_signal')) else None,
            'macd_hist': float(latest['macd_hist']) if pd.notna(latest.get('macd_hist')) else None,
            'support': float(latest['support']) if pd.notna(latest.get('support')) else None,
            'resistance': float(latest['resistance']) if pd.notna(latest.get('resistance')) else None,
        }
        
        # Add previous values for comparison
        if prev is not None:
            values['prev_price'] = float(prev['close'])
            values['prev_rsi'] = float(prev['rsi']) if pd.notna(prev.get('rsi')) else None
            values['prev_macd'] = float(prev['macd']) if pd.notna(prev.get('macd')) else None
            values['prev_macd_signal'] = float(prev['macd_signal']) if pd.notna(prev.get('macd_signal')) else None
        
        return values
    
    def detect_trend(self) -> str:
        """
        Detect trend: UP, DOWN, or NEUTRAL
        Based on higher highs + higher lows (UP) or lower highs + lower lows (DOWN)
        """
        if len(self.df) < 3:
            return "NEUTRAL"
        
        try:
            # Get recent highs and lows
            recent_highs = self.df['high'].tail(5).values
            recent_lows = self.df['low'].tail(5).values
            
            # Check for higher highs and higher lows
            higher_highs = all(recent_highs[i] >= recent_highs[i-1] for i in range(1, len(recent_highs)))
            higher_lows = all(recent_lows[i] >= recent_lows[i-1] for i in range(1, len(recent_lows)))
            
            # Check for lower highs and lower lows
            lower_highs = all(recent_highs[i] <= recent_highs[i-1] for i in range(1, len(recent_highs)))
            lower_lows = all(recent_lows[i] <= recent_lows[i-1] for i in range(1, len(recent_lows)))
            
            if higher_highs and higher_lows:
                return "UP"
            elif lower_highs and lower_lows:
                return "DOWN"
            else:
                return "NEUTRAL"
        except Exception as e:
            logger.error(f"Error detecting trend: {e}")
            return "NEUTRAL"
