# Quick Start Guide - AI Stock Research Engine

## Setup (5 minutes)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure API Keys
Copy the example environment file and add your API keys:
```bash
cp ai_stock/.env.example .env
```

Edit `.env` and add:
- **SerpAPI Key** (or Bing Search API Key) - Get from https://serpapi.com or https://azure.microsoft.com/en-us/services/cognitive-services/bing-web-search-api/
- **Alpha Vantage API Key** (optional) - Get from https://www.alphavantage.co/support/#api-key
- **Email SMTP credentials** (for email alerts)
- **Telegram Bot Token** (for Telegram alerts) - Create bot via @BotFather

### 3. Run Your First Analysis

#### Option A: Standalone Script
```bash
cd ai_stock
python run_analysis.py RELIANCE TCS INFY
```

#### Option B: Python Code
```python
from ai_stock.main import AIStockResearchEngine
import asyncio

async def main():
    engine = AIStockResearchEngine()
    tickers = ["RELIANCE", "TCS", "INFY", "HDFCBANK"]
    results = await engine.run_complete_analysis(tickers, send_alerts=False)
    print(results)

asyncio.run(main())
```

#### Option C: Via FastAPI Endpoints
```bash
# Start your FastAPI server
python main.py

# Run analysis via API
curl -X POST "http://localhost:8000/ai/run-analysis?send_alerts=false" \
  -H "Content-Type: application/json" \
  -d '["RELIANCE", "TCS", "INFY"]'

# Get recommendations
curl "http://localhost:8000/ai/recommendations?limit=5"
```

## What Happens Automatically

1. **Web Research** → Searches for stock news
2. **Sentiment Analysis** → Analyzes news sentiment (Positive/Neutral/Negative)
3. **Fundamental Analysis** → Scores companies on financial metrics
4. **Technical Analysis** → Uses your existing technical indicators
5. **ML Prediction** → Predicts target prices using XGBoost/RandomForest
6. **Smart Ranking** → Combines all scores to rank stocks
7. **Alerts** → Sends email/Telegram notifications (if enabled)

## Output Files

- `ai_stock/data/news_raw.json` - Raw news search results
- `ai_stock/data/sentiment_scores.json` - Sentiment analysis results
- `ai_stock/data/analysis_results.json` - Complete analysis results
- `ai_stock/models/target_price.pkl` - Trained ML model

## API Endpoints

When integrated with FastAPI:

- `POST /ai/run-analysis` - Run complete analysis
- `GET /ai/recommendations` - Get ranked recommendations
- `GET /ai/top-stocks?category=buy&limit=5` - Get top stocks
- `GET /ai/news?ticker=RELIANCE` - Get news with sentiment

## Troubleshooting

### "SERPAPI_KEY not found"
- Add your SerpAPI key to `.env` file
- Or use Bing Search API instead

### "FinBERT model not loading"
- Install transformers: `pip install transformers torch`
- Or it will automatically fallback to VADER

### "XGBoost not available"
- Install: `pip install xgboost`
- Or it will use RandomForest instead

### "No recommendations available"
- Run `/ai/run-analysis` first to generate recommendations

## Next Steps

1. **Train ML Model**: The model starts with synthetic data. Retrain with real historical data for better accuracy.
2. **Customize Weights**: Edit `ranking_engine.py` to adjust score weights
3. **Add More Stocks**: Modify ticker list in your analysis calls
4. **Schedule Daily Runs**: Use cron/scheduler to run analysis daily

## Example Output

```
TOP 5 BUY RECOMMENDATIONS
============================================================
1. RELIANCE     | Score:   85.5 | Price: ₹2500.00 | Target: ₹2750.00
2. TCS          | Score:   82.3 | Price: ₹3500.00 | Target: ₹3850.00
3. INFY         | Score:   80.1 | Price: ₹1500.00 | Target: ₹1650.00
```

Enjoy your autonomous AI stock research engine! 🚀
