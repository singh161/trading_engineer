"""
Standalone script to run the complete AI Stock Research Engine analysis
"""
import asyncio
import sys
from pathlib import Path
from main import AIStockResearchEngine

# Add parent directory to path for existing system imports
sys.path.append(str(Path(__file__).parent.parent))


async def main():
    """Run complete analysis"""
    # Default Indian stock list (NSE listed)
    from main import AIStockResearchEngine
    ticker_list = AIStockResearchEngine.DEFAULT_INDIAN_STOCKS[:15]  # Top 15
    
    # Check if tickers provided as command line arguments
    if len(sys.argv) > 1:
        ticker_list = [ticker.upper().strip() for ticker in sys.argv[1:]]
    
    print("=" * 70)
    print("AUTONOMOUS AI STOCK RESEARCH ENGINE")
    print("=" * 70)
    print(f"Analyzing {len(ticker_list)} stocks: {', '.join(ticker_list)}")
    print()
    
    engine = AIStockResearchEngine()
    
    # Run analysis (set send_alerts=False to disable alerts during testing)
    results = await engine.run_complete_analysis(
        ticker_list, 
        send_alerts=False  # Set to True to enable alerts
    )
    
    # Print summary
    if results.get('status') == 'success':
        ranking = results.get('ranking_results', {})
        
        print("\n" + "=" * 70)
        print("TOP 5 BUY RECOMMENDATIONS")
        print("=" * 70)
        for i, stock in enumerate(ranking.get('top_5_buy', []), 1):
            print(f"{i}. {stock['symbol']:12} | Score: {stock['final_score']:6.1f} | "
                  f"Price: ₹{stock.get('current_price', 0):8.2f} | "
                  f"Target: ₹{stock.get('target_price', {}).get('target_price', 0):8.2f}")
        
        print("\n" + "=" * 70)
        print("TOP 5 HOLD RECOMMENDATIONS")
        print("=" * 70)
        for i, stock in enumerate(ranking.get('top_5_hold', []), 1):
            print(f"{i}. {stock['symbol']:12} | Score: {stock['final_score']:6.1f} | "
                  f"Price: ₹{stock.get('current_price', 0):8.2f}")
        
        print("\n" + "=" * 70)
        print("TOP 5 SELL RECOMMENDATIONS")
        print("=" * 70)
        for i, stock in enumerate(ranking.get('top_5_sell', []), 1):
            print(f"{i}. {stock['symbol']:12} | Score: {stock['final_score']:6.1f} | "
                  f"Price: ₹{stock.get('current_price', 0):8.2f}")
        
        print(f"\nExecution time: {results.get('execution_time_seconds', 0):.2f} seconds")
        print(f"Results saved to: ai_stock/data/analysis_results.json")
    else:
        print(f"Error: {results.get('error', 'Unknown error')}")


if __name__ == "__main__":
    asyncio.run(main())
