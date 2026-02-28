import pandas as pd
import numpy as np
import logging
from typing import Dict
from backtesting import Backtest, Strategy

from data_fetcher import StockDataFetcher
from indicators import TechnicalIndicators
from config import (
    RSI_OVERSOLD, RSI_OVERBOUGHT,
    SIGNAL_THRESHOLD
)

logger = logging.getLogger(__name__)

class NinePointStrategy(Strategy):
    """
    Backtesting strategy mimicking the exact 9-point rule engine
    used in Trading Engineer.
    """
    def init(self):
        pass

    def next(self):
        buy_signals = 0
        sell_signals = 0
        
        # Must have history
        if len(self.data.Close) < 2: return
        
        price = self.data.Close[-1]
        prev_price = self.data.Close[-2]
        volume = self.data.Volume[-1]
        high = self.data.High[-1]
        low = self.data.Low[-1]
        
        # Indicators mapped from dataframe (ensure we use proper indexing)
        ema_20 = self.data.ema_20[-1] if 'ema_20' in self.data.df.columns else None
        ema_50 = self.data.ema_50[-1] if 'ema_50' in self.data.df.columns else None
        rsi = self.data.rsi[-1] if 'rsi' in self.data.df.columns else None
        
        macd = self.data.macd[-1] if 'macd' in self.data.df.columns else None
        macd_signal = self.data.macd_signal[-1] if 'macd_signal' in self.data.df.columns else None
        macd_hist = self.data.macd_hist[-1] if 'macd_hist' in self.data.df.columns else None
        
        prev_macd = self.data.macd[-2] if 'macd' in self.data.df.columns else None
        prev_macd_signal = self.data.macd_signal[-2] if 'macd_signal' in self.data.df.columns else None
        
        volume_ma = self.data.volume_ma[-1] if 'volume_ma' in self.data.df.columns else None
        
        support = self.data.support[-1] if 'support' in self.data.df.columns else None
        resistance = self.data.resistance[-1] if 'resistance' in self.data.df.columns else None
        prev_support = self.data.support[-2] if 'support' in self.data.df.columns else None
        prev_resistance = self.data.resistance[-2] if 'resistance' in self.data.df.columns else None
        
        is_bullish = self.data.is_bullish[-1] if 'is_bullish' in self.data.df.columns else False
        is_bearish = self.data.is_bearish[-1] if 'is_bearish' in self.data.df.columns else False
        
        gap = self.data.gap[-1] if 'gap' in self.data.df.columns else 0
        gap_pct = self.data.gap_pct[-1] if 'gap_pct' in self.data.df.columns else 0
        
        # 1. Trend Analysis (EMA Cross)
        if pd.notna(ema_20) and pd.notna(ema_50):
            if ema_20 > ema_50: buy_signals += 1
            elif ema_20 < ema_50: sell_signals += 1
            
            # 2. EMA Analysis
            if price > ema_20 > ema_50: buy_signals += 2
            elif price < ema_20 < ema_50: sell_signals += 2
            elif price > ema_20: buy_signals += 1
            elif price < ema_20: sell_signals += 1
            
        # 3. RSI
        if pd.notna(rsi):
            if rsi < RSI_OVERSOLD: buy_signals += 1
            elif rsi > RSI_OVERBOUGHT: sell_signals += 1
            
        # 4. MACD
        if pd.notna(macd) and pd.notna(macd_signal):
            if pd.notna(prev_macd) and pd.notna(prev_macd_signal):
                if prev_macd <= prev_macd_signal and macd > macd_signal: buy_signals += 1
                if prev_macd >= prev_macd_signal and macd < macd_signal: sell_signals += 1
            if pd.notna(macd_hist):
                if macd_hist > 0: buy_signals += 1
                elif macd_hist < 0: sell_signals += 1
                
        # 5. Support/Resistance
        if pd.notna(resistance) and pd.notna(prev_resistance):
            if price > resistance and prev_price <= prev_resistance: buy_signals += 1
        if pd.notna(support) and pd.notna(prev_support):
            if price < support and prev_price >= prev_support: sell_signals += 1
            
        # 6. Volume
        if pd.notna(volume_ma):
            if (price - prev_price) > 0 and volume > volume_ma * 1.2: buy_signals += 1
            elif (price - prev_price) < 0 and volume > volume_ma * 1.2: sell_signals += 1
            
        # 7. Candlestick
        if is_bullish: buy_signals += 1
        if is_bearish: sell_signals += 1
        
        # 8. Gap
        if pd.notna(gap) and pd.notna(gap_pct) and pd.notna(volume_ma):
            if gap > 0 and gap_pct > 0.01 and volume > volume_ma * 1.1: buy_signals += 1
            if gap < 0 and gap_pct < -0.01 and volume > volume_ma * 1.1: sell_signals += 1
            
        # 9. OHL
        if price >= high * 0.99: buy_signals += 1
        if price <= low * 1.01: sell_signals += 1

        # Trading Rules: Buy if strong buy signal. Sell/close if strong sell.
        # We simulate holding only 1 position.
        
        # Default signal threshold might be 7 for STRONG BUY
        target_signals = max(5, SIGNAL_THRESHOLD - 2) # slightly lower for backtesting to get trades

        if buy_signals >= target_signals and not self.position.is_long:
            self.buy()
        elif sell_signals >= target_signals and self.position.is_long:
            self.position.close()


