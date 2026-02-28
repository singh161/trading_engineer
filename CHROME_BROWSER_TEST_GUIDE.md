# 🌐 Chrome Browser Test Guide - AI Stock Research Engine

## 📋 **Self-Check Instructions**

Yeh guide aapko step-by-step dikhayega ki Chrome browser mein AI Stock Research Engine ko kaise test karna hai.

---

## 🚀 **STEP 1: Application Open Karein**

1. **Chrome browser** kholen
2. Address bar mein type karein: `http://localhost:5173`
3. **Enter** press karein
4. **Expected:** Main dashboard dikhna chahiye

**Check Karein:**
- ✅ Page load ho gaya
- ✅ "NSE Stock Analysis Dashboard" heading dikh raha hai
- ✅ Top right mein "🤖 AI Research Engine" button dikh raha hai

---

## 🎯 **STEP 2: AI Research Engine Open Karein**

1. **Click** karein "🤖 AI Research Engine" button par
2. **Expected:** AI Research Dashboard open hona chahiye

**Check Karein:**
- ✅ New section open hua
- ✅ Header dikh raha hai: "🤖 AI Stock Research Engine"
- ✅ Description text visible hai
- ✅ "🚀 Run Complete Analysis" button dikh raha hai

---

## 🔘 **STEP 3: Main Button Test - "Run Complete Analysis"**

1. **Click** karein "🚀 Run Complete Analysis" button par
2. **Watch** karein kya hota hai:

**Expected Behavior:**
- ✅ Button text change hoke "⏳ Running Analysis..." ho jaye
- ✅ Button disabled ho jaye (click nahi hoga)
- ✅ Status message dikhe: "Starting AI analysis..."
- ✅ Loading spinner dikhe (agar hai)

**Wait Karein:** 10-30 seconds (stocks ki number ke hisaab se)

**After Completion:**
- ✅ Success message dikhe: "Analysis complete! X stocks analyzed in Y seconds"
- ✅ Button phir se enabled ho jaye
- ✅ Status message update ho jaye

**Check Karein:**
- ✅ Koi error message nahi dikhna chahiye
- ✅ Execution time show hona chahiye
- ✅ Stocks analyzed count show hona chahiye

---

## 📑 **STEP 4: Sabhi Tabs Check Karein (9 Tabs)**

### **Tab 1: 📊 Smart Rankings**

**Click** karein "📊 Smart Rankings" tab par

**Kya Check Karein:**
- ✅ Tab active ho gaya (blue highlight)
- ✅ **Top 5 BUY** section dikhe (green cards)
- ✅ **Top 5 HOLD** section dikhe (yellow cards)
- ✅ **Top 5 SELL** section dikhe (red cards)

**Har Stock Card Mein:**
- ✅ Stock symbol (e.g., "TCS", "RELIANCE")
- ✅ Recommendation badge (BUY/HOLD/SELL)
- ✅ Final Score (number)
- ✅ Technical Score
- ✅ Sentiment Score
- ✅ Fundamental Score

**Agar Data Nahi Hai:**
- Message dikhe: "No recommendations available. Run 'Complete Analysis' first."

---

### **Tab 2: 📊 Sector Ranking** ⭐ NEW FEATURE

**Click** karein "📊 Sector Ranking" tab par

**Kya Check Karein:**

**Top Cards (Summary):**
- ✅ Total Sectors (number)
- ✅ BUY Sectors (green number)
- ✅ HOLD Sectors (yellow number)
- ✅ SELL Sectors (red number)
- ✅ Top 3 Average (blue number)

