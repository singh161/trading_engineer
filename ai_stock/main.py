"""
Main Orchestrator for Autonomous AI Stock Research Engine
Coordinates all modules to run the complete analysis pipeline
"""
import os
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path
import json

# Import all modules - handle both relative and absolute imports
import sys
from pathlib import Path

# Add ai_stock directory to path for imports
ai_stock_dir = Path(__file__).parent
sys.path.insert(0, str(ai_stock_dir))
sys.path.insert(0, str(ai_stock_dir.parent))

try:
    # Try relative imports first (when used as package)
    from .scrapers.web_research import WebResearchEngine
    from .nlp.sentiment_analyzer import SentimentAnalyzer
    from .ml.fundamental_scorer import FundamentalScorer
    from .ml.target_price_predictor import TargetPricePredictor
    from .ml.ranking_engine import RankingEngine
    from .api.alerts import AlertSystem
except ImportError:
    # Fallback to absolute imports (when run as script)
    from scrapers.web_research import WebResearchEngine
    from nlp.sentiment_analyzer import SentimentAnalyzer
    from ml.fundamental_scorer import FundamentalScorer
    from ml.target_price_predictor import TargetPricePredictor
    from ml.ranking_engine import RankingEngine
    from api.alerts import AlertSystem

# Import existing system components
try:
    from data_fetcher import StockDataFetcher
    from indicators import TechnicalIndicators
    from signals import SignalAnalyzer
    from ai_recommender import AIStockRecommender
    EXISTING_SYSTEM_AVAILABLE = True