async def run_backtest(symbol: str, timeframe: str = 'daily', period: str = '6mo') -> Dict:
    """
    Run backtest on historical data and return simplified metrics.
    """
    try:
        fetcher = StockDataFetcher()
        # Ensure we ask for sufficient data based on the period
        df = await fetcher.fetch_data(symbol, mode='swing', period=period)
        
        if df is None or len(df) < 50:
            return {"error": "Not enough historical data to backtest."}
            
        # Calculate indicators
        indicators = TechnicalIndicators(df)
        df = indicators.calculate_all()
        
        # Format for Backtesting.py: Needs uppercase OHLCV
        df_bt = df.copy()
        df_bt = dict(
            Open=df_bt['open'],
            High=df_bt['high'],
            Low=df_bt['low'],
            Close=df_bt['close'],
            Volume=df_bt['volume']
        )
        for col in df.columns:
            if col not in ['open', 'high', 'low', 'close', 'volume']:
                df_bt[col] = df[col]
        df_bt = pd.DataFrame(df_bt, index=df.index)
        
        start_cash = 10000
        
        bt = Backtest(df_bt, NinePointStrategy, cash=start_cash, commission=0.001)
        stats = bt.run()
        
        # Generate beginner-friendly response
        win_rate = float(stats.get('Win Rate [%]', 0))
        if pd.isna(win_rate): win_rate = 0.0
            
        avg_trade = float(stats.get('Avg. Trade [%]', 0))
        if pd.isna(avg_trade): avg_trade = 0.0
            
        max_drawdown = float(stats.get('Max. Drawdown [%]', 0))
        if pd.isna(max_drawdown): max_drawdown = 0.0
            
        best_trade = float(stats.get('Best Trade [%]', 0))
        if pd.isna(best_trade): best_trade = 0.0
            
        worst_trade = float(stats.get('Worst Trade [%]', 0))
        if pd.isna(worst_trade): worst_trade = 0.0
            
        final_equity = float(stats.get('Equity Final [$]', start_cash))
        
        # Format the numbers
        return {
            "symbol": symbol,
            "period": period,
            "total_trades": int(stats.get('# Trades', 0)),
            "win_rate_percent": round(win_rate, 2),
            "avg_profit_percent": round(avg_trade, 2),
            "max_drawdown_percent": round(abs(max_drawdown), 2),
            "best_trade_percent": round(best_trade, 2),
            "worst_trade_percent": round(worst_trade, 2),
            "start_cash": start_cash,
            "final_equity": round(final_equity, 2),
            "profit_loss_rs": round(final_equity - start_cash, 2),
            "summary_text": f"₹{start_cash:,.0f} invested would have returned ₹{final_equity:,.0f} in the last {period.replace('mo', ' months')}."
        }
        
    except Exception as e:
        logger.error(f"Backtest failed for {symbol}: {e}")
        return {"error": str(e)}
