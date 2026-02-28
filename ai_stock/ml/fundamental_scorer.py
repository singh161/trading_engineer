"""
Module 3: Fundamental Scoring
Uses Yahoo Finance + Alpha Vantage API to extract fundamental metrics
"""
import os
import yfinance as yf
import aiohttp
import asyncio
import logging
from typing import Dict, Optional, List
from datetime import datetime
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FundamentalScorer:
    """Fundamental analysis scorer for stocks"""
    
    def __init__(self):
        self.alpha_vantage_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        self.nse_suffix = ".NS"  # For NSE stocks in yfinance
        self._cache = {}  # In-memory cache for fundamental data
        self._cache_ttl = 3600  # Cache for 1 hour
    
    def get_yahoo_finance_data(self, symbol: str, use_cache: bool = True) -> Dict:
        """Get fundamental data from Yahoo Finance with caching"""
        # Check cache first
        if use_cache and symbol in self._cache:
            cached_data, cached_time = self._cache[symbol]
            if (datetime.now() - cached_time).total_seconds() < self._cache_ttl:
                logger.debug(f"Using cached data for {symbol}")
                return cached_data
        
        try:
            # Add .NS suffix for NSE stocks
            yf_symbol = f"{symbol}{self.nse_suffix}" if not symbol.endswith('.NS') else symbol
            ticker = yf.Ticker(yf_symbol)
            
            info = ticker.info
            
            # Extract key metrics
            data = {
                "symbol": symbol,
                "revenue_growth": info.get("revenueGrowth"),
                "earnings_growth": info.get("earningsGrowth"),
                "roe": info.get("returnOnEquity"),
                "debt_to_equity": info.get("debtToEquity"),
                "profit_margin": info.get("profitMargins"),
                "current_ratio": info.get("currentRatio"),
                "pe_ratio": info.get("trailingPE"),
                "pb_ratio": info.get("priceToBook"),
                "dividend_yield": info.get("dividendYield"),
                "market_cap": info.get("marketCap"),
                "revenue": info.get("totalRevenue"),
                "net_income": info.get("netIncomeToCommon"),
                "timestamp": datetime.now().isoformat()
            }
            
            # Cache the result
            if use_cache:
                self._cache[symbol] = (data, datetime.now())
            
            return data
        except Exception as e:
            logger.error(f"Error fetching Yahoo Finance data for {symbol}: {e}")
            return {"symbol": symbol, "error": str(e)}
    
    async def get_alpha_vantage_data(self, symbol: str) -> Dict:
        """Get additional data from Alpha Vantage API"""
        if not self.alpha_vantage_key:
            logger.warning("ALPHA_VANTAGE_API_KEY not found")
            return {}
        
        url = "https://www.alphavantage.co/query"
        params = {
            "function": "OVERVIEW",
            "symbol": symbol,
            "apikey": self.alpha_vantage_key
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Check for API limit message
                        if "Note" in data or "Error Message" in data:
                            logger.warning(f"Alpha Vantage API limit or error for {symbol}")
                            return {}
                        
                        return {
                            "symbol": symbol,
                            "sector": data.get("Sector"),
                            "industry": data.get("Industry"),
                            "peg_ratio": self._safe_float(data.get("PEGRatio")),
                            "eps": self._safe_float(data.get("EPS")),
                            "book_value": self._safe_float(data.get("BookValue")),
                            "dividend_per_share": self._safe_float(data.get("DividendPerShare")),
                            "revenue_per_share": self._safe_float(data.get("RevenuePerShareTTM")),
                            "profit_margin": self._safe_float(data.get("ProfitMargin")),
                            "operating_margin": self._safe_float(data.get("OperatingMarginTTM")),
                            "timestamp": datetime.now().isoformat()
                        }
                    else:
                        logger.error(f"Alpha Vantage API error: {response.status}")
                        return {}
        except Exception as e:
            logger.error(f"Alpha Vantage API error for {symbol}: {e}")
            return {}
    
    def _safe_float(self, value) -> Optional[float]:
        """Safely convert to float"""
        if value is None or value == "None":
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def calculate_fundamental_score(self, yahoo_data: Dict, alpha_data: Dict = None) -> Dict:
        """Calculate fundamental score (0-100)"""
        score = 0.0
        max_score = 100.0
        factors = []
        
        # 1. Revenue Growth (0-25 points)
        revenue_growth = yahoo_data.get("revenue_growth")
        if revenue_growth is not None:
            if revenue_growth > 0.20:  # >20% growth
                revenue_score = 25
            elif revenue_growth > 0.10:  # >10% growth
                revenue_score = 20
            elif revenue_growth > 0.05:  # >5% growth
                revenue_score = 15
            elif revenue_growth > 0:  # Positive growth
                revenue_score = 10
            else:
                revenue_score = max(0, 10 + int(revenue_growth * 100))  # Penalty for negative
            score += revenue_score
            factors.append(f"Revenue Growth: {revenue_score}/25")
        
        # 2. EPS Growth (0-25 points)
        earnings_growth = yahoo_data.get("earnings_growth")
        if earnings_growth is not None:
            if earnings_growth > 0.20:
                eps_score = 25
            elif earnings_growth > 0.10:
                eps_score = 20
            elif earnings_growth > 0.05:
                eps_score = 15
            elif earnings_growth > 0:
                eps_score = 10
            else:
                eps_score = max(0, 10 + int(earnings_growth * 100))
            score += eps_score
            factors.append(f"EPS Growth: {eps_score}/25")
        
        # 3. ROE (Return on Equity) (0-25 points)
        roe = yahoo_data.get("roe")
        if roe is not None:
            if roe > 0.20:  # >20% ROE
                roe_score = 25
            elif roe > 0.15:  # >15% ROE
                roe_score = 20
            elif roe > 0.10:  # >10% ROE
                roe_score = 15
            elif roe > 0.05:  # >5% ROE
                roe_score = 10
            else:
                roe_score = max(0, int(roe * 100))
            score += roe_score
            factors.append(f"ROE: {roe_score}/25")
        
        # 4. Debt/Equity Ratio (0-25 points) - Lower is better
        debt_equity = yahoo_data.get("debt_to_equity")
        if debt_equity is not None:
            if debt_equity < 0.3:  # Very low debt
                debt_score = 25
            elif debt_equity < 0.5:  # Low debt
                debt_score = 20
            elif debt_equity < 1.0:  # Moderate debt
                debt_score = 15
            elif debt_equity < 2.0:  # High debt
                debt_score = 10
            else:  # Very high debt
                debt_score = max(0, 10 - int((debt_equity - 2.0) * 5))
            score += debt_score
            factors.append(f"Debt/Equity: {debt_score}/25")
        
        # Ensure score is between 0 and 100
        score = max(0, min(100, score))
        
        return {
            "fundamental_score": round(score, 2),
            "max_score": max_score,
            "factors": factors,
            "revenue_growth": revenue_growth,
            "earnings_growth": earnings_growth,
            "roe": roe,
            "debt_to_equity": debt_equity,
            "timestamp": datetime.now().isoformat()
        }
    
    async def analyze_stock(self, symbol: str) -> Dict:
        """Complete fundamental analysis for a stock"""
        logger.info(f"Analyzing fundamentals for {symbol}")
        
        # Get Yahoo Finance data
        yahoo_data = self.get_yahoo_finance_data(symbol)
        
        if "error" in yahoo_data:
            # Return neutral score (50) instead of 0 if rate limited/error 
            # so we don't kill the overall recommendation
            return {
                "symbol": symbol,
                "fundamental_score": 50, 
                "error": yahoo_data.get("error"),
                "note": "Neutral score applied due to data fetch error"
            }
        
        # Get Alpha Vantage data (optional)
        alpha_data = await self.get_alpha_vantage_data(symbol)
        
        # Calculate score
        score_result = self.calculate_fundamental_score(yahoo_data, alpha_data)
        
        # Combine results
        result = {
            "symbol": symbol,
            **yahoo_data,
            **score_result,
            "alpha_vantage_data": alpha_data if alpha_data else None
        }
        
        return result
    
    async def analyze_multiple_stocks(self, symbols: List[str]) -> Dict[str, Dict]:
        """Analyze multiple stocks (optimized with caching)"""
        results = {}
        
        for symbol in symbols:
            try:
                result = await self.analyze_stock(symbol)
                results[symbol] = result
                # Reduced delay - caching helps avoid repeated API calls
                await asyncio.sleep(0.2)  # Reduced from 0.5 to 0.2
            except Exception as e:
                logger.error(f"Error analyzing {symbol}: {e}")
                results[symbol] = {
                    "symbol": symbol,
                    "fundamental_score": 0,
                    "error": str(e)
                }
        
        return results


if __name__ == "__main__":
    # Test fundamental scorer
    async def test():
        scorer = FundamentalScorer()
        result = await scorer.analyze_stock("RELIANCE")
        print(f"Fundamental Score: {result.get('fundamental_score')}")
        print(f"Factors: {result.get('factors')}")
    
    asyncio.run(test())
