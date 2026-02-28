# Autonomous AI Stock Research Engine

A fully autonomous AI-powered stock research system that automatically collects news, analyzes sentiment, evaluates fundamentals, predicts target prices, and ranks stocks.

## Features

### Module 1: Web Research
- Daily news collection using SerpAPI or Bing Search API
- Searches for:
  - "Best stocks to buy in India today"
  - "NSE company earnings news"
  - "Stock market breaking news India"
- Stores raw results in `data/news_raw.json`

### Module 2: NLP Sentiment Analysis
- Uses FinBERT (financial BERT) or VADER for sentiment classification
- Classifies news as Positive/Neutral/Negative
- Extracts ticker symbols from news
- Aggregates sentiment scores by ticker
- Saves results to `data/sentiment_scores.json`

### Module 3: Fundamental Scoring
- Uses Yahoo Finance API for financial metrics
- Optional Alpha Vantage API for additional data
- Extracts:
  - Revenue growth
  - EPS growth
  - ROE (Return on Equity)
  - Debt/Equity ratio
- Calculates fundamental score (0-100)

### Module 4: Target Price ML Model
- Uses XGBoost or RandomForest regression
- Inputs:
  - RSI, MACD, Volume Change
  - Sentiment Score
  - Fundamental Score
- Outputs:
  - Target price prediction
  - Confidence percentage
- Model saved to `models/target_price.pkl`

### Module 5: Smart Ranking
- Combines all scores with weighted formula:
  ```
  final_score = 
    0.35 * technical_score +
    0.25 * sentiment_score +
    0.25 * fundamental_score +
    0.15 * momentum_score
  ```
- Returns:
  - Top 5 BUY recommendations
  - Top 5 HOLD recommendations
  - Top 5 SELL recommendations

### Module 6: Alert System
- Email alerts via SMTP
- Telegram bot notifications
- FastAPI endpoints:
  - `/recommendations` - Get ranked stock recommendations
  - `/top-stocks` - Get top stocks by category
  - `/news` - Get collected news with sentiment

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp ai_stock/.env.example .env
# Edit .env with your API keys
```

3. Required API Keys:
   - SerpAPI or Bing Search API (for web research)
   - Alpha Vantage API (optional, for fundamental data)
   - SMTP credentials (for email alerts)
   - Telegram Bot Token (for Telegram alerts)

## Usage

### Run Complete Analysis

```python
from ai_stock.main import AIStockResearchEngine
import asyncio

async def main():
    ticker_list = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK"]
    engine = AIStockResearchEngine()
    results = await engine.run_complete_analysis(ticker_list, send_alerts=True)
    print(results)

asyncio.run(main())
```

### Run Individual Modules

```python
# Web Research
from ai_stock.scrapers.web_research import WebResearchEngine
engine = WebResearchEngine()
results = await engine.run_daily_collection()

# Sentiment Analysis
from ai_stock.nlp.sentiment_analyzer import SentimentAnalyzer
analyzer = SentimentAnalyzer()
sentiment = analyzer.analyze("Reliance reports strong earnings")

# Fundamental Scoring
from ai_stock.ml.fundamental_scorer import FundamentalScorer
scorer = FundamentalScorer()
result = await scorer.analyze_stock("RELIANCE")

# Target Price Prediction
from ai_stock.ml.target_price_predictor import TargetPricePredictor
predictor = TargetPricePredictor()
prediction = predictor.predict(technical_data, sentiment_score=0.6, fundamental_score=75.0)
```

## Project Structure

```
ai_stock/
├── data/              # Data storage (news, sentiment, results)
├── models/            # ML models (target_price.pkl)
├── scrapers/         # Web research module
│   └── web_research.py
├── nlp/              # NLP sentiment module
│   └── sentiment_analyzer.py
├── ml/               # ML modules
│   ├── fundamental_scorer.py
│   ├── target_price_predictor.py
│   └── ranking_engine.py
├── api/              # API and alerts
│   ├── alerts.py
│   └── endpoints.py
└── main.py           # Main orchestrator
```

## Configuration

Edit `ai_stock/.env.example` and rename to `.env` with your API keys:

- `SERPAPI_KEY` or `BING_SEARCH_API_KEY` - For web research
- `ALPHA_VANTAGE_API_KEY` - For fundamental data (optional)
- `SMTP_*` - Email configuration
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` - Telegram alerts

## API Endpoints

When integrated with FastAPI:

- `GET /recommendations` - Get ranked stock recommendations
- `GET /top-stocks?category=buy&limit=5` - Get top stocks
- `GET /news?ticker=RELIANCE` - Get news with sentiment
- `POST /send-alert?stock_symbol=RELIANCE` - Send alert for stock

## Notes

- The system requires Python 3.10+
- Uses async/await for API calls
- All modules are modular and can be used independently
- ML model trains on synthetic data initially - retrain with real data for better accuracy
- Rate limiting is implemented for API calls

## License

MIT License
