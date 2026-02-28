"""
Configuration file for Trading Engineer Backend
MySQL-free — all data comes from NSE API directly.
"""
import os
from typing import Optional, List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# NSE Index Configuration (which indices to pull stock lists from)
# More indices = more unique stocks analyzed (~500+ unique)
NSE_INDICES: List[str] = [
    "NIFTY 50",
    "NIFTY NEXT 50",
    "NIFTY MIDCAP 50",
    "NIFTY MIDCAP 100",
    "NIFTY SMALLCAP 50",
    "NIFTY SMALLCAP 100",
    "NIFTY 200",
    "NIFTY BANK",
    "NIFTY IT",
    "NIFTY PHARMA",
    "NIFTY AUTO",
]

# Redis Cache (optional — falls back to in-memory if unavailable)
REDIS_URL: Optional[str] = os.getenv("REDIS_URL")  # e.g., "redis://localhost:6379"

# API Configuration
API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
API_PORT: int = int(os.getenv("API_PORT", "8000"))  # Backend Port: 8000
API_TITLE: str = "Stock Market Analysis API"
API_VERSION: str = "2.0.0"

# Frontend Configuration
FRONTEND_PORT: int = int(os.getenv("FRONTEND_PORT", "5173"))  # Frontend Port: 5173
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Trading Configuration
RSI_OVERSOLD: int = 30
RSI_OVERBOUGHT: int = 70
RSI_NEUTRAL_LOW: int = 40
RSI_NEUTRAL_HIGH: int = 60

EMA_SHORT: int = 20
EMA_LONG: int = 50

SIGNAL_THRESHOLD: int = 7  # Minimum signals for STRONG BUY/SELL

# Momentum Filter Configuration
FILTER_BY_MOMENTUM: bool = os.getenv("FILTER_BY_MOMENTUM", "true").lower() == "true"
MOMENTUM_MIN_SIGNALS: int = int(os.getenv("MOMENTUM_MIN_SIGNALS", "3"))
MOMENTUM_MIN_RSI_DIFF: int = int(os.getenv("MOMENTUM_MIN_RSI_DIFF", "10"))

# Price Range Filter Configuration
FILTER_BY_PRICE: bool = os.getenv("FILTER_BY_PRICE", "true").lower() == "true"
MIN_STOCK_PRICE: float = float(os.getenv("MIN_STOCK_PRICE", "25"))   # ₹25
MAX_STOCK_PRICE: float = float(os.getenv("MAX_STOCK_PRICE", "5000")) # ₹5000

# Data Source Configuration
NSE_SYMBOL_SUFFIX: str = ".NS"  # For yfinance NSE symbols

# Timeframe Configuration
TIMEFRAMES = {
    "intraday": {"interval": "5m",  "period": "1d",  "candle": "5m"},
    "swing":    {"interval": "1d",  "period": "1mo", "candle": "1d"},
    "longterm": {"interval": "1wk", "period": "2y",  "candle": "1wk"}
}

# Alert Configuration (Email/SMTP)
SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
EMAIL_FROM: Optional[str] = os.getenv("EMAIL_FROM")
EMAIL_TO: List[str] = os.getenv("EMAIL_TO", "").split(",") if os.getenv("EMAIL_TO") else []

# Alert Configuration (Telegram)
TELEGRAM_BOT_TOKEN: Optional[str] = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID: Optional[str] = os.getenv("TELEGRAM_CHAT_ID")
