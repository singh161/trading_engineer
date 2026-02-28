# Stock Market Analysis Backend API

A professional, production-ready stock market analysis backend built with Python, FastAPI, and MySQL. This system analyzes NSE stocks using technical indicators and provides BUY/SELL/NEUTRAL trading signals.

## 🎯 Features

- **Multi-mode Analysis**: Intraday (5m), Swing (daily), and Long-term (weekly) trading modes
- **Comprehensive Technical Indicators**: RSI, MACD, EMA, Bollinger Bands, Support/Resistance
- **Signal Scoring Engine**: 9-point analysis system with weighted signals
- **MySQL Integration**: Connects to existing Laravel database with stock_list table
- **RESTful API**: FastAPI endpoints for React dashboard integration
- **Market Index Analysis**: NIFTY and BANKNIFTY trend analysis

## 📋 Prerequisites

- Python 3.8+
- MySQL 5.7+ (with existing stock_list table)
- pip package manager

## 🚀 Installation

### 1. Clone/Setup Project

```bash
cd trading_engineer
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database_name

# API Configuration (Optional)
API_HOST=0.0.0.0
API_PORT=8000

# Data Source (yfinance or nse)
DATA_SOURCE=yfinance
```

### 5. Verify Database Connection

Ensure your MySQL database has the `stock_list` table with the following structure:

```sql
-- Example table structure (adjust based on your schema)
CREATE TABLE stock_list (
    id INT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(50),
    EQ_FN TINYINT(1),
    -- other columns...
);

-- Verify stocks are available
SELECT * FROM stock_list WHERE EQ_FN = 1;
```

## 🏃 Running the Application

### Development Mode

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at: `http://localhost:8000`

## 📚 API Endpoints

### 1. Health Check

```http
GET /health
```

Returns API and database connection status.

### 2. Get All Stocks

```http
GET /stocks
```

Returns all NSE equity stocks from `stock_list` table where `EQ_FN = 1`.

**Response:**
```json
[
  {
    "id": 1,
    "symbol": "RELIANCE",
    "EQ_FN": 1,
    ...
  }
]
```

### 3. Analyze Stock

```http
GET /analyze/{symbol}?mode={mode}
```

Analyzes a single stock and returns trading signals.

**Parameters:**
- `symbol`: Stock symbol (e.g., `RELIANCE`)
- `mode`: Trading mode - `intraday`, `swing`, or `longterm` (default: `swing`)

**Example:**
```http
GET /analyze/RELIANCE?mode=swing
```

**Response:**
```json
{
  "symbol": "RELIANCE",
  "mode": "swing",
  "price": 2456.50,
  "rsi": 58.23,
  "macd": 12.45,
  "macd_signal": 10.23,
  "macd_hist": 2.22,
  "ema_20": 2430.50,
  "ema_50": 2380.25,
  "trend": "UP",
  "volume_signal": "BUY",
  "buy_signals": [
    "TREND_UP",
    "EMA_BUY",
    "MACD_BULLISH",
    "VOLUME_CONFIRMATION_BUY"
  ],
  "sell_signals": [],
  "buy_count": 4,
  "sell_count": 0,
  "final_verdict": "NEUTRAL",
  "timestamp": "2026-01-26T10:30:00"
}
```

### 4. Market Index Analysis

```http
GET /market-index
```

Returns NIFTY and BANKNIFTY trend analysis.

**Response:**
```json
{
  "NIFTY": {
    "price": 21500.50,
    "trend": "UP",
    "rsi": 62.45,
    "ema_20": 21300.25,
    "ema_50": 21000.75,
    "final_verdict": "BUY"
  },
  "BANKNIFTY": {
    "price": 47500.25,
    "trend": "UP",
    "rsi": 58.90,
    "ema_20": 47000.50,
    "ema_50": 46500.00,
    "final_verdict": "NEUTRAL"
  },
  "timestamp": "2026-01-26T10:30:00"
}
```

### 5. Batch Analysis

```http
GET /analyze/batch?symbols=RELIANCE,TCS,INFY&mode=swing
```

Analyzes multiple stocks in a single request.

**Parameters:**
- `symbols`: Comma-separated list of stock symbols
- `mode`: Trading mode (default: `swing`)

## 🔍 Analysis Rules

The system uses a 9-point analysis checklist:

1. **Trend Analysis**: Higher highs + higher lows (UP) or lower highs + lower lows (DOWN)
2. **EMA Signals**: Price > 20 EMA > 50 EMA (Strong Buy) or Price < 20 EMA < 50 EMA (Strong Sell)
3. **RSI**: RSI < 30 (Buy), RSI > 70 (Sell), RSI 40-60 (Neutral)
4. **MACD**: Bullish crossover (Buy) or Bearish crossover (Sell)
5. **Support/Resistance**: Break resistance (Buy) or Break support (Sell)
6. **Volume**: Price up + volume up (Buy) or Price down + volume up (Sell)
7. **Candlestick Patterns**: Bullish patterns (Buy) or Bearish patterns (Sell)
8. **Gap Analysis**: Gap up + volume (Buy) or Gap down + volume (Sell)
9. **Open High Low**: Break day high (Buy) or Break day low (Sell)

### Final Verdict Logic

- **STRONG BUY**: Buy signals ≥ 7
- **STRONG SELL**: Sell signals ≥ 7
- **BUY**: Buy signals > Sell signals
- **SELL**: Sell signals > Buy signals
- **NEUTRAL**: Equal signals or insufficient data

## 📁 Project Structure

```
trading_engineer/
├── main.py              # FastAPI application and endpoints
├── database.py          # MySQL connection and queries
├── data_fetcher.py      # Stock data downloader (yfinance)
├── indicators.py        # Technical indicators calculator
├── signals.py           # Signal analysis engine
├── config.py            # Configuration settings
├── requirements.txt     # Python dependencies
├── README.md           # This file
└── .env                # Environment variables (create this)
```

## 🔧 Configuration

Edit `config.py` to customize:

- RSI thresholds (oversold/overbought)
- EMA periods
- Signal threshold for STRONG BUY/SELL
- Timeframe configurations
- Data source preferences

## 🛡️ Security Considerations

1. **Database Credentials**: Never commit `.env` file. Use environment variables in production.
2. **CORS**: Update CORS origins in `main.py` for production deployment.
3. **Rate Limiting**: Consider adding rate limiting for production use.
4. **Authentication**: Add API key authentication for production endpoints.

## 🚀 Production Deployment

### Using Docker (Recommended)

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using Gunicorn

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 📊 Integration with React Dashboard

Example React fetch:

```javascript
// Fetch stocks
const stocks = await fetch('http://localhost:8000/stocks').then(r => r.json());

// Analyze stock
const analysis = await fetch(
  'http://localhost:8000/analyze/RELIANCE?mode=swing'
).then(r => r.json());

// Market index
const indices = await fetch('http://localhost:8000/market-index').then(r => r.json());
```

## 🐛 Troubleshooting

### Database Connection Issues

- Verify MySQL is running: `mysql -u root -p`
- Check database credentials in `.env`
- Ensure `stock_list` table exists and has data

### Data Fetching Issues

- Check internet connection (yfinance requires internet)
- Verify stock symbols are correct (NSE symbols need `.NS` suffix for yfinance)
- Some symbols may not have data available

### Import Errors

- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again
- Check Python version: `python --version` (should be 3.8+)

## 📝 License

This project is proprietary software for internal use.

## 👥 Support

For issues or questions, contact the development team.

---

**Built with ❤️ for Professional Trading Analysis**
