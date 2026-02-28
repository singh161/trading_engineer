"""
Integration module to add AI Stock Research Engine endpoints to existing FastAPI app
"""
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query, Body
from typing import List, Dict, Optional
import logging
import asyncio

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

try:
    from ai_stock.main import AIStockResearchEngine
    from ai_stock.api.endpoints import create_endpoints
except ImportError as e:
    # Fallback: try relative imports
    import importlib.util
    main_path = Path(__file__).parent / "main.py"
    spec = importlib.util.spec_from_file_location("ai_stock.main", main_path)
    if spec and spec.loader:
        ai_stock_main = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(ai_stock_main)
        AIStockResearchEngine = ai_stock_main.AIStockResearchEngine
    else:
        raise ImportError(f"Could not import AIStockResearchEngine: {e}")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global engine instance
ai_engine: Optional[AIStockResearchEngine] = None


def initialize_ai_engine():
    """Initialize the AI Stock Research Engine"""
    global ai_engine
    if ai_engine is None:
        logger.info("Initializing AI Stock Research Engine...")
        ai_engine = AIStockResearchEngine()
    return ai_engine


def add_ai_endpoints(app: FastAPI):
    """Add AI Stock Research Engine endpoints to existing FastAPI app"""
    
    logger.info("Registering AI Stock Research Engine endpoints...")
    
    @app.post("/ai/run-analysis")
    async def run_ai_analysis(
        tickers: Optional[List[str]] = Body(None, description="List of stock symbols to analyze"),
        send_alerts: bool = Query(False, description="Send email/Telegram alerts")
    ):
        """
        Run complete AI Stock Research Engine analysis
        
        Args:
            tickers: List of stock symbols to analyze (optional, defaults to popular stocks)
            send_alerts: Whether to send alerts after analysis
        
        Returns:
            Complete analysis results with rankings
        """
        try:
            # Default Indian stocks if not provided
            if not tickers:
                from ai_stock.main import AIStockResearchEngine
                tickers = AIStockResearchEngine.DEFAULT_INDIAN_STOCKS[:15]  # Top 15 Indian stocks
            
            # Validate and filter to only Indian stocks
            from ai_stock.main import AIStockResearchEngine
            tickers = AIStockResearchEngine.filter_indian_stocks(tickers)
            
            if not tickers:
                raise HTTPException(
                    status_code=400, 
                    detail="No valid Indian stocks provided. Please provide NSE/BSE stock symbols."
                )
            
            engine = initialize_ai_engine()
            logger.info(f"Running analysis for {len(tickers)} stocks: {tickers}")
            results = await engine.run_complete_analysis(tickers, send_alerts=send_alerts)
            
            # Ensure results are cached
            if results.get('status') == 'success':
                logger.info(f"Analysis complete: {results.get('stocks_analyzed', 0)} stocks analyzed")
            
            return results
        except Exception as e:
            logger.error(f"Error running AI analysis: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/ai/recommendations")
    async def get_ai_recommendations(
        limit: int = Query(5, ge=1, le=100, description="Number of recommendations per category")
    ):
        """
        Get AI-powered stock recommendations
        
        Returns top BUY, HOLD, and SELL stocks based on comprehensive analysis
        """
        try:
            engine = initialize_ai_engine()
            recommendations = engine.get_recommendations()
            
            if not recommendations:
                return {
                    "message": "No recommendations available. Run /ai/run-analysis first.",
                    "top_buy": [],
                    "top_hold": [],
                    "top_sell": [],
                    "all_ranked": []
                }
            
            # Return in format expected by frontend
            return {
                "top_buy": recommendations.get('top_5_buy', [])[:limit],
                "top_hold": recommendations.get('top_5_hold', [])[:limit],
                "top_sell": recommendations.get('top_5_sell', [])[:limit],
                # Frontend compatibility keys
                "top_5_buy": recommendations.get('top_5_buy', [])[:limit],
                "top_5_hold": recommendations.get('top_5_hold', [])[:limit],
                "top_5_sell": recommendations.get('top_5_sell', [])[:limit],
                "all_ranked": recommendations.get('all_ranked', []),
                "timestamp": recommendations.get('timestamp')
            }
        except Exception as e:
            logger.error(f"Error getting AI recommendations: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/ai/top-stocks")
    async def get_ai_top_stocks(
        category: str = Query("buy", regex="^(buy|hold|sell)$"),
        limit: int = Query(5, ge=1, le=20)
    ):
        """
        Get top stocks by category (buy/hold/sell)
        """
        try:
            engine = initialize_ai_engine()
            recommendations = engine.get_recommendations()
            
            if not recommendations:
                return {
                    "message": "No recommendations available. Run /ai/run-analysis first.",
                    "stocks": []
                }
            
            category_key = f"top_5_{category}"
            stocks = recommendations.get(category_key, [])[:limit]
            
            return {
                "category": category,
                "stocks": stocks,
                "count": len(stocks)
            }
        except Exception as e:
            logger.error(f"Error getting top stocks: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/ai/news")
    async def get_ai_news(
        ticker: Optional[str] = Query(None, description="Filter by ticker symbol"),
        limit: int = Query(20, ge=1, le=100)
    ):
        """
        Get collected news with sentiment analysis
        """
        try:
            import json
            from pathlib import Path
            
            sentiment_file = Path(__file__).parent / "data" / "sentiment_scores.json"
            
            if not sentiment_file.exists():
                return {
                    "message": "No news data available. Run /ai/run-analysis first.",
                    "news": []
                }
            
            with open(sentiment_file, 'r', encoding='utf-8') as f:
                sentiment_data = json.load(f)
            
            # Get latest sentiment results
            if sentiment_data:
                latest = sentiment_data[-1]
                news_items = latest.get('results', [])
                
                # Filter by ticker if provided
                if ticker:
                    news_items = [item for item in news_items if item.get('ticker') == ticker.upper()]
                
                return {
                    "news": news_items[:limit],
                    "total": len(news_items),
                    "date": latest.get('date')
                }
            
            return {"news": []}
        except Exception as e:
            logger.error(f"Error getting news: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/ai/risk-analysis")
    async def get_risk_analysis(
        ticker: Optional[str] = Query(None, description="Filter by ticker symbol")
    ):
        """
        Get risk analysis data for stocks
        """
        try:
            import json
            from pathlib import Path
            
            # Try to load from analysis_results.json to get all stocks
            results_file = Path(__file__).parent / "data" / "analysis_results.json"
            risk_data = []
            
            if results_file.exists():
                with open(results_file, 'r', encoding='utf-8') as f:
                    results = json.load(f)
                ranking_results = results.get('ranking_results', {})
                
                # Get all stocks from all categories
                all_stocks = (
                    ranking_results.get('top_5_buy', []) +
                    ranking_results.get('top_5_hold', []) +
                    ranking_results.get('top_5_sell', [])
                )
                
                # Extract risk data or calculate on-the-fly if missing
                engine = initialize_ai_engine()
                has_risk_analyzer = engine.risk_analyzer is not None
                
                for stock in all_stocks:
                    risk_analysis = stock.get('risk_analysis')
                    
                    # If risk_analysis is missing but we have risk_analyzer, calculate it
                    if not risk_analysis and has_risk_analyzer:
                        technical_data = stock.get('technical_analysis', {})
                        fundamental_data = stock.get('fundamental_analysis', {})
                        if technical_data and fundamental_data:
                            try:
                                risk_analysis = engine.risk_analyzer.calculate_overall_risk(
                                    technical_data, fundamental_data
                                )
                            except Exception as e:
                                logger.warning(f"Could not calculate risk for {stock.get('symbol')}: {e}")
                                continue
                    
                    if risk_analysis:
                        final_score = stock.get('final_score', {})
                        if isinstance(final_score, dict):
                            final_score = final_score.get('final_score', 0)
                        else:
                            final_score = final_score or 0
                        
                        risk_item = {
                            'symbol': stock.get('symbol'),
                            'recommendation': stock.get('recommendation', 'HOLD'),
                            'final_score': final_score,
                            **risk_analysis
                        }
                        if not ticker or risk_item['symbol'] == ticker.upper():
                            risk_data.append(risk_item)
            
            # Fallback to recommendations if file doesn't exist
            if not risk_data:
                engine = initialize_ai_engine()
                recommendations = engine.get_recommendations()
                
                if recommendations:
                    all_stocks = (
                        recommendations.get('top_5_buy', []) +
                        recommendations.get('top_5_hold', []) +
                        recommendations.get('top_5_sell', [])
                    )
                    
                    for stock in all_stocks:
                        risk_analysis = stock.get('risk_analysis')
                        if risk_analysis:
                            final_score = stock.get('final_score', {})
                            if isinstance(final_score, dict):
                                final_score = final_score.get('final_score', 0)
                            else:
                                final_score = final_score or 0
                            
                            risk_item = {
                                'symbol': stock.get('symbol'),
                                'recommendation': stock.get('recommendation', 'HOLD'),
                                'final_score': final_score,
                                **risk_analysis
                            }
                            if not ticker or risk_item['symbol'] == ticker.upper():
                                risk_data.append(risk_item)
            
            if not risk_data:
                return {
                    "message": "No risk analysis available. Please run 'Complete Analysis' first to generate risk data. If you just ran analysis, the risk analyzer module may not be available.",
                    "risk_data": [],
                    "suggestion": "Try running the analysis again or check if risk_analyzer module is properly installed."
                }
            
            return {
                "risk_data": risk_data,
                "count": len(risk_data),
                "timestamp": results.get('timestamp') if results_file.exists() else None
            }
        except Exception as e:
            logger.error(f"Error getting risk analysis: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/ai/sector-analysis")
    async def get_sector_analysis():
        """
        Get sector analysis data
        """
        try:
            import json
            from pathlib import Path
            
            # Try loading from analysis_results.json first
            results_file = Path(__file__).parent / "data" / "analysis_results.json"
            sector_analysis = None
            
            if results_file.exists():
                with open(results_file, 'r', encoding='utf-8') as f:
                    results = json.load(f)
                ranking_results = results.get('ranking_results', {})
                sector_analysis = ranking_results.get('sector_analysis', {})
            
            # Fallback to recommendations if file doesn't exist
            if not sector_analysis:
                engine = initialize_ai_engine()
                recommendations = engine.get_recommendations()
                if recommendations:
                    sector_analysis = recommendations.get('sector_analysis', {})
            
            if not sector_analysis or (isinstance(sector_analysis, dict) and not sector_analysis.get('sector_analysis')):
                return {
                    "message": "No sector analysis available. Run /ai/run-analysis first.",
                    "sector_data": {}
                }
            
            # Handle both dict format and direct format
            if isinstance(sector_analysis, dict):
                sector_data = sector_analysis.get('sector_analysis', sector_analysis)
                top_sector = sector_analysis.get('top_sector')
                worst_sector = sector_analysis.get('worst_sector')
                timestamp = sector_analysis.get('timestamp')
            else:
                sector_data = {}
                top_sector = None
                worst_sector = None
                timestamp = None
            
            return {
                "sector_data": sector_data if isinstance(sector_data, dict) else {},
                "top_sector": top_sector,
                "worst_sector": worst_sector,
                "timestamp": timestamp
            }
        except Exception as e:
            logger.error(f"Error getting sector analysis: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/ai/news-decisions")
    async def get_news_decisions(
        ticker: Optional[str] = Query(None, description="Filter by ticker symbol"),
        category: Optional[str] = Query(None, description="Filter by decision category (BUY/SELL/HOLD)")
    ):
        """
        Get news-based trading decisions
        """
        try:
            import json
            from pathlib import Path
            
            results_file = Path(__file__).parent / "data" / "analysis_results.json"
            news_decisions = {}
            
            if results_file.exists():
                with open(results_file, 'r', encoding='utf-8') as f:
                    results = json.load(f)
                news_decisions = results.get('news_decisions', {})
            
            # Filter by ticker if provided
            if ticker:
                news_decisions = {k: v for k, v in news_decisions.items() if k.upper() == ticker.upper()}
            
            # Filter by category if provided
            if category:
                news_decisions = {
                    k: v for k, v in news_decisions.items()
                    if category.upper() in v.get('recommendation', '').upper()
                }
            
            if not news_decisions:
                return {
                    "message": "No news-based decisions available. Run /ai/run-analysis first.",
                    "decisions": []
                }
            
            decisions_list = list(news_decisions.values())
            
            # Sort by confidence
            decisions_list.sort(key=lambda x: x.get('confidence', 0), reverse=True)
            
            return {
                "decisions": decisions_list,
                "count": len(decisions_list),
                "timestamp": results.get('timestamp') if results_file.exists() else None
            }
        except Exception as e:
            logger.error(f"Error getting news decisions: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/ai/sector-ranking")
    async def get_sector_ranking(
        category: Optional[str] = Query(None, description="Filter by recommendation category"),
        limit: int = Query(10, ge=1, le=50, description="Number of sectors to return")
    ):
        """
        Get ranked sectors with detailed information
        """
        try:
            import json
            from pathlib import Path
            
            results_file = Path(__file__).parent / "data" / "analysis_results.json"
            sector_analysis = None
            
            if results_file.exists():
                with open(results_file, 'r', encoding='utf-8') as f:
                    results = json.load(f)
                ranking_results = results.get('ranking_results', {})
                sector_analysis = ranking_results.get('sector_analysis', {})
            
            if not sector_analysis or not isinstance(sector_analysis, dict):
                return {
                    "message": "No sector ranking available. Run /ai/run-analysis first.",
                    "ranked_sectors": []
                }
            
            ranked_sectors = sector_analysis.get('ranked_sectors', [])
            
            # Filter by category if provided
            if category:
                ranked_sectors = [
                    s for s in ranked_sectors
                    if category.upper() in s.get('recommendation', '').upper()
                ]
            
            # Limit results
            ranked_sectors = ranked_sectors[:limit]
            
            # Get summary
            from ai_stock.ml.sector_analyzer import SectorAnalyzer
            sector_analyzer = SectorAnalyzer()
            summary = sector_analyzer.get_sector_ranking_summary(sector_analysis)
            
            return {
                "ranked_sectors": ranked_sectors,
                "summary": summary,
                "count": len(ranked_sectors),
                "timestamp": sector_analysis.get('timestamp')
            }
        except Exception as e:
            logger.error(f"Error getting sector ranking: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/ai/target-prices")
    async def get_target_prices(
        ticker: Optional[str] = Query(None, description="Filter by ticker symbol"),
        min_confidence: float = Query(0.0, ge=0.0, le=1.0, description="Minimum confidence threshold")
    ):
        """
        Get enhanced target price predictions
        """
        try:
            engine = initialize_ai_engine()
            recommendations = engine.get_recommendations()
            
            if not recommendations:
                return {
                    "message": "No target price predictions available. Run /ai/run-analysis first.",
                    "predictions": []
                }
            
            all_stocks = (
                recommendations.get('top_5_buy', []) +
                recommendations.get('top_5_hold', []) +
                recommendations.get('top_5_sell', [])
            )
            
            predictions = []
            for stock in all_stocks:
                target_price_data = stock.get('target_price', {})
                if target_price_data:
                    prediction = {
                        'symbol': stock.get('symbol'),
                        'current_price': target_price_data.get('current_price', stock.get('current_price', 0)),
                        'target_price': target_price_data.get('target_price', 0),
                        'price_change_pct': target_price_data.get('price_change_pct', 0),
                        'confidence': target_price_data.get('confidence', 0),
                        'model_used': target_price_data.get('model_used', 'unknown'),
                        'recommendation': stock.get('recommendation', 'HOLD'),
                        'final_score': stock.get('final_score', {}).get('final_score', 0) if isinstance(stock.get('final_score'), dict) else stock.get('final_score', 0)
                    }
                    
                    # Filter by ticker
                    if ticker and prediction['symbol'] != ticker.upper():
                        continue
                    
                    # Filter by confidence
                    if prediction['confidence'] < min_confidence:
                        continue
                    
                    predictions.append(prediction)
            
            # Sort by potential gain
            predictions.sort(key=lambda x: x.get('price_change_pct', 0), reverse=True)
            
            return {
                "predictions": predictions,
                "count": len(predictions),
                "timestamp": recommendations.get('timestamp')
            }
        except Exception as e:
            logger.error(f"Error getting target prices: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/ai/config-status")
    async def get_config_status():
        """
        Check if critical AI Engine services are configured (SMTP, Telegram, etc.)
        """
        from config import (
            SMTP_USERNAME, SMTP_PASSWORD, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
        )
        
        return {
            "email_configured": bool(SMTP_USERNAME and SMTP_PASSWORD),
            "telegram_configured": bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID),
            "news_api_configured": bool(os.getenv("NEWSAPI_KEY")),
            "timestamp": datetime.now().isoformat()
        }

    @app.post("/ai/voice-command")
    async def process_voice_command(
        request: Dict = Body(..., description="Voice command request with 'command' field")
    ):
        """
        Process voice command and return structured ACTION JSON
        
        This endpoint:
        1. Normalizes Hindi/Hinglish text to English
        2. Detects intent using ML-based similarity matching
        3. Extracts entities (stocks, sectors, limits)
        4. Returns structured ACTION JSON for frontend execution
        
        Returns ONLY action JSON, NOT chatty text responses.
        """
        try:
            from ai_stock.nlp.voice_nlp import VoiceNLPProcessor
            from ai_stock.nlp.intent_detector import IntentDetector
            
            # Extract command from request
            command = request.get('command', '') if isinstance(request, dict) else str(request)
            if not command:
                return {
                    "action": "ERROR",
                    "params": {
                        "message": "No command provided"
                    }
                }
            
            # Initialize processors
            nlp_processor = VoiceNLPProcessor()
            intent_detector = IntentDetector()
            
            # Normalize and extract entities
            entities = nlp_processor.extract_entities(command)
            
            # Detect intent
            intent, confidence = intent_detector.detect_intent(
                entities['normalized_text'],
                confidence_threshold=0.4  # Lower threshold for voice commands
            )
            
            # If no intent detected, try with original text
            if not intent:
                intent, confidence = intent_detector.detect_intent(
                    command,
                    confidence_threshold=0.3
                )
            
            # If still no intent, return error action
            if not intent or confidence < 0.3:
                return {
                    "action": "ERROR",
                    "params": {
                        "message": "Could not understand command. Please try again.",
                        "confidence": confidence or 0.0
                    }
                }
            
            # Build action JSON based on intent
            action_params = {}
            
            if intent == "RUN_ANALYSIS":
                action_params = {
                    "endpoint": "/ai/run-analysis",
                    "method": "POST"
                }
            
            elif intent == "SHOW_SECTOR_RANKING":
                action_params = {
                    "action_type": "NAVIGATE_AND_FILTER",
                    "route": "/ai-research",
                    "tab": "sector-ranking",
                    "filters": {}
                }
                
                # Add sector filter if detected
                if entities['sector']:
                    action_params["filters"]["category"] = entities['sector']
                
                # Add limit if detected
                if entities['limit']:
                    action_params["filters"]["limit"] = entities['limit']
                elif entities['sector']:
                    # Default limit for sector ranking
                    action_params["filters"]["limit"] = 10
            
            elif intent == "COMPARE_STOCKS":
                if len(entities['stocks']) >= 2:
                    action_params = {
                        "action_type": "COMPARE",
                        "stocks": entities['stocks'][:2]  # Limit to 2 stocks
                    }
                else:
                    return {
                        "action": "ERROR",
                        "params": {
                            "message": "Please specify at least 2 stocks to compare."
                        }
                    }
            
            elif intent == "SHOW_TARGET_PRICE":
                action_params = {
                    "action_type": "NAVIGATE_AND_FILTER",
                    "route": "/ai-research",
                    "tab": "target",
                    "filters": {}
                }
                
                # Add stock filter if detected
                if entities['stocks']:
                    action_params["filters"]["ticker"] = entities['stocks'][0]
            
            elif intent == "SHOW_RISK_ANALYSIS":
                action_params = {
                    "action_type": "NAVIGATE_AND_FILTER",
                    "route": "/ai-research",
                    "tab": "risk",
                    "filters": {}
                }
                
                # Add stock filter if detected
                if entities['stocks']:
                    action_params["filters"]["ticker"] = entities['stocks'][0]
            
            elif intent == "SHOW_SECTOR_ANALYSIS":
                action_params = {
                    "action_type": "NAVIGATE_AND_FILTER",
                    "route": "/ai-research",
                    "tab": "sector"
                }
            
            elif intent == "SHOW_NEWS":
                action_params = {
                    "action_type": "NAVIGATE_AND_FILTER",
                    "route": "/ai-research",
                    "tab": "news",
                    "filters": {}
                }
                
                # Add stock filter if detected
                if entities['stocks']:
                    action_params["filters"]["ticker"] = entities['stocks'][0]
            
            elif intent == "SHOW_BEST_STOCKS":
                action_params = {
                    "action_type": "NAVIGATE_AND_FILTER",
                    "route": "/ai-research",
                    "tab": "rankings",
                    "filters": {}
                }
            
            elif intent == "ANALYZE_STOCK":
                action_params = {
                    "action_type": "ANALYZE",
                    "stocks": entities['stocks'] if entities['stocks'] else [],
                    "route": "/analyze"
                }
            
            elif intent == "MARKET_TREND":
                action_params = {
                    "action_type": "MARKET_INDEX",
                    "route": "/market-index"
                }
            
            elif intent == "SHOW_MOMENTUM_STOCKS":
                action_params = {
                    "action_type": "NAVIGATE",
                    "route": "/momentum",
                    "tab": "momentum"
                }
            
            elif intent == "REFRESH_DATA":
                return {
                    "action": "REFRESH_DATA",
                    "params": {"action": "REFRESH"},
                    "confidence": confidence,
                    "entities": entities
                }

            elif intent == "OPEN_SEARCH":
                return {
                    "action": "OPEN_SEARCH",
                    "params": {"action": "OPEN_SPOTLIGHT"},
                    "confidence": confidence,
                    "entities": entities
                }

            elif intent.startswith("NAVIGATE_"):
                return {
                    "action": intent,
                    "params": {},
                    "confidence": confidence,
                    "entities": entities
                }
            
            elif intent == "CLOSE_WINDOW":
                return {
                    "action": "UI_ACTION",
                    "params": {"action": "CLOSE"},
                    "confidence": confidence,
                    "entities": entities
                }

            elif intent == "TOGGLE_WATCHLIST":
                return {
                    "action": "UI_ACTION",
                    "params": {"action": "WATCHLIST_TOGGLE"},
                    "confidence": confidence,
                    "entities": entities
                }

            elif intent == "SWITCH_TAB_INSIGHTS":
                return {
                    "action": "UI_ACTION",
                    "params": {"action": "SHOW_ANALYSIS"},
                    "confidence": confidence,
                    "entities": entities
                }

            elif intent == "SWITCH_TAB_CHART":
                return {
                    "action": "UI_ACTION",
                    "params": {"action": "SHOW_CHART"},
                    "confidence": confidence,
                    "entities": entities
                }

            elif intent == "TOGGLE_VOICE":
                return {
                    "action": "UI_ACTION",
                    "params": {"action": "TOGGLE_VOICE"},
                    "confidence": confidence,
                    "entities": entities
                }

            elif intent == "SET_LAYOUT":
                layout = "table" if "table" in text.lower() else "card" if "card" in text.lower() else "toggle"
                return {
                    "action": "UI_ACTION",
                    "params": {"action": "SET_LAYOUT", "layout": layout},
                    "confidence": confidence,
                    "entities": entities
                }
            
            else:
                return {
                    "action": "ERROR",
                    "params": {
                        "message": f"Intent '{intent}' not yet implemented."
                    }
                }
            
            # Return structured action JSON
            return {
                "action": intent,
                "confidence": round(confidence, 2),
                "params": action_params,
                "entities": {
                    "stocks": entities['stocks'],
                    "sector": entities['sector'],
                    "limit": entities['limit']
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing voice command: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                "action": "ERROR",
                "params": {
                    "message": f"Error processing command: {str(e)}"
                }
            }
    
    logger.info("AI Stock Research Engine endpoints registered")
    logger.info("Available endpoints: /ai/run-analysis, /ai/recommendations, /ai/top-stocks, /ai/news, /ai/risk-analysis, /ai/sector-analysis, /ai/sector-ranking, /ai/news-decisions, /ai/target-prices, /ai/send-alert, /ai/voice-command")


if __name__ == "__main__":
    # Test integration
    from fastapi import FastAPI
    app = FastAPI()
    add_ai_endpoints(app)
    print("AI endpoints added successfully")
