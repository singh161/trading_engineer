"""
Module 2: NLP Sentiment Analysis
Uses FinBERT or VADER for sentiment classification
"""
import os
import json
import logging
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from datetime import datetime

# Try importing FinBERT (requires transformers library)
try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    import torch
    FINBERT_AVAILABLE = True
except ImportError:
    FINBERT_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("FinBERT not available. Install: pip install transformers torch")

# Try importing VADER
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    VADER_AVAILABLE = True
except ImportError:
    VADER_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("VADER not available. Install: pip install vaderSentiment")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """Sentiment analyzer using FinBERT or VADER"""
    
    def __init__(self, use_finbert: bool = True):
        self.use_finbert = use_finbert and FINBERT_AVAILABLE
        self.finbert_model = None
        self.finbert_tokenizer = None
        self.vader_analyzer = None
        
        self.data_dir = Path(__file__).parent.parent / "data"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.sentiment_file = self.data_dir / "sentiment_scores.json"
        
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize sentiment analysis model"""
        if self.use_finbert:
            try:
                logger.info("Loading FinBERT model...")
                model_name = "ProsusAI/finbert"
                self.finbert_tokenizer = AutoTokenizer.from_pretrained(model_name)
                self.finbert_model = AutoModelForSequenceClassification.from_pretrained(model_name)
                self.finbert_model.eval()
                logger.info("FinBERT model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load FinBERT: {e}")
                logger.info("Falling back to VADER")
                self.use_finbert = False
        
        if not self.use_finbert and VADER_AVAILABLE:
            logger.info("Initializing VADER sentiment analyzer...")
            self.vader_analyzer = SentimentIntensityAnalyzer()
            logger.info("VADER initialized successfully")
        elif not VADER_AVAILABLE:
            logger.error("Neither FinBERT nor VADER available!")
    
    def analyze_finbert(self, text: str) -> Dict[str, float]:
        """Analyze sentiment using FinBERT"""
        if not self.finbert_model or not self.finbert_tokenizer:
            return {"sentiment": "neutral", "score": 0.0, "confidence": 0.0}
        
        try:
            # Tokenize and encode
            inputs = self.finbert_tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            )
            
            # Get predictions
            with torch.no_grad():
                outputs = self.finbert_model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            
            # FinBERT labels: positive, negative, neutral
            labels = ["positive", "negative", "neutral"]
            scores = predictions[0].tolist()
            
            # Get highest score
            max_idx = scores.index(max(scores))
            sentiment = labels[max_idx]
            confidence = float(scores[max_idx])
            
            # Calculate sentiment score (-1 to 1)
            if sentiment == "positive":
                sentiment_score = confidence
            elif sentiment == "negative":
                sentiment_score = -confidence
            else:
                sentiment_score = 0.0
            
            return {
                "sentiment": sentiment,
                "score": sentiment_score,
                "confidence": confidence,
                "raw_scores": {
                    "positive": float(scores[0]),
                    "negative": float(scores[1]),
                    "neutral": float(scores[2])
                }
            }
        except Exception as e:
            logger.error(f"FinBERT analysis error: {e}")
            return {"sentiment": "neutral", "score": 0.0, "confidence": 0.0}
    
    def analyze_vader(self, text: str) -> Dict[str, float]:
        """Analyze sentiment using VADER"""
        if not self.vader_analyzer:
            return {"sentiment": "neutral", "score": 0.0, "confidence": 0.0}
        
        try:
            scores = self.vader_analyzer.polarity_scores(text)
            
            # VADER compound score ranges from -1 (most negative) to +1 (most positive)
            compound = scores['compound']
            
            # Classify sentiment
            if compound >= 0.05:
                sentiment = "positive"
                confidence = abs(compound)
            elif compound <= -0.05:
                sentiment = "negative"
                confidence = abs(compound)
            else:
                sentiment = "neutral"
                confidence = 1 - abs(compound)
            
            return {
                "sentiment": sentiment,
                "score": compound,
                "confidence": confidence,
                "raw_scores": scores
            }
        except Exception as e:
            logger.error(f"VADER analysis error: {e}")
            return {"sentiment": "neutral", "score": 0.0, "confidence": 0.0}
    
    def analyze(self, text: str) -> Dict[str, float]:
        """Analyze sentiment of text"""
        if not text or not text.strip():
            return {"sentiment": "neutral", "score": 0.0, "confidence": 0.0}
        
        if self.use_finbert:
            return self.analyze_finbert(text)
        else:
            return self.analyze_vader(text)
    
    def extract_ticker_from_text(self, text: str, ticker_list: List[str]) -> Optional[str]:
        """Extract ticker symbol from text"""
        text_upper = text.upper()
        for ticker in ticker_list:
            if ticker.upper() in text_upper:
                return ticker.upper()
        return None
    
    def analyze_news_items(self, news_items: List[Dict], ticker_list: List[str]) -> List[Dict]:
        """Analyze multiple news items and extract tickers"""
        results = []
        
        for item in news_items:
            # Combine title and snippet for analysis
            text = f"{item.get('title', '')} {item.get('snippet', '')}"
            
            # Analyze sentiment
            sentiment_result = self.analyze(text)
            
            # Extract ticker
            ticker = self.extract_ticker_from_text(text, ticker_list)
            
            result = {
                "ticker": ticker,
                "title": item.get('title', ''),
                "link": item.get('link', ''),
                "sentiment": sentiment_result['sentiment'],
                "sentiment_score": sentiment_result['score'],
                "confidence": sentiment_result['confidence'],
                "timestamp": item.get('timestamp', datetime.now().isoformat()),
                "source": item.get('source', 'unknown')
            }
            
            results.append(result)
        
        return results
    
    def save_sentiment_scores(self, sentiment_results: List[Dict]):
        """Save sentiment analysis results"""
        try:
            # Load existing data
            existing_data = []
            if self.sentiment_file.exists():
                with open(self.sentiment_file, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
            
            # Add new results
            date_key = datetime.now().strftime("%Y-%m-%d")
            existing_data.append({
                "date": date_key,
                "timestamp": datetime.now().isoformat(),
                "results": sentiment_results,
                "total_results": len(sentiment_results)
            })
            
            # Save updated data
            with open(self.sentiment_file, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(sentiment_results)} sentiment scores")
        except Exception as e:
            logger.error(f"Error saving sentiment scores: {e}")
    
    def get_ticker_sentiment_summary(self, sentiment_results: List[Dict]) -> Dict[str, Dict]:
        """Aggregate sentiment scores by ticker"""
        ticker_sentiments = {}
        
        for result in sentiment_results:
            ticker = result.get('ticker')
            if not ticker:
                continue
            
            if ticker not in ticker_sentiments:
                ticker_sentiments[ticker] = {
                    "ticker": ticker,
                    "total_news": 0,
                    "positive_count": 0,
                    "negative_count": 0,
                    "neutral_count": 0,
                    "avg_sentiment_score": 0.0,
                    "avg_confidence": 0.0,
                    "weighted_score": 0.0
                }
            
            ticker_data = ticker_sentiments[ticker]
            ticker_data["total_news"] += 1
            
            sentiment = result.get('sentiment', 'neutral')
            if sentiment == "positive":
                ticker_data["positive_count"] += 1
            elif sentiment == "negative":
                ticker_data["negative_count"] += 1
            else:
                ticker_data["neutral_count"] += 1
            
            # Calculate weighted average
            score = result.get('sentiment_score', 0.0)
            confidence = result.get('confidence', 0.0)
            
            ticker_data["weighted_score"] += score * confidence
        
        # Calculate averages
        for ticker, data in ticker_sentiments.items():
            if data["total_news"] > 0:
                data["avg_sentiment_score"] = data["weighted_score"] / data["total_news"]
                data["avg_confidence"] = sum(
                    r.get('confidence', 0.0) for r in sentiment_results if r.get('ticker') == ticker
                ) / data["total_news"]
        
        return ticker_sentiments


if __name__ == "__main__":
    # Test sentiment analyzer
    analyzer = SentimentAnalyzer()
    
    test_texts = [
        "Reliance Industries reports strong quarterly earnings growth",
        "TCS stock crashes after disappointing Q4 results",
        "Infosys announces new partnership with global tech firm"
    ]
    
    for text in test_texts:
        result = analyzer.analyze(text)
        print(f"Text: {text}")
        print(f"Sentiment: {result['sentiment']}, Score: {result['score']:.3f}, Confidence: {result['confidence']:.3f}")
        print()