except ImportError:
    EXISTING_SYSTEM_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Existing system components not available")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AIStockResearchEngine:
    """Main orchestrator for autonomous stock research - India Stocks Only"""
    
    # Popular Indian stocks (NSE listed)
    DEFAULT_INDIAN_STOCKS = [
        # Large Cap
        "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "BHARTIARTL",
        "SBIN", "BAJFINANCE", "WIPRO", "HINDUNILVR", "ITC", "KOTAKBANK",
        "LT", "AXISBANK", "MARUTI", "HCLTECH", "ASIANPAINT", "TITAN",
        "NESTLEIND", "ULTRACEMCO", "TATAMOTORS", "TATASTEEL", "JSWSTEEL",
        # Mid Cap
        "ADANIENT", "ADANIPORTS", "BAJAJFINSV", "DIVISLAB", "DRREDDY",
        "GRASIM", "HDFCLIFE", "HEROMOTOCO", "INDUSINDBK", "NTPC",
        "ONGC", "POWERGRID", "SUNPHARMA", "TECHM", "TATACONSUM"
    ]
    
    def __init__(self):
        # Initialize all modules
        self.web_research = WebResearchEngine()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.fundamental_scorer = FundamentalScorer()
        self.target_price_predictor = TargetPricePredictor()
        self.ranking_engine = RankingEngine()
        self.alert_system = AlertSystem()
        self.ai_recommender = AIStockRecommender() if EXISTING_SYSTEM_AVAILABLE else None
        
        # Data directory - Initialize FIRST before using it
        self.data_dir = Path(__file__).parent / "data"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Cache for results
        self.results_cache = {}
        
        # Initialize existing system components if available
        if EXISTING_SYSTEM_AVAILABLE:
            self.data_fetcher = StockDataFetcher()
        else:
            self.data_fetcher = None
        
        # Initialize new modules
        try:
            from .ml.risk_analyzer import RiskAnalyzer
            from .ml.sector_analyzer import SectorAnalyzer
            from .ml.news_decision_engine import NewsDecisionEngine
            from .utils.performance import CacheManager, ProgressTracker
            self.risk_analyzer = RiskAnalyzer()
            self.sector_analyzer = SectorAnalyzer()
            self.news_decision_engine = NewsDecisionEngine()
            self.cache_manager = CacheManager(self.data_dir / "cache", default_ttl=1800)  # 30 min cache
            self.progress_tracker = ProgressTracker()
        except ImportError:
            # Fallback to absolute imports
            try:
                from ml.risk_analyzer import RiskAnalyzer
                from ml.sector_analyzer import SectorAnalyzer
                from ml.news_decision_engine import NewsDecisionEngine
                from utils.performance import CacheManager, ProgressTracker
                self.risk_analyzer = RiskAnalyzer()
                self.sector_analyzer = SectorAnalyzer()
                self.news_decision_engine = NewsDecisionEngine()
                self.cache_manager = CacheManager(self.data_dir / "cache", default_ttl=1800)
                self.progress_tracker = ProgressTracker()
            except ImportError:
                logger.warning("Advanced modules not available. Some features disabled.")
                self.risk_analyzer = None
                self.sector_analyzer = None
                self.news_decision_engine = None
                self.cache_manager = None
                self.progress_tracker = None
        
        # Try to load previous results
        self._load_cached_results()
    
    @staticmethod
    def validate_indian_stock(symbol: str) -> bool:
        """
        Validate if symbol is an Indian stock (NSE/BSE)
        Removes .NS/.BO suffix if present for validation
        """
        # Remove exchange suffix if present
        clean_symbol = symbol.upper().replace('.NS', '').replace('.BO', '').strip()
        
        # Check if it's in our known list or follows Indian stock naming conventions
        # Indian stocks are typically 2-15 characters, alphanumeric, uppercase
        if len(clean_symbol) < 2 or len(clean_symbol) > 15:
            return False
        
        # Should be alphanumeric
        if not clean_symbol.replace('&', '').isalnum():
            return False
        
        # Common Indian stock patterns (all caps, no special chars except &)
        return True
    
    @staticmethod
    def filter_indian_stocks(symbols: List[str]) -> List[str]:
        """Filter and return only valid Indian stock symbols"""
        valid_stocks = []
        invalid_stocks = []
        
        for symbol in symbols:
            if AIStockResearchEngine.validate_indian_stock(symbol):
                # Normalize: remove .NS/.BO suffix, uppercase
                clean_symbol = symbol.upper().replace('.NS', '').replace('.BO', '').strip()
                valid_stocks.append(clean_symbol)
            else:
                invalid_stocks.append(symbol)
        
        if invalid_stocks:
            logger.warning(f"Filtered out non-Indian stocks: {invalid_stocks}")
        
        return valid_stocks
    
    async def collect_news(self, ticker_list: List[str] = None) -> List[Dict]:
        """Step 1: Collect news from web with quality filtering and caching"""
        logger.info("=" * 60)
        logger.info("STEP 1: Web Research - Collecting news...")
        logger.info("=" * 60)
        
        # Check cache first (cache news for 30 minutes)
        cache_key = f"news_collection_{datetime.now().strftime('%Y%m%d%H')}"  # Hourly cache
        if self.cache_manager:
            cached_news = self.cache_manager.get(cache_key)
            if cached_news:
                logger.info(f"Using cached news data ({len(cached_news)} items)")
                return cached_news
        
        results = await self.web_research.run_daily_collection()
        logger.info(f"Collected {len(results)} raw news items")
        
        # Improve news quality if filter available
        try:
            from .utils.news_filter import NewsFilter
            news_filter = NewsFilter()
            results = news_filter.improve_news_quality(results, ticker_list or [])
            logger.info(f"After filtering: {len(results)} high-quality news items")
        except ImportError:
            try:
                from utils.news_filter import NewsFilter
                news_filter = NewsFilter()
                results = news_filter.improve_news_quality(results, ticker_list or [])
                logger.info(f"After filtering: {len(results)} high-quality news items")
            except ImportError:
                logger.warning("News filter not available, using raw results")
        
        # Cache the results
        if self.cache_manager:
            self.cache_manager.set(cache_key, results, ttl=1800)  # 30 minutes cache
        
        return results
    
    async def analyze_sentiment(self, news_items: List[Dict], ticker_list: List[str]) -> Dict[str, Dict]:
        """Step 2: Analyze sentiment of news"""
        logger.info("=" * 60)
        logger.info("STEP 2: NLP Sentiment Analysis...")
        logger.info("=" * 60)
        
        sentiment_results = self.sentiment_analyzer.analyze_news_items(news_items, ticker_list)
        self.sentiment_analyzer.save_sentiment_scores(sentiment_results)
        
        # Aggregate by ticker
        ticker_sentiments = self.sentiment_analyzer.get_ticker_sentiment_summary(sentiment_results)
        logger.info(f"Analyzed sentiment for {len(ticker_sentiments)} tickers")
        
        return ticker_sentiments
    
    async def analyze_fundamentals(self, ticker_list: List[str]) -> Dict[str, Dict]:
        """Step 3: Analyze fundamentals (with parallel processing and caching)"""
        logger.info("=" * 60)
        logger.info("STEP 3: Fundamental Analysis (Parallel + Cached)...")
        logger.info("=" * 60)
        
        # Use parallel processing if available
        if self.progress_tracker:
            from .utils.performance import process_parallel
            
            async def analyze_single_stock(ticker: str):
                """Analyze single stock fundamentals"""
                try:
                    result = await self.fundamental_scorer.analyze_stock(ticker)
                    return result
                except Exception as e:
                    logger.error(f"Error analyzing {ticker}: {e}")
                    return None
            
            # Process in parallel (max 3 concurrent to avoid API rate limits)
            results = await process_parallel(
                ticker_list,
                analyze_single_stock,
                max_concurrent=3,
                progress_callback=lambda current, total: self.progress_tracker.update(
                    'fundamental_analysis', current, total, f"Analyzing fundamentals: {current}/{total}"
                )
            )
            
            # Convert to dictionary
            fundamental_results = {}
            for i, result in enumerate(results):
                if result and result.get('symbol'):
                    fundamental_results[result['symbol']] = result
        else:
            # Fallback to sequential (with caching built-in)
            fundamental_results = await self.fundamental_scorer.analyze_multiple_stocks(ticker_list)
        
        logger.info(f"Analyzed fundamentals for {len(fundamental_results)} stocks")
        
        return fundamental_results
    
    async def analyze_technical(self, ticker: str, mode: str = "swing") -> Optional[Dict]:
        """Analyze technical indicators for a stock"""
        if not self.data_fetcher:
            logger.warning("Data fetcher not available")
            return None
        
        try:
            # Fetch data
            df = await self.data_fetcher.fetch_data(ticker, mode=mode)
            if df is None or df.empty:
                return None
            
            # Calculate indicators
            indicators = TechnicalIndicators(df)
            df_with_indicators = indicators.calculate_all()
            indicators.df = df_with_indicators
            
            # Analyze signals
            analyzer = SignalAnalyzer(indicators)
            analysis = analyzer.analyze()
            
            # Get latest values
            values = indicators.get_latest_values()
            
            # Combine results
            result = {
                **analysis,
                **values,
                "symbol": ticker,
                "mode": mode
            }
            
            return result
        except Exception as e:
            logger.error(f"Error analyzing {ticker}: {e}")
            return None
    
    async def predict_target_price(self, ticker: str, technical_data: Dict,
                                  sentiment_data: Dict, fundamental_data: Dict) -> Dict:
        """Step 4: Predict target price using ML"""
        logger.info(f"Predicting target price for {ticker}...")
        
        # Extract scores
        sentiment_score = sentiment_data.get('avg_sentiment_score', 0.0)
        fundamental_score = fundamental_data.get('fundamental_score', 50.0)
        
        # Prepare technical data for ML model
        tech_for_ml = {
            'rsi': technical_data.get('rsi', 50.0),
            'macd': technical_data.get('macd', 0.0),
            'macd_hist': technical_data.get('macd_hist', 0.0),
            'volume_change': technical_data.get('volume_change', 0.0),
            'price_change_pct': technical_data.get('price_change_pct', 0.0),
            'price': technical_data.get('price', 0.0),
            'ema_20': technical_data.get('ema_20', 0.0),
            'ema_50': technical_data.get('ema_50', 0.0),
            'trend': technical_data.get('trend', 'NEUTRAL')
        }
        
        # Predict
        prediction = self.target_price_predictor.predict(
            tech_for_ml, sentiment_score, fundamental_score
        )
        
        return prediction
    
    async def rank_stocks(self, stocks_data: List[Dict]) -> Dict:
        """Step 5: Rank stocks"""
        logger.info("=" * 60)
        logger.info("STEP 5: Smart Ranking...")
        logger.info("=" * 60)
        
        ranking_results = self.ranking_engine.rank_stocks(stocks_data)
        
        logger.info(f"Top 5 BUY: {[s['symbol'] for s in ranking_results['top_5_buy']]}")
        logger.info(f"Top 5 SELL: {[s['symbol'] for s in ranking_results['top_5_sell']]}")
        
        return ranking_results
    
    async def send_alerts(self, ranking_results: Dict):
        """Step 6: Send alerts"""
        logger.info("=" * 60)
        logger.info("STEP 6: Sending Alerts...")
        logger.info("=" * 60)
        
        # Send top stocks alert
        self.alert_system.send_top_stocks_alert(ranking_results)
        
        # Send individual alerts for top BUY stocks
        for stock in ranking_results.get('top_5_buy', [])[:3]:  # Top 3 only
            self.alert_system.send_stock_alert(stock)
        
        logger.info("Alerts sent")
    
    async def run_complete_analysis(self, ticker_list: List[str], 
                                   send_alerts: bool = True) -> Dict:
        """Run complete autonomous analysis pipeline"""
        logger.info("=" * 60)
        logger.info("STARTING AUTONOMOUS AI STOCK RESEARCH ENGINE")
        logger.info("=" * 60)
        logger.info(f"Analyzing {len(ticker_list)} stocks")
        logger.info(f"Timestamp: {datetime.now().isoformat()}")
        
        start_time = datetime.now()
        
        try:
            # Step 1: Collect news (with ticker list for better filtering)
            news_items = await self.collect_news(ticker_list)
            
            # Step 2: Analyze sentiment
            ticker_sentiments = await self.analyze_sentiment(news_items, ticker_list)
            
            # Step 2B: News-based decisions (if available)
            news_decisions = {}
            if self.news_decision_engine:
                logger.info("=" * 60)
                logger.info("STEP 2B: News-Based Decision Making...")
                logger.info("=" * 60)
                try:
                    # Get sentiment results with news items
                    import json
                    sentiment_file = self.data_dir / "sentiment_scores.json"
                    if sentiment_file.exists():
                        with open(sentiment_file, 'r', encoding='utf-8') as f:
                            sentiment_data = json.load(f)
                        if sentiment_data:
                            latest_sentiment = sentiment_data[-1]
                            news_with_sentiment = latest_sentiment.get('results', [])
                            news_decisions = self.news_decision_engine.make_batch_decisions(
                                news_with_sentiment, ticker_list
                            )
                            logger.info(f"Made news-based decisions for {len(news_decisions)} stocks")
                except Exception as e:
                    logger.warning(f"News decision engine error: {e}")
            
            # Step 3: Analyze fundamentals
            fundamental_results = await self.analyze_fundamentals(ticker_list)
            
            # Step 4: Analyze technical indicators and predict target prices (PARALLEL PROCESSING)
            logger.info("=" * 60)
            logger.info("STEP 4: Technical Analysis & Target Price Prediction (Parallel)...")
            logger.info("=" * 60)
            
            # Process stocks in parallel for faster execution
            async def process_stock(ticker: str) -> Optional[Dict]:
                """Process a single stock"""
                try:
                    # Technical analysis
                    technical_data = await self.analyze_technical(ticker)
                    if not technical_data:
                        return None
                    
                    # Get sentiment and fundamental data
                    sentiment_data = ticker_sentiments.get(ticker, {
                        'avg_sentiment_score': 0.0,
                        'avg_confidence': 0.0,
                        'total_news': 0
                    })
                    
                    fundamental_data = fundamental_results.get(ticker, {
                        'fundamental_score': 50.0
                    })
                    
                    # Predict target price
                    target_price_data = await self.predict_target_price(
                        ticker, technical_data, sentiment_data, fundamental_data
                    )
                                     # Advanced Intelligence Recommendation (AI Accuracy Multiplier)
                    ai_recommendation = {}
                    if self.ai_recommender:
                        try:
                            # Use the advanced AI logic for accurate final check
                            ai_recommendation = self.ai_recommender.generate_recommendation(technical_data)
                        except Exception as e:
                            logger.error(f"AI Recommender fail for {ticker}: {e}")

                    # Calculate initial ranking data
                    ranking_data = self.ranking_engine.calculate_final_score(
                        technical_data, sentiment_data, fundamental_data
                    )
                    
                    # Update ranking data with AI Intelligence features
                    if ai_recommendation:
                        # Cross-verify Ranking vs AI Accuracy
                        confidence = ai_recommendation.get('confidence_score', 50)
                        prob = ai_recommendation.get('success_probability', 50)
                        
                        # Accuracy Filter: If AI detects divergence or exhaustion, penalize the final score
                        if ai_recommendation.get('divergence_signal') != 'NONE':
                            ranking_data['final_score'] *= 0.8
                            logger.info(f"Penalty for {ticker}: Divergence detected.")
                        
                        if ai_recommendation.get('exhaustion_risk') != 'NONE':
                            ranking_data['final_score'] *= 0.85
                            logger.info(f"Penalty for {ticker}: Trend exhaustion risk.")

                    # Get news-based decision if available
                    current_news_decision = news_decisions.get(ticker, {})

                    # Get risk analysis if available
                    risk_data = {}
                    if self.risk_analyzer:
                        risk_data = self.risk_analyzer.calculate_overall_risk(
                            technical_data, fundamental_data
                        )
                    
                    # Get sector analysis if available (this is usually done for all stocks together)
                    # For individual stock, we'll just pass an empty dict or placeholder
                    sector_data = {}

                    stock_data = {
                        "symbol": ticker,
                        "technical_analysis": technical_data,
                        "sentiment_analysis": sentiment_data,
                        "fundamental_analysis": fundamental_data,
                        "risk_analysis": risk_data,
                        "sector_analysis": sector_data, # Placeholder, actual sector analysis is batched
                        "news_decisions": current_news_decision,
                        "ai_recommendation": ai_recommendation, # Add new AI logic output
                        "final_score": ranking_data, # This now holds the final score and recommendation
                        "target_price": target_price_data,
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    return stock_data
                    
                except Exception as e:
                    logger.error(f"Error processing {ticker}: {e}")
                    return None
            
            # Use parallel processing utility if available
            if self.progress_tracker:
                from .utils.performance import process_parallel
                stocks_data = await process_parallel(
                    ticker_list,
                    process_stock,
                    max_concurrent=5,  # Process 5 stocks concurrently
                    progress_callback=lambda current, total: self.progress_tracker.update(
                        'stock_analysis', current, total, f"Processing stocks: {current}/{total}"
                    )
                )
                # Filter out None results
                stocks_data = [s for s in stocks_data if s is not None]
            else:
                # Fallback to sequential processing
                stocks_data = []
                for i, ticker in enumerate(ticker_list):
                    result = await process_stock(ticker)
                    if result:
                        stocks_data.append(result)
                    # Reduced delay for sequential processing
                    if i < len(ticker_list) - 1:
                        await asyncio.sleep(0.1)  # Reduced from 0.5 to 0.1
            
            # Step 5: Risk Analysis (if available) - This was moved inside process_stock
            # The risk_analyzer is now called for each stock within process_stock
            
            # Step 5B: Sector Analysis (if available)
            sector_results = {}
            if self.sector_analyzer:
                logger.info("=" * 60)
                logger.info("STEP 5B: Sector Analysis...")
                logger.info("=" * 60)
                sector_results = self.sector_analyzer.analyze_sector_performance(stocks_data)
                logger.info(f"Sector analysis complete: {len(sector_results.get('sector_analysis', {}))} sectors analyzed")
            
            # Step 6: Rank stocks
            ranking_results = await self.rank_stocks(stocks_data)
            
            # Add sector analysis to results if available
            if self.sector_analyzer:
                ranking_results['sector_analysis'] = sector_results
            
            # Step 7: Send alerts
            if send_alerts:
                logger.info("=" * 60)
                logger.info("STEP 6: Sending Alerts...")
                logger.info("=" * 60)
                
                # Send top stocks alert
                self.alert_system.send_top_stocks_alert(ranking_results)
                
                # Send individual alerts for top BUY stocks with AI verification
                for stock in ranking_results.get('top_5_buy', [])[:3]:  # Top 3 only
                    ticker = stock['symbol']
                    ranking_data = stock['final_score'] # Assuming final_score now contains the full ranking data
                    ai_recommendation = stock.get('ai_recommendation', {})

                    # Alert Logic with AI Verification (Accuracy Check)
                    # Use a combination of original ranking and new AI intelligence
                    if ranking_data["final_score"] >= 80: # Assuming 80 is a high score threshold
                        is_verified = True
                        if ai_recommendation:
                            # Only send alert if AI Recommender has at least medium confidence 
                            # and no extreme exhaustion risk for BUY signals
                            conf = ai_recommendation.get('confidence_score', 0)
                            if conf < 65:
                                is_verified = False
                                logger.warning(f"Alert suppressed for {ticker}: Low AI Confidence ({conf})")
                                
                            if ai_recommendation.get('exhaustion_risk') == 'EXTREME':
                                is_verified = False
                                logger.warning(f"Alert suppressed for {ticker}: Trend exhaustion risk.")
                        
                        if is_verified:
                            # Pass AI recommendation to alert system if needed
                            await self.alert_system.send_stock_alert({**ranking_data, "ai_rec": ai_recommendation})
            
            # Calculate execution time
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            
            # Prepare final results
            final_results = {
                "status": "success",
                "execution_time_seconds": execution_time,
                "stocks_analyzed": len(stocks_data),
                "ranking_results": ranking_results,
                "timestamp": datetime.now().isoformat(),
                "features": {
                    "risk_analysis": self.risk_analyzer is not None,
                    "sector_analysis": self.sector_analyzer is not None,
                    "news_decision": self.news_decision_engine is not None,
                    "caching": self.cache_manager is not None
                },
                "news_decisions": news_decisions if news_decisions else {}
            }
            
            # Cache results
            self.results_cache = final_results
            
            # Save results to file
            results_file = self.data_dir / "analysis_results.json"
            with open(results_file, 'w', encoding='utf-8') as f:
                json.dump(final_results, f, indent=2, ensure_ascii=False, default=str)
            
            logger.info("=" * 60)
            logger.info("ANALYSIS COMPLETE")
            logger.info(f"Execution time: {execution_time:.2f} seconds")
            logger.info("=" * 60)
            
            return final_results
            
        except Exception as e:
            logger.error(f"Error in complete analysis: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _load_cached_results(self):
        """Load cached results from file if available (optimized)"""
        try:
            results_file = self.data_dir / "analysis_results.json"
            if results_file.exists():
                # Check file size - if too large, load only essential parts
                file_size = results_file.stat().st_size
                if file_size > 10 * 1024 * 1024:  # > 10MB
                    logger.warning(f"Results file is large ({file_size / 1024 / 1024:.1f}MB), loading essential parts only")
                    # Load only ranking_results for faster loading
                    with open(results_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    self.results_cache = {
                        'ranking_results': data.get('ranking_results', {}),
                        'timestamp': data.get('timestamp'),
                        'stocks_analyzed': data.get('stocks_analyzed', 0)
                    }
                else:
                    with open(results_file, 'r', encoding='utf-8') as f:
                        self.results_cache = json.load(f)
                logger.info(f"Loaded cached results from {results_file}")
        except Exception as e:
            logger.warning(f"Could not load cached results: {e}")
            self.results_cache = {}
    
    def get_recommendations(self) -> Dict:
        """Get cached recommendations, load from file if cache is empty (optimized)"""
        # Check memory cache first (fastest)
        if self.results_cache and self.results_cache.get('ranking_results'):
            return self.results_cache.get('ranking_results', {})
        
        # If cache is empty, try to load from file
        self._load_cached_results()
        
        return self.results_cache.get('ranking_results', {})


async def main():
    """Main entry point - India stocks only"""
    # Use default Indian stocks
    ticker_list = AIStockResearchEngine.DEFAULT_INDIAN_STOCKS[:10]  # Top 10
    
    engine = AIStockResearchEngine()
    results = await engine.run_complete_analysis(ticker_list, send_alerts=False)
    
    # Print summary
    ranking = results.get('ranking_results', {})
    print("\n" + "=" * 60)
    print("TOP 5 BUY RECOMMENDATIONS:")
    print("=" * 60)
    for stock in ranking.get('top_5_buy', []):
        print(f"{stock['symbol']}: Score {stock['final_score']:.1f} - {stock['recommendation']}")
    
    print("\n" + "=" * 60)
    print("TOP 5 SELL RECOMMENDATIONS:")
    print("=" * 60)
    for stock in ranking.get('top_5_sell', []):
        print(f"{stock['symbol']}: Score {stock['final_score']:.1f} - {stock['recommendation']}")


if __name__ == "__main__":
    asyncio.run(main())
