# Stock Analysis Dashboard

A professional React.js dashboard for NSE stock market analysis with real-time technical indicators.

## 🚀 Features

- **Real-time Stock Analysis**: Analyze NSE stocks using RSI, MACD, EMA, and Trend indicators
- **Multiple Trading Modes**: Intraday (5m), Swing (daily), and Long-term (weekly) analysis
- **Market Indices**: NIFTY and BANKNIFTY trend monitoring
- **Advanced Filtering**: Filter by verdict (STRONG BUY, STRONG SELL, NEUTRAL)
- **Search Functionality**: Quick search by stock symbol
- **Dual View Modes**: Table view and Card view
- **Dark Mode UI**: Professional finance dashboard design inspired by TradingView and Zerodha Kite
- **Fully Responsive**: Works on desktop, tablet, and mobile devices

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Python FastAPI backend running on `http://localhost:8000`

## 🛠️ Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure API URL (optional):**
   Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Start development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open browser:**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── StockTable.jsx      # Table view of stocks
│   │   ├── StockCard.jsx        # Card view of stocks
│   │   ├── ModeSelector.jsx     # Trading mode selector
│   │   ├── MarketIndex.jsx      # Market indices display
│   │   ├── Filters.jsx          # Verdict filters
│   │   └── SearchBar.jsx        # Search component
│   ├── services/
│   │   └── api.js               # Axios API service
│   ├── App.jsx                  # Main application component
│   ├── main.jsx                 # React entry point
│   └── index.css                # TailwindCSS styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎨 UI Components

### StockTable
Displays stocks in a professional table format with all technical indicators.

### StockCard
Card-based view showing key metrics in a compact, visually appealing format.

### ModeSelector
Allows switching between Intraday, Swing, and Long-term trading modes.

### MarketIndex
Shows NIFTY and BANKNIFTY trends with real-time data.

### Filters
Filter stocks by verdict: All, STRONG BUY, STRONG SELL, or NEUTRAL.

### SearchBar
Search stocks by symbol with real-time filtering.

## 🔌 API Integration

The dashboard connects to the FastAPI backend:

- `GET /stocks` - Fetch all NSE equity stocks
- `GET /analyze/{symbol}?mode={mode}` - Analyze a stock
- `GET /market-index` - Get market indices data

## 🎯 Color Coding

- **STRONG BUY** → Green (`#10b981`)
- **STRONG SELL** → Red (`#ef4444`)
- **NEUTRAL** → Yellow (`#f59e0b`)
- **BUY** → Light Green
- **SELL** → Light Red

## 📱 Responsive Design

The dashboard is fully responsive:
- **Desktop**: Full table/card grid layout
- **Tablet**: Optimized grid (2-3 columns)
- **Mobile**: Single column, stacked layout

## 🚀 Build for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist/` directory.

## 🔧 Configuration

### API URL
Set `VITE_API_URL` in `.env` file to point to your backend API.

### TailwindCSS
Customize colors and theme in `tailwind.config.js`.

## 📝 Notes

- The dashboard automatically re-analyzes stocks when trading mode changes
- Analysis is performed in parallel for better performance
- Loading states and error handling are included
- All API calls use Axios with interceptors for error handling

## 🐛 Troubleshooting

1. **API Connection Issues:**
   - Ensure backend is running on `http://localhost:8000`
   - Check `.env` file for correct `VITE_API_URL`

2. **CORS Errors:**
   - Ensure backend has CORS enabled for `http://localhost:3000`

3. **No Stocks Loading:**
   - Check browser console for errors
   - Verify backend `/stocks` endpoint is working

## 📄 License

This project is proprietary software for internal use.

---

**Built with ❤️ for Professional Stock Analysis**
