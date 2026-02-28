# FREE APIs Guide - मुफ्त API गाइड

यह system अब **100% FREE APIs** का उपयोग करता है! कोई paid subscription की जरूरत नहीं।

## ✅ FREE APIs जो System Use करता है:

### 1. **RSS Feeds** (100% FREE - कोई key नहीं चाहिए)
- ✅ Economic Times Markets
- ✅ Moneycontrol Business  
- ✅ Livemint Markets
- ✅ NDTV Profit

**कैसे काम करता है**: System automatically इन RSS feeds से news collect करता है। कोई API key की जरूरत नहीं!

### 2. **NewsAPI** (FREE Tier - 100 requests/day)
- Website: https://newsapi.org/register
- FREE tier: 100 requests per day
- Registration: Email से signup करें, free key मिल जाएगी

**Setup**:
```bash
# .env file में add करें:
NEWSAPI_KEY=your_free_key_here
```

### 3. **Alpha Vantage** (FREE Tier - 500 calls/day)
- Website: https://www.alphavantage.co/support/#api-key
- FREE tier: 5 API calls/minute, 500 calls/day
- Registration: Email से signup करें

**Setup**:
```bash
# .env file में add करें:
ALPHA_VANTAGE_API_KEY=your_free_key_here
```

### 4. **Yahoo Finance** (100% FREE)
- ✅ Already integrated
- ✅ कोई API key नहीं चाहिए
- ✅ yfinance library use करता है

### 5. **VADER Sentiment** (100% FREE)
- ✅ Open source library
- ✅ कोई API key नहीं चाहिए
- ✅ FinBERT भी free है (model download करता है)

### 6. **Telegram Bot** (100% FREE)
- Bot बनाना: @BotFather से Telegram में message करें
- `/newbot` command से bot बनाएं
- Free token मिल जाएगा

**Setup**:
```bash
# .env file में add करें:
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 7. **Email SMTP** (FREE)
- Gmail, Outlook सभी free SMTP provide करते हैं
- Gmail App Password use करें (free)

## 🚀 Quick Setup (सिर्फ 2 FREE Keys चाहिए)

### Step 1: NewsAPI Key (Optional - RSS feeds भी काम करेंगे)
1. https://newsapi.org/register पर जाएं
2. Email से signup करें
3. Free API key copy करें
4. `.env` file में add करें:
   ```
   NEWSAPI_KEY=your_key_here
   ```

### Step 2: Alpha Vantage Key (Optional - Yahoo Finance भी काम करेगा)
1. https://www.alphavantage.co/support/#api-key पर जाएं
2. Email से signup करें
3. Free API key copy करें
4. `.env` file में add करें:
   ```
   ALPHA_VANTAGE_API_KEY=your_key_here
   ```

### Step 3: Telegram Bot (Optional - Alerts के लिए)
1. Telegram में @BotFather को message करें
2. `/newbot` command भेजें
3. Bot name और username दें
4. Token copy करें
5. `.env` file में add करें:
   ```
   TELEGRAM_BOT_TOKEN=your_token
   TELEGRAM_CHAT_ID=your_chat_id
   ```

## 📊 System Priority (कौन सा API पहले use होगा)

1. **RSS Feeds** → Always FREE, always works
2. **NewsAPI** → FREE tier (100 requests/day)
3. **Yahoo Finance** → Always FREE
4. **VADER Sentiment** → Always FREE
5. **Alpha Vantage** → FREE tier (optional)

## 💡 बिना Keys के भी काम करेगा!

अगर आप कोई भी API key नहीं add करते, तो भी system काम करेगा:
- ✅ RSS feeds से news collect करेगा
- ✅ Yahoo Finance से fundamental data लेगा
- ✅ VADER से sentiment analyze करेगा
- ✅ Technical analysis करेगा
- ✅ ML model से prediction करेगा

**सिर्फ NewsAPI और Alpha Vantage optional हैं** - बिना इनके भी system fully functional है!

## 🎯 Cost Summary

| Service | Cost | Daily Limit |
|---------|------|-------------|
| RSS Feeds | ₹0 | Unlimited |
| NewsAPI | ₹0 | 100 requests |
| Yahoo Finance | ₹0 | Unlimited |
| Alpha Vantage | ₹0 | 500 calls |
| VADER Sentiment | ₹0 | Unlimited |
| Telegram Bot | ₹0 | Unlimited |
| Email SMTP | ₹0 | Unlimited |

**Total Cost: ₹0 (ZERO)** 🎉

## 📝 Example .env File (Minimum Setup)

```bash
# Minimum setup - सिर्फ ये add करें (optional)
NEWSAPI_KEY=your_free_key_here
ALPHA_VANTAGE_API_KEY=your_free_key_here

# Email (आपका already configured है)
SMTP_SERVER=mail.mobilisepro.com
SMTP_PORT=465
SMTP_USERNAME=noreply@mobilisepro.com
SMTP_PASSWORD=AcO9fUDHFY9kG3JP
EMAIL_FROM=noreply@mobilisepro.com
EMAIL_TO=anuj95455@gmail.com

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

## ✅ Test करें

```bash
cd ai_stock
python run_analysis.py RELIANCE TCS INFY
```

System automatically FREE APIs use करेगा! 🚀
