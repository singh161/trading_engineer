"""
Voice Command NLP Utilities
Handles Hindi/Hinglish normalization, entity extraction, and intent detection
"""
import re
import logging
from typing import Dict, List, Optional, Tuple
from collections import defaultdict

logger = logging.getLogger(__name__)


class VoiceNLPProcessor:
    """
    Processes voice commands in Hindi, Hinglish, and English
    Normalizes text and extracts entities (stocks, sectors, limits)
    """
    
    # Stock aliases mapping (Hindi/Hinglish → English → Symbol)
    STOCK_ALIASES = {
        # Reliance
        'reliance': 'RELIANCE',
        'ril': 'RELIANCE',
        'reliance industries': 'RELIANCE',
        'रिलायंस': 'RELIANCE',
        
        # TCS
        'tcs': 'TCS',
        'tata consultancy': 'TCS',
        'टीसीएस': 'TCS',
        
        # Infosys
        'infosys': 'INFY',
        'infy': 'INFY',
        'इन्फोसिस': 'INFY',
        
        # HDFC Bank
        'hdfc bank': 'HDFCBANK',
        'hdfc': 'HDFCBANK',
        'एचडीएफसी': 'HDFCBANK',
        'hdfc bank': 'HDFCBANK',
        
        # ICICI Bank
        'icici bank': 'ICICIBANK',
        'icici': 'ICICIBANK',
        'आईसीआईसीआई': 'ICICIBANK',
        
        # SBI
        'sbi': 'SBIN',
        'state bank': 'SBIN',
        'state bank of india': 'SBIN',
        'एसबीआई': 'SBIN',
        
        # Bajaj Finance
        'bajaj finance': 'BAJFINANCE',
        'bajaj': 'BAJFINANCE',
        'बजाज': 'BAJFINANCE',
        
        # Wipro
        'wipro': 'WIPRO',
        'विप्रो': 'WIPRO',
        
        # Hindustan Unilever
        'hindustan unilever': 'HINDUNILVR',
        'hul': 'HINDUNILVR',
        'हिंदुस्तान यूनिलीवर': 'HINDUNILVR',
        
        # ITC
        'itc': 'ITC',
        'आईटीसी': 'ITC',
        
        # Kotak Bank
        'kotak bank': 'KOTAKBANK',
        'kotak': 'KOTAKBANK',
        'कोटक': 'KOTAKBANK',
        
        # L&T
        'l&t': 'LT',
        'l and t': 'LT',
        'larsen': 'LT',
        'larsen and toubro': 'LT',
        
        # Axis Bank
        'axis bank': 'AXISBANK',
        'axis': 'AXISBANK',
        'एक्सिस': 'AXISBANK',
        
        # Maruti
        'maruti': 'MARUTI',
        'maruti suzuki': 'MARUTI',
        'मारुति': 'MARUTI',
        
        # HCL Tech
        'hcl tech': 'HCLTECH',
        'hcl': 'HCLTECH',
        'एचसीएल': 'HCLTECH',
        
        # Asian Paints
        'asian paints': 'ASIANPAINT',
        'asian paint': 'ASIANPAINT',
        
        # Titan
        'titan': 'TITAN',
        'टाइटन': 'TITAN',
        
        # Nestle
        'nestle': 'NESTLEIND',
        'नेस्ले': 'NESTLEIND',
        
        # UltraTech Cement
        'ultratech': 'ULTRACEMCO',
        'ultratech cement': 'ULTRACEMCO',
        
        # Tata Motors
        'tata motors': 'TATAMOTORS',
        'tata motor': 'TATAMOTORS',
        'टाटा मोटर्स': 'TATAMOTORS',
        
        # Tata Steel
        'tata steel': 'TATASTEEL',
        'टाटा स्टील': 'TATASTEEL',
        
        # JSW Steel
        'jsw steel': 'JSWSTEEL',
        'jsw': 'JSWSTEEL',
        
        # Bharti Airtel
        'bharti airtel': 'BHARTIARTL',
        'airtel': 'BHARTIARTL',
        'भारती एयरटेल': 'BHARTIARTL',
        
        # Adani
        'adani enterprises': 'ADANIENT',
        'adani': 'ADANIENT',
        'अडानी': 'ADANIENT',
        
        # Adani Ports
        'adani ports': 'ADANIPORTS',
        
        # Bajaj Finserv
        'bajaj finserv': 'BAJAJFINSV',
        
        # Divis Labs
        'divis': 'DIVISLAB',
        'divis labs': 'DIVISLAB',
        
        # Dr Reddy's
        'dr reddy': 'DRREDDY',
        'dr reddys': 'DRREDDY',
        'डॉ रेड्डी': 'DRREDDY',
        
        # Grasim
        'grasim': 'GRASIM',
        'ग्रासिम': 'GRASIM',
        
        # HDFC Life
        'hdfc life': 'HDFCLIFE',
        
        # Hero Motocorp
        'hero motocorp': 'HEROMOTOCO',
        'hero': 'HEROMOTOCO',
        'हीरो': 'HEROMOTOCO',
        
        # IndusInd Bank
        'indusind bank': 'INDUSINDBK',
        'indusind': 'INDUSINDBK',
        
        # NTPC
        'ntpc': 'NTPC',
        'एनटीपीसी': 'NTPC',
        
        # ONGC
        'ongc': 'ONGC',
        'ओएनजीसी': 'ONGC',
        
        # Power Grid
        'power grid': 'POWERGRID',
        'powergrid': 'POWERGRID',
        
        # Sun Pharma
        'sun pharma': 'SUNPHARMA',
        'sun pharmaceutical': 'SUNPHARMA',
        'सन फार्मा': 'SUNPHARMA',
        
        # Tech Mahindra
        'tech mahindra': 'TECHM',
        'techm': 'TECHM',
        'टेक महिंद्रा': 'TECHM',
        
        # Tata Consumer
        'tata consumer': 'TATACONSUM',
    }
    
    # Sector mappings (Hindi/Hinglish → English)
    SECTOR_MAPPING = {
        'banking': 'BANKING',
        'bank': 'BANKING',
        'बैंकिंग': 'BANKING',
        'बैंक': 'BANKING',
        
        'it': 'IT',
        'information technology': 'IT',
        'आईटी': 'IT',
        'सूचना प्रौद्योगिकी': 'IT',
        
        'oil': 'OIL_GAS',
        'oil and gas': 'OIL_GAS',
        'petroleum': 'OIL_GAS',
        'तेल': 'OIL_GAS',
        
        'telecom': 'TELECOM',
        'telecommunications': 'TELECOM',
        'दूरसंचार': 'TELECOM',
        
        'fmcg': 'FMCG',
        'fast moving consumer goods': 'FMCG',
        'एफएमसीजी': 'FMCG',
        
        'auto': 'AUTO',
        'automobile': 'AUTO',
        'automotive': 'AUTO',
        'ऑटो': 'AUTO',
        'मोटर वाहन': 'AUTO',
        
        'pharma': 'PHARMA',
        'pharmaceutical': 'PHARMA',
        'pharmaceuticals': 'PHARMA',
        'फार्मा': 'PHARMA',
        'दवा': 'PHARMA',
        
        'cement': 'CEMENT',
        'सीमेंट': 'CEMENT',
        
        'steel': 'STEEL',
        'स्टील': 'STEEL',
        
        'finance': 'FINANCE',
        'वित्त': 'FINANCE',
        
        'infrastructure': 'INFRASTRUCTURE',
        'infra': 'INFRASTRUCTURE',
        'बुनियादी ढांचा': 'INFRASTRUCTURE',
        
        'power': 'POWER',
        'बिजली': 'POWER',
        
        'chemicals': 'CHEMICALS',
        'रसायन': 'CHEMICALS',
        
        'retail': 'RETAIL',
        'खुदरा': 'RETAIL',
        
        'paint': 'PAINT',
        'पेंट': 'PAINT',
        
        'conglomerate': 'CONGLOMERATE',
    }
    
    # Hinglish/Hindi normalization patterns
    HINGLISH_PATTERNS = {
        r'\bdikhao\b': 'show',
        r'\bbatao\b': 'tell',
        r'\bka\b': 'of',
        r'\bki\b': 'of',
        r'\bke\b': 'of',
        r'\bka\s+target\b': 'target',
        r'\baur\b': 'and',
        r'\bse\b': 'from',
        r'\bpar\b': 'on',
        r'\bmein\b': 'in',
        r'\bko\b': 'to',
        r'\bchaahiye\b': 'want',
        r'\bchahiye\b': 'want',
        r'\bchahie\b': 'want',
        
        # Devanagari Patterns (Pure Hindi)
        r'\bदिखाओ\b': 'show',
        r'\bदिखाएं\b': 'show',
        r'\bबताओ\b': 'tell',
        r'\bबताएं\b': 'tell',
        r'\bका\b': 'of',
        r'\bकी\b': 'of',
        r'\bके\b': 'of',
        r'\bलक्ष्य\b': 'target',
        r'\bटारगेट\b': 'target',
        r'\bऔर\b': 'and',
        r'\bसे\b': 'from',
        r'\bपर\b': 'on',
        r'\bमें\b': 'in',
        r'\bको\b': 'to',
        r'\bचाहिए\b': 'want',
        r'\bचाहिये\b': 'want',
        r'\bटॉप\b': 'top',
        r'\bशीर्ष\b': 'top',
        r'\bस्टॉक\b': 'stock',
        r'\bशेयर\b': 'stock',
        r'\bन्यूज़\b': 'news',
        r'\bखबर\b': 'news',
        r'\bसमाचार\b': 'news',
        r'\bकीमत\b': 'price',
        r'\bभाव\b': 'price',
        r'\bखरीदें\b': 'buy',
        r'\bबेचें\b': 'sell',
        r'\bरैंकिंग\b': 'ranking',
        r'\bविश्लेषण\b': 'analysis',
        r'\bजोखिम\b': 'risk',
    }
    
    def __init__(self):
        """Initialize the NLP processor"""
        # Create reverse lookup for faster stock symbol matching
        self._stock_lookup = {}
        for alias, symbol in self.STOCK_ALIASES.items():
            self._stock_lookup[alias.lower()] = symbol
        
        # Create reverse lookup for sectors
        self._sector_lookup = {}
        for alias, sector in self.SECTOR_MAPPING.items():
            self._sector_lookup[alias.lower()] = sector
    
    def normalize_text(self, text: str) -> str:
        """
        Normalize Hindi/Hinglish text to English for processing
        """
        if not text:
            return ""
        
        text_lower = text.lower().strip()
        
        # Apply Hinglish pattern replacements
        normalized = text_lower
        for pattern, replacement in self.HINGLISH_PATTERNS.items():
            normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)
        
        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        return normalized
    
    def extract_stocks(self, text: str) -> List[str]:
        """
        Extract stock symbols from text
        Returns list of normalized stock symbols (e.g., ['RELIANCE', 'TCS'])
        """
        if not text:
            return []
        
        text_lower = text.lower()
        found_stocks = []
        
        # Check for direct symbol matches (uppercase)
        symbol_pattern = r'\b([A-Z]{2,15})\b'
        direct_symbols = re.findall(symbol_pattern, text)
        for symbol in direct_symbols:
            if symbol in self.STOCK_ALIASES.values():
                found_stocks.append(symbol)
        
        # Check aliases
        for alias, symbol in self.STOCK_ALIASES.items():
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(alias.lower()) + r'\b'
            if re.search(pattern, text_lower):
                if symbol not in found_stocks:
                    found_stocks.append(symbol)
        
        return found_stocks
    
    def extract_sector(self, text: str) -> Optional[str]:
        """
        Extract sector from text
        Returns normalized sector name (e.g., 'BANKING', 'IT')
        """
        if not text:
            return None
        
        text_lower = text.lower()
        
        # Check sector mappings
        for alias, sector in self.SECTOR_MAPPING.items():
            pattern = r'\b' + re.escape(alias.lower()) + r'\b'
            if re.search(pattern, text_lower):
                return sector
        
        return None
    
    def extract_limit(self, text: str) -> Optional[int]:
        """
        Extract numeric limit from text (e.g., 'top 3', 'top 5')
        Returns integer limit or None
        """
        if not text:
            return None
        
        # Pattern: "top 3", "top 5", "3 stocks", "5 stocks", etc.
        patterns = [
            r'top\s+(\d+)',
            r'(\d+)\s+stocks?',
            r'(\d+)\s+companies?',
            r'first\s+(\d+)',
            r'(\d+)\s+top',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                try:
                    limit = int(match.group(1))
                    if 1 <= limit <= 50:  # Reasonable limit
                        return limit
                except ValueError:
                    continue
        
        return None
    
    def extract_entities(self, text: str) -> Dict:
        """
        Extract all entities from text
        Returns dict with stocks, sector, limit
        """
        normalized = self.normalize_text(text)
        
        return {
            'stocks': self.extract_stocks(text),  # Use original text for stock extraction
            'sector': self.extract_sector(text),
            'limit': self.extract_limit(normalized), # Use normalized text for limit extraction
            'normalized_text': normalized,
            'original_text': text
        }
