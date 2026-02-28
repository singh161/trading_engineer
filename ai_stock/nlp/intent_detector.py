"""
Intent Detection Module using Sentence Transformers
Detects user intent from voice commands
"""
import logging
from typing import Dict, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)

# Try to import sentence-transformers, fallback to simple keyword matching
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger.warning("sentence-transformers not available. Using keyword-based intent detection.")


class IntentDetector:
    """
    Detects intent from voice commands using ML-based similarity matching
    Falls back to keyword matching if sentence-transformers not available
    """
    
    # Intent templates with example phrases
    INTENT_TEMPLATES = {
        'RUN_ANALYSIS': [
            'run complete analysis',
            'run analysis',
            'start analysis',
            'analyze stocks',
            'run ai analysis',
            'complete analysis chalao',
            'analysis start karo',
            'analysis karo',
            'stock analysis karo',
            'ai analysis chalao',
            'full analysis run karo',
        ],
        'SHOW_BEST_STOCKS': [
            'best stocks',
            'best stock find karo',
            'best stocks dikhao',
            'top stocks',
            'top stocks dikhao',
            'top stock dikhao',
            'recommended stocks',
            'best stocks show karo',
            'top performing stocks',
            'best investment stocks',
            'achhe stocks dikhao',
            'best stocks batao',
            'smart rankings',
            'show smart rankings',
            'rankings dikhao',
        ],
        'ANALYZE_STOCK': [
            'analyze stock',
            'analyze reliance',
            'analyze tcs',
            'reliance analyze karo',
            'tcs analysis',
            'stock analyze karo',
            'isko analyze karo',
            'reliance ka analysis dikhao',
        ],
        'MARKET_TREND': [
            'market trend',
            'nifty trend',
            'bank nifty trend',
            'how is the market',
            'market kaisa hai',
            'nifty kaisa hai',
            'market trend dikhao',
            'nifty banknifty batao',
            'market index',
            'show indices',
        ],
        'SHOW_SECTOR_RANKING': [
            'show sector ranking',
            'top banking stocks',
            'top it stocks',
            'sector ranking dikhao',
            'banking stocks dikhao',
            'top 3 banking stocks',
            'top 5 it stocks',
            'sector ranking show karo',
            'sector wise stocks',
            'sector ranking batao',
        ],
        'COMPARE_STOCKS': [
            'compare stocks',
            'compare tcs and infosys',
            'compare reliance and tcs',
            'compare tcs aur infosys',
            'tcs aur infosys compare karo',
            'compare these stocks',
            'stocks compare karo',
            'do stocks compare karo',
        ],
        'SHOW_TARGET_PRICE': [
            'target price',
            'show target price',
            'reliance target price',
            'tcs ka target price',
            'target price batao',
            'target price dikhao',
            'what is target price',
            'target price check karo',
            'price',
            'current price',
            'bhav',
            'stock price',
            'share price',
            'price batao',
            'price dikhao',
        ],
        'SHOW_RISK_ANALYSIS': [
            'risk analysis',
            'show risk analysis',
            'risk dikhao',
            'risk batao',
            'risk check karo',
            'risk analysis dikhao',
        ],
        'SHOW_SECTOR_ANALYSIS': [
            'sector analysis',
            'show sector analysis',
            'sector analysis dikhao',
            'sector analysis check karo',
        ],
        'SHOW_NEWS': [
            'show news',
            'news dikhao',
            'latest news',
            'stock news',
            'stock news check kare',
            'news check karo',
            'latest stock news',
            'news feed',
            'news feed dikhao',
            'recent news',
            'news padho',
        ],
        'SHOW_MOMENTUM_STOCKS': [
            'show momentum stocks',
            'momentum stocks dikhao',
            'breakout stocks',
            'momentum gems',
            'explosive stocks',
            'high momentum',
            'momentum radar',
            'momentum dikhao',
            'breakout dikhao',
            'fast moving stocks',
            'momentum radar check karo',
            'stocks with momentum',
            'high growth stocks',
        ],
        'REFRESH_DATA': [
            'refresh',
            'refresh data',
            'refresh dashboard',
            'data refresh karo',
            'taza karo',
            'refresh my dashboard',
            'latest data lao',
            'sync karo',
        ],
        'OPEN_SEARCH': [
            'search',
            'open spotlight',
            'find stock',
            'khojo',
            'spotlight open karo',
            'search open karo',
            'find ticker',
        ],
        'NAVIGATE_OVERVIEW': [
            'go to overview',
            'overview dikhao',
            'dashboard dikhao',
            'main page',
            'home dikhao',
            'overview pe chalo',
        ],
        'NAVIGATE_STOCKS': [
            'go to stocks',
            'stocks dikhao',
            'stock page pe chalo',
            'all stocks dikhao',
            'stocks ki list',
        ],
        'NAVIGATE_WATCHLIST': [
            'go to watchlist',
            'watchlist dikhao',
            'meri watchlist',
            'favorites dikhao',
            'watchlist pe chalo',
        ],
        'NAVIGATE_ALERTS': [
            'go to alerts',
            'alerts dikhao',
            'notifications dikhao',
            'warning dikhao',
            'alerts pe chalo',
        ],
        'CLOSE_WINDOW': [
            'close',
            'band karo',
            'hide details',
            'exit',
            'hatao',
            'modal band karo',
            'paina band karo',
            'close details',
        ],
        'TOGGLE_WATCHLIST': [
            'add to watchlist',
            'remove from watchlist',
            'favorite stock',
            'star stock',
            'watchlist mein dalo',
            'merit list mein rakho',
            'save this stock',
        ],
        'SWITCH_TAB_INSIGHTS': [
            'show analysis',
            'show insights',
            'analysis dikhao',
            'details dikhao',
            'back to info',
        ],
        'SWITCH_TAB_CHART': [
            'show chart',
            'open graph',
            'chart dikhao',
            'live chart',
            'graph dikhao',
            'tradingview chart',
        ],
        'TOGGLE_VOICE': [
            'toggle voice',
            'mute signals',
            'enable voice alerts',
            'bolna band karo',
            'voice band karo',
            'alerts enable karo',
            'sound on',
            'sound off',
        ],
        'SET_LAYOUT': [
            'table view',
            'card view',
            'layout badlo',
            'change layout',
            'show cards',
            'show table',
        ],
    }
    
    def __init__(self):
        """Initialize intent detector"""
        self.model = None
        self.intent_embeddings = None
        
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                # Use a lightweight model for faster inference
                logger.info("Loading sentence-transformers model for intent detection...")
                self.model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
                self._precompute_intent_embeddings()
                logger.info("Intent detector initialized with ML model")
            except Exception as e:
                logger.error(f"Failed to load sentence-transformers model: {e}")
                logger.warning("Falling back to keyword-based intent detection")
                self.model = None
        else:
            logger.info("Using keyword-based intent detection (sentence-transformers not available)")
    
    def _precompute_intent_embeddings(self):
        """Precompute embeddings for all intent templates"""
        if not self.model:
            return
        
        try:
            all_phrases = []
            intent_labels = []
            
            for intent, phrases in self.INTENT_TEMPLATES.items():
                for phrase in phrases:
                    all_phrases.append(phrase)
                    intent_labels.append(intent)
            
            # Compute embeddings
            embeddings = self.model.encode(all_phrases, convert_to_numpy=True)
            
            # Store as dict: intent -> list of embeddings
            self.intent_embeddings = {}
            for i, intent in enumerate(intent_labels):
                if intent not in self.intent_embeddings:
                    self.intent_embeddings[intent] = []
                self.intent_embeddings[intent].append(embeddings[i])
            
            logger.info(f"Precomputed embeddings for {len(self.INTENT_TEMPLATES)} intents")
        except Exception as e:
            logger.error(f"Error precomputing embeddings: {e}")
            self.model = None
    
    def detect_intent_ml(self, text: str) -> Tuple[Optional[str], float]:
        """
        Detect intent using ML similarity matching
        Returns (intent, confidence_score)
        """
        if not self.model or not self.intent_embeddings:
            return None, 0.0
        
        try:
            # Encode input text
            text_embedding = self.model.encode([text], convert_to_numpy=True)[0]
            
            best_intent = None
            best_score = 0.0
            
            # Compare with each intent's templates
            for intent, embeddings_list in self.intent_embeddings.items():
                # Compute similarity with all templates for this intent
                similarities = []
                for emb in embeddings_list:
                    similarity = cosine_similarity(
                        text_embedding.reshape(1, -1),
                        emb.reshape(1, -1)
                    )[0][0]
                    similarities.append(similarity)
                
                # Use max similarity as intent score
                max_similarity = max(similarities)
                
                if max_similarity > best_score:
                    best_score = max_similarity
                    best_intent = intent
            
            return best_intent, float(best_score)
        except Exception as e:
            logger.error(f"Error in ML intent detection: {e}")
            return None, 0.0
    
    def detect_intent_keywords(self, text: str) -> Tuple[Optional[str], float]:
        """
        Fallback keyword-based intent detection
        Returns (intent, confidence_score)
        """
        text_lower = text.lower()
        
        # Score each intent based on keyword matches
        intent_scores = {}
        
        for intent, templates in self.INTENT_TEMPLATES.items():
            score = 0.0
            matches = 0
            
            for template in templates:
                template_lower = template.lower()
                # Check if template words appear in text
                template_words = set(template_lower.split())
                text_words = set(text_lower.split())
                
                # Calculate overlap
                overlap = len(template_words & text_words)
                if overlap > 0:
                    score += overlap / len(template_words)
                    matches += 1
            
            if matches > 0:
                # Average score, normalized
                intent_scores[intent] = min(score / len(templates), 1.0)
        
        if not intent_scores:
            return None, 0.0
        
        # Return best matching intent
        best_intent = max(intent_scores.items(), key=lambda x: x[1])
        
        # Confidence threshold: at least 0.3 for keyword matching
        if best_intent[1] >= 0.3:
            return best_intent[0], best_intent[1]
        
        return None, 0.0
    
    def detect_intent(self, text: str, confidence_threshold: float = 0.5) -> Tuple[Optional[str], float]:
        """
        Detect intent from text
        Returns (intent, confidence_score)
        
        Args:
            text: Input text from voice command
            confidence_threshold: Minimum confidence to accept intent (default: 0.5)
        """
        if not text or not text.strip():
            return None, 0.0
        
        # Try ML-based detection first
        if self.model:
            intent, confidence = self.detect_intent_ml(text)
            if intent and confidence >= confidence_threshold:
                return intent, confidence
        
        # Fallback to keyword matching
        intent, confidence = self.detect_intent_keywords(text)
        
        # Lower threshold for keyword matching
        keyword_threshold = max(0.3, confidence_threshold * 0.6)
        if intent and confidence >= keyword_threshold:
            return intent, confidence
        
        return None, 0.0