**Ranked List:**
- ✅ Rank number dikhe (#1, #2, #3...)
- ✅ Sector name dikhe (e.g., "Banking", "IT")
- ✅ Average Score dikhe (0-100)
- ✅ Stock count dikhe
- ✅ BUY/HOLD/SELL counts dikhe (grid format)
- ✅ Buy Ratio percentage dikhe
- ✅ Stocks list dikhe (sector ke andar ke stocks)

**Filter Test:**
- ✅ Dropdown dikhe (top right)
- ✅ "All Sectors" select karein - sab dikhe
- ✅ "BUY" select karein - sirf BUY sectors dikhe
- ✅ "HOLD" select karein - sirf HOLD sectors dikhe

**Agar Data Nahi Hai:**
- Message dikhe: "No sector ranking available. Run 'Complete Analysis' first."

---

### **Tab 3: 📰 News Decisions** ⭐ NEW FEATURE

**Click** karein "📰 News Decisions" tab par

**Kya Check Karein:**

**Har Decision Card Mein:**
- ✅ Stock symbol
- ✅ Decision badge (BUY/SELL/HOLD/STRONG BUY/STRONG SELL)
- ✅ Sentiment score (+/- number, color-coded)
- ✅ News count (e.g., "5 news articles")
- ✅ Confidence bar (percentage)
- ✅ Positive/Neutral/Negative news breakdown (3 boxes)
- ✅ Reasoning text (explanation kyun ye decision)
- ✅ Key headlines (important news ki list)

**Filter Test:**
- ✅ Dropdown dikhe
- ✅ "All Decisions" - sab dikhe
- ✅ "BUY" - sirf BUY decisions dikhe
- ✅ "HOLD" - sirf HOLD decisions dikhe

**Agar Data Nahi Hai:**
- Message dikhe: "No news-based decisions available. Run 'Complete Analysis' first."

---

### **Tab 4: 🛡️ Risk Analysis**

**Click** karein "🛡️ Risk Analysis" tab par

**Kya Check Karein:**

**Har Risk Card Mein:**
- ✅ Stock symbol
- ✅ Risk Level badge (LOW/MEDIUM/HIGH/VERY HIGH)
- ✅ Overall Risk percentage bar (color-coded)
- ✅ Risk Breakdown Grid:
  - Volatility Risk
  - Liquidity Risk
  - Leverage Risk
  - Earnings Risk
  - Correlation Risk
- ✅ Recommendation (BUY/HOLD/SELL)
- ✅ Final Score

**Color Coding:**
- ✅ Green: LOW risk
- ✅ Yellow: MEDIUM risk
- ✅ Orange: HIGH risk
- ✅ Red: VERY HIGH risk

**Sorting:**
- ✅ Stocks sorted by risk (lowest risk pehle)

**Agar Data Nahi Hai:**
- Message dikhe: "No risk analysis available. Run 'Complete Analysis' first."

---

### **Tab 5: 📊 Sector Analysis**

**Click** karein "📊 Sector Analysis" tab par

**Kya Check Karein:**

**Top Cards:**
- ✅ Top Performing Sector (green card)
- ✅ Underperforming Sector (red card)

**Sector List:**
- ✅ Sector name
- ✅ Average score (large number, color-coded)
- ✅ Stock count
- ✅ BUY/HOLD/SELL counts (4 boxes)
- ✅ Buy ratio percentage
- ✅ Stock symbols list (sector ke andar)

**Sorting:**
- ✅ Sectors sorted by average score (highest pehle)

**Agar Data Nahi Hai:**
- Message dikhe: "No sector analysis available. Run 'Complete Analysis' first."

---

### **Tab 6: 📰 News Feed**

**Click** karein "📰 News Feed" tab par

**Kya Check Karein:**

**Har News Card Mein:**
- ✅ News title (clickable)
- ✅ News snippet/description
- ✅ Published date
- ✅ Source (e.g., "Economic Times")
- ✅ Ticker symbol (agar stock se related hai)
- ✅ Sentiment label (Positive/Neutral/Negative)

**Agar Data Nahi Hai:**
- Message dikhe: "No news data available. Run 'Complete Analysis' first."

---

### **Tab 7: 😊 Sentiment**

**Click** karein "😊 Sentiment" tab par

**Kya Check Karein:**

**Har Sentiment Card Mein:**
- ✅ Stock symbol
- ✅ Sentiment label (large text: Positive/Neutral/Negative)
- ✅ Average sentiment score (+/- number)
- ✅ Total news count
- ✅ Breakdown grid:
  - Positive count (green)
  - Neutral count (yellow)
  - Negative count (red)
- ✅ Confidence percentage bar

**Agar Data Nahi Hai:**
- Message dikhe: "No sentiment data available. Run 'Complete Analysis' first."

---

### **Tab 8: 💰 Fundamentals**

**Click** karein "💰 Fundamentals" tab par

**Kya Check Karein:**

**Har Fundamental Card Mein:**
- ✅ Stock symbol
- ✅ Fundamental Score (0-100)
- ✅ Financial Metrics:
  - Revenue Growth (%)
  - Earnings Growth (%)
  - ROE (Return on Equity)
  - Debt-to-Equity ratio
  - Profit Margin (%)
  - PE Ratio
  - PB Ratio
  - Market Cap (₹)

**Agar Data Nahi Hai:**
- Message dikhe: "No fundamental data available. Run 'Complete Analysis' first."

---

### **Tab 9: 🎯 Target Price**

**Click** karein "🎯 Target Price" tab par

**Kya Check Karein:**

**Har Prediction Card Mein:**
- ✅ Stock symbol
- ✅ Recommendation badge
- ✅ Expected Change percentage (large, color-coded)
- ✅ Current Price (₹)
- ✅ Target Price (₹)
- ✅ ML Model Confidence bar (percentage)
- ✅ Price movement visualization bar

**Sorting:**
- ✅ Predictions sorted by potential gain (highest pehle)

**Color Coding:**
- ✅ Green: High confidence (≥70%)
- ✅ Yellow: Medium confidence (≥50%)
- ✅ Red: Low confidence (<50%)

**Agar Data Nahi Hai:**
- Message dikhe: "No predictions available. Run 'Complete Analysis' first."

---

## 🔍 **STEP 5: Data Verification**

### **Consistency Check:**
- ✅ Same stocks dikhne chahiye multiple tabs mein
- ✅ Scores match hone chahiye across tabs
- ✅ Recommendations consistent hone chahiye

### **Data Quality:**
- ✅ Stock symbols valid hain (NSE format: TCS, RELIANCE, etc.)
- ✅ Scores 0-100 ke beech mein hain
- ✅ Percentages properly formatted hain
- ✅ Prices ₹ symbol ke saath hain
- ✅ Dates readable hain
- ✅ Koi "undefined" ya "null" nahi dikhna chahiye

---

## 🐛 **STEP 6: Error Checking**

### **Chrome DevTools Kholen (F12 press karein):**

**Console Tab:**
- ✅ Green messages dikhne chahiye (API calls)
- ✅ Koi red errors nahi dikhne chahiye
- ✅ Koi JavaScript errors nahi hone chahiye

**Network Tab:**
- ✅ `/ai/run-analysis` - Called successfully
- ✅ `/ai/recommendations` - Returns 200 status
- ✅ `/ai/sector-ranking` - Returns 200 status
- ✅ `/ai/news-decisions` - Returns 200 status
- ✅ `/ai/risk-analysis` - Returns 200 status
- ✅ `/ai/sector-analysis` - Returns 200 status
- ✅ `/ai/target-prices` - Returns 200 status
- ✅ Response times < 2 seconds

**Common Errors:**
- ❌ "ERR_CONNECTION_REFUSED" → Backend nahi chal raha
- ❌ "404 Not Found" → Endpoint nahi mila
- ❌ "500 Internal Server Error" → Backend error

---

## ✅ **Quick Checklist**

Print karke check karein:

```
[ ] Main dashboard open hua
[ ] AI Research Engine button clickable
[ ] Dashboard open hua
[ ] "Run Complete Analysis" button clickable
[ ] Analysis complete hua
[ ] Smart Rankings tab - data dikha
[ ] Sector Ranking tab - data dikha
[ ] News Decisions tab - data dikha
[ ] Risk Analysis tab - data dikha
[ ] Sector Analysis tab - data dikha
[ ] News Feed tab - data dikha
[ ] Sentiment tab - data dikha
[ ] Fundamentals tab - data dikha
[ ] Target Price tab - data dikha
[ ] Koi console errors nahi
[ ] Data properly formatted hai
[ ] Filters kaam kar rahe hain
```

---

## 🎯 **Expected Results After Analysis:**

- ✅ **Smart Rankings**: 5 BUY + 5 HOLD + 5 SELL stocks
- ✅ **Sector Ranking**: 10+ sectors ranked
- ✅ **News Decisions**: Multiple stock decisions
- ✅ **Risk Analysis**: Risk metrics for all stocks
- ✅ **Sector Analysis**: Sector performance data
- ✅ **News Feed**: Recent news articles
- ✅ **Sentiment**: Sentiment scores for stocks
- ✅ **Fundamentals**: Financial metrics
- ✅ **Target Price**: ML predictions with confidence

---

## 📝 **Issues Found:**

Agar koi issue mile, yahan note karein:

1. _________________________________
2. _________________________________
3. _________________________________

---

## 🎬 **Video Guide:**

1. Chrome kholen → `http://localhost:5173`
2. "🤖 AI Research Engine" button click karein
3. "🚀 Run Complete Analysis" button click karein
4. 10-30 seconds wait karein
5. Har tab check karein (9 tabs)
6. Data verify karein
7. Filters test karein
8. Console check karein (F12)

---

**Test Date:** _______________  
**Tester:** _______________  
**Status:** Ready for Testing ✅
