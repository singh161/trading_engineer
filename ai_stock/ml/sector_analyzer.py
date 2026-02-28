"""
Sector Analysis Module
Analyzes stocks by sector and provides sector-level insights
"""
import logging
from typing import Dict, List
from collections import defaultdict
from datetime import datetime

logger = logging.getLogger(__name__)


class SectorAnalyzer:
    """Analyze stocks by sector"""
    
    # Updated Indian stock sectors based on user request
    SECTOR_MAPPING = {
        'IT & Software': [
            'TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTIM', 'AURIONPRO', 
            'KPITTECH', 'PERSISTENT', 'COFORGE', 'MPHASIS', 'LTTS'
        ],
        'Banking': [
            'HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK', 
            'INDUSINDBK', 'INDIANB', 'CANBK', 'BOB', 'PNB', 'IDFCFIRSTB'
        ],
        'Financial Services': [
            'BAJFINANCE', 'BAJAJFINSV', 'HDFCLIFE', 'JIOFIN', 'SBILIFE', 
            'MANAPPURAM', 'CDSL', 'MFSL', 'IIFL', 'CHOLAFIN', 'RECLTD', 'PFC', 'MUTHOOTFIN'
        ],
        'FMCG': [
            'HINDUNILVR', 'ITC', 'NESTLEIND', 'TATACONSUM', 'MARICO', 
            'JUBLFOOD', 'PAGEIND', 'BRITANNIA', 'DABUR', 'COLPAL', 'VBL'
        ],
        'Pharma & Healthcare': [
            'SUNPHARMA', 'DRREDDY', 'DIVISLAB', 'MAXHEALTH', 'GLENMARK', 
            'BIOCON', 'SYNGENE', 'NH', 'PPLPHARMA', 'CIPLA', 'TORNTPHARM', 'MANKIND', 'APOLLOHOSP'
        ],
        'Automobile': [
            'MARUTI', 'TATAMOTORS', 'HEROMOTOCO', 'GABRIEL', 'INDNIPPON', 
            'RICOAUTO', 'BHARATFORG', 'M&M', 'EICHERMOT', 'BAJAJ-AUTO', 'TVSMOTOR'
        ],
        'Metals & Mining': [
            'TATASTEEL', 'JSWSTEEL', 'HINDZINC', 'JAIBALAJI', 'GRAVITA', 
            'ASHAPURMIN', 'VISASTEEL', 'HINDALCO', 'COALINDIA', 'NMDC', 'SAIL', 'VEDL'
        ],
        'Energy & Power': [
            'RELIANCE', 'ONGC', 'NTPC', 'POWERGRID', 'JSWENERGY', 'HINDPETRO', 
            'WAAREEENER', 'INOXWIND', 'IRMENERGY', 'BPCL', 'IOC', 'GAIL', 'ADANIGREEN', 'TATAPOWER'
        ],
        'Infrastructure & Cement': [
            'LT', 'ADANIPORTS', 'ULTRACEMCO', 'OBEROIRLTY', 'ASTRAL', 
            'GRASIM', 'ACC', 'AMBUJACEM', 'DLF', 'LODHA', 'BEL', 'IRB'
        ],
        'Telecom & Media': [
            'BHARTIARTL', 'HFCL', 'INDUSTOWER', 'ZEEL', 'SUNTV', 'PVRINOX', 'TATACOMM'
        ]
    }
    
    def __init__(self):
        self.reverse_mapping = {}
        for sector, stocks in self.SECTOR_MAPPING.items():
            for stock in stocks:
                self.reverse_mapping[stock] = sector
    
    def get_sector(self, symbol: str) -> str:
        """Get sector for a stock symbol"""
        return self.reverse_mapping.get(symbol, 'Unknown')
    
    def analyze_sector_performance(self, stocks_data: List[Dict]) -> Dict:
        """Analyze performance by sector"""
        sector_data = defaultdict(lambda: {
            'stocks': [],
            'total_score': 0.0,
            'count': 0,
            'buy_count': 0,
            'hold_count': 0,
            'sell_count': 0
        })
        
        for stock in stocks_data:
            symbol = stock.get('symbol')
            sector = self.get_sector(symbol)
            
            sector_data[sector]['stocks'].append(symbol)
            sector_data[sector]['count'] += 1
            
            score_result = stock.get('final_score', 50.0)
            if isinstance(score_result, dict):
                final_score = score_result.get('final_score', 50.0)
            else:
                final_score = score_result
            
            sector_data[sector]['total_score'] += final_score
            
            recommendation = stock.get('recommendation', 'HOLD')
            if recommendation == 'BUY':
                sector_data[sector]['buy_count'] += 1
            elif recommendation == 'SELL':
                sector_data[sector]['sell_count'] += 1
            else:
                sector_data[sector]['hold_count'] += 1
        
        # Calculate averages and rankings
        sector_analysis = {}
        for sector, data in sector_data.items():
            if data['count'] > 0:
                avg_score = data['total_score'] / data['count']
                sector_analysis[sector] = {
                    'average_score': round(avg_score, 2),
                    'stock_count': data['count'],
                    'stocks': data['stocks'],
                    'buy_count': data['buy_count'],
                    'hold_count': data['hold_count'],
                    'sell_count': data['sell_count'],
                    'buy_ratio': round(data['buy_count'] / data['count'], 2) if data['count'] > 0 else 0
                }
        
        # Sort by average score
        sorted_sectors = sorted(
            sector_analysis.items(),
            key=lambda x: x[1]['average_score'],
            reverse=True
        )
        
        # Create ranked sectors list
        ranked_sectors = []
        for sector, data in sorted_sectors:
            recommendation = self.get_sector_recommendation(sector, dict(sorted_sectors))
            ranked_sectors.append({
                'sector': sector,
                'rank': len(ranked_sectors) + 1,
                'average_score': data['average_score'],
                'stock_count': data['stock_count'],
                'buy_count': data['buy_count'],
                'hold_count': data['hold_count'],
                'sell_count': data['sell_count'],
                'buy_ratio': data['buy_ratio'],
                'recommendation': recommendation,
                'stocks': data['stocks']
            })
        
        return {
            'sector_analysis': dict(sorted_sectors),
            'ranked_sectors': ranked_sectors,
            'top_sector': sorted_sectors[0][0] if sorted_sectors else None,
            'worst_sector': sorted_sectors[-1][0] if sorted_sectors else None,
            'timestamp': datetime.now().isoformat()
        }
    
    def get_sector_recommendation(self, sector: str, sector_data: Dict) -> str:
        """Get recommendation for a sector"""
        if sector not in sector_data:
            return "NEUTRAL"
        
        data = sector_data[sector]
        avg_score = data['average_score']
        buy_ratio = data['buy_ratio']
        
        if avg_score >= 70 and buy_ratio >= 0.6:
            return "STRONG BUY"
        elif avg_score >= 60 and buy_ratio >= 0.4:
            return "BUY"
        elif avg_score < 40 or buy_ratio < 0.2:
            return "SELL"
        else:
            return "HOLD"
    
    def get_top_sectors_by_category(self, sector_results: Dict, category: str = 'BUY', limit: int = 5) -> List[Dict]:
        """Get top sectors by recommendation category"""
        ranked_sectors = sector_results.get('ranked_sectors', [])
        
        filtered = [
            sector for sector in ranked_sectors
            if category in sector.get('recommendation', '')
        ]
        
        return filtered[:limit]
    
    def get_sector_ranking_summary(self, sector_results: Dict) -> Dict:
        """Get summary of sector rankings"""
        ranked_sectors = sector_results.get('ranked_sectors', [])
        
        summary = {
            'total_sectors': len(ranked_sectors),
            'strong_buy_sectors': len([s for s in ranked_sectors if 'STRONG BUY' in s.get('recommendation', '')]),
            'buy_sectors': len([s for s in ranked_sectors if s.get('recommendation') == 'BUY']),
            'hold_sectors': len([s for s in ranked_sectors if s.get('recommendation') == 'HOLD']),
            'sell_sectors': len([s for s in ranked_sectors if s.get('recommendation') == 'SELL']),
            'top_3_sectors': ranked_sectors[:3] if ranked_sectors else [],
            'bottom_3_sectors': ranked_sectors[-3:] if ranked_sectors else []
        }
        
        return summary
