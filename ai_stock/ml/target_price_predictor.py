"""
Module 4: Target Price ML Model
Uses XGBoost or RandomForest for price prediction
"""
import os
import pickle
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Try importing ML libraries
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("XGBoost not available. Install: pip install xgboost")

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("scikit-learn not available. Install: pip install scikit-learn")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TargetPricePredictor:
    """ML model for predicting target stock prices"""
    
    def __init__(self, use_xgboost: bool = True):
        self.use_xgboost = use_xgboost and XGBOOST_AVAILABLE
        self.model = None
        self.model_dir = Path(__file__).parent.parent / "models"
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.model_file = self.model_dir / "target_price.pkl"
        self.is_trained = False
    
    def prepare_features(self, technical_data: Dict, sentiment_score: float = 0.0, 
                        fundamental_score: float = 0.0) -> np.ndarray:
        """Prepare feature vector for ML model"""
        features = []
        
        # Technical indicators
        features.append(technical_data.get('rsi', 50.0) / 100.0)  # Normalize RSI
        features.append(technical_data.get('macd', 0.0))
        features.append(technical_data.get('macd_hist', 0.0))
        
        # Volume change (normalized)
        volume_change = technical_data.get('volume_change', 0.0)
        features.append(np.tanh(volume_change / 100.0))  # Normalize with tanh
        
        # Price momentum
        price_change = technical_data.get('price_change_pct', 0.0)
        features.append(np.tanh(price_change / 10.0))  # Normalize
        
        # EMA positions
        ema_20 = technical_data.get('ema_20', 0.0)
        ema_50 = technical_data.get('ema_50', 0.0)
        current_price = technical_data.get('price', 1.0)
        
        if current_price > 0:
            features.append((current_price - ema_20) / current_price)  # Price vs EMA20
            features.append((current_price - ema_50) / current_price)  # Price vs EMA50
            features.append((ema_20 - ema_50) / current_price)  # EMA20 vs EMA50
        else:
            features.extend([0.0, 0.0, 0.0])
        
        # Sentiment score (normalized -1 to 1)
        features.append(np.clip(sentiment_score, -1.0, 1.0))
        
        # Fundamental score (normalized 0 to 1)
        features.append(fundamental_score / 100.0)
        
        # Trend indicator (encoded)
        trend = technical_data.get('trend', 'NEUTRAL')
        if trend == 'UP':
            features.append(1.0)
        elif trend == 'DOWN':
            features.append(-1.0)
        else:
            features.append(0.0)
        
        return np.array(features).reshape(1, -1)
    
    def create_model(self):
        """Create ML model"""
        if self.use_xgboost:
            self.model = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42,
                objective='reg:squarederror'
            )
            logger.info("Created XGBoost model")
        else:
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            logger.info("Created RandomForest model")
    
    def train(self, X: np.ndarray, y: np.ndarray, test_size: float = 0.2):
        """Train the model"""
        if not SKLEARN_AVAILABLE:
            logger.error("scikit-learn not available for training")
            return None
        
        if self.model is None:
            self.create_model()
        
        try:
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42
            )
            
            # Train model
            logger.info(f"Training model on {len(X_train)} samples...")
            self.model.fit(X_train, y_train)
            
            # Evaluate
            y_pred_train = self.model.predict(X_train)
            y_pred_test = self.model.predict(X_test)
            
            train_mae = mean_absolute_error(y_train, y_pred_train)
            test_mae = mean_absolute_error(y_test, y_pred_test)
            train_r2 = r2_score(y_train, y_pred_train)
            test_r2 = r2_score(y_test, y_pred_test)
            
            logger.info(f"Training MAE: {train_mae:.2f}, R²: {train_r2:.3f}")
            logger.info(f"Test MAE: {test_mae:.2f}, R²: {test_r2:.3f}")
            
            self.is_trained = True
            
            # Save model
            self.save_model()
            
            return {
                "train_mae": train_mae,
                "test_mae": test_mae,
                "train_r2": train_r2,
                "test_r2": test_r2
            }
        except Exception as e:
            logger.error(f"Training error: {e}")
            return None
    
    def predict(self, technical_data: Dict, sentiment_score: float = 0.0, 
                fundamental_score: float = 0.0) -> Dict:
        """Predict target price"""
        if not self.is_trained and self.model_file.exists():
            self.load_model()
        
        if self.model is None:
            logger.warning("Model not trained. Using linear regression fallback.")
            return self._predict_fallback(technical_data)
        
        try:
            # Prepare features
            features = self.prepare_features(technical_data, sentiment_score, fundamental_score)
            
            # Predict
            target_price = self.model.predict(features)[0]
            current_price = technical_data.get('price', 0.0)
            
            # Calculate confidence based on feature quality
            confidence = self._calculate_confidence(technical_data, sentiment_score, fundamental_score)
            
            # Ensure target price is reasonable
            if current_price > 0:
                price_change_pct = ((target_price - current_price) / current_price) * 100
                # Cap at ±50% change
                if abs(price_change_pct) > 50:
                    target_price = current_price * (1 + np.sign(price_change_pct) * 0.5)
            
            return {
                "target_price": round(float(target_price), 2),
                "current_price": round(float(current_price), 2),
                "price_change_pct": round(((target_price - current_price) / current_price) * 100, 2) if current_price > 0 else 0.0,
                "confidence": round(confidence, 3),
                "model_used": "xgboost" if self.use_xgboost else "random_forest",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            current_price = technical_data.get('price', 0.0)
            return {
                "target_price": current_price * 1.05,
                "confidence": 0.3,
                "error": str(e)
            }
    
    def _calculate_confidence(self, technical_data: Dict, sentiment_score: float, 
                             fundamental_score: float) -> float:
        """Calculate prediction confidence"""
        confidence = 0.5  # Base confidence
        
        # Technical indicators quality
        if technical_data.get('rsi') is not None:
            confidence += 0.1
        if technical_data.get('macd') is not None:
            confidence += 0.1
        if technical_data.get('ema_20') is not None and technical_data.get('ema_50') is not None:
            confidence += 0.1
        
        # Sentiment score quality
        if abs(sentiment_score) > 0.3:
            confidence += 0.1
        
        # Fundamental score quality
        if fundamental_score > 50:
            confidence += 0.1
        
        return min(1.0, confidence)
    
    def save_model(self):
        """Save trained model to file"""
        if self.model is None:
            return
        
        try:
            with open(self.model_file, 'wb') as f:
                pickle.dump(self.model, f)
            logger.info(f"Model saved to {self.model_file}")
        except Exception as e:
            logger.error(f"Error saving model: {e}")
    
    def _predict_fallback(self, technical_data: Dict) -> Dict:
        """
        Fallback prediction using simple linear regression on EMAs/Price
        Projects trend based on recent price vs EMAs
        """
        current_price = technical_data.get('price', 0.0)
        if current_price <= 0:
             return {"target_price": 0.0, "confidence": 0.0, "model_used": "error"}

        ema_20 = technical_data.get('ema_20', current_price)
        ema_50 = technical_data.get('ema_50', current_price)
        
        # Simple projection: momentum based on Price vs EMA20 vs EMA50
        # If Price > EMA20 > EMA50, strong uptrend.
        
        momentum_factor = 0.0
        if ema_20 > 0:
            momentum_factor += (current_price - ema_20) / ema_20
        if ema_50 > 0:
            momentum_factor += (current_price - ema_50) / ema_50
            
        # Dampen the momentum for projection (we don't expect it to continue linearly forever)
        projected_change = momentum_factor * 0.5 
        
        # Cap projection
        projected_change = max(-0.15, min(0.25, projected_change)) # Max -15% to +25%
        
        target_price = current_price * (1 + projected_change)
        
        # Ensure target is at least slightly different if momentum is very low but trend is present
        trend = technical_data.get('trend', 'NEUTRAL')
        if abs(projected_change) < 0.01:
            if trend == 'UP':
                target_price = current_price * 1.02
            elif trend == 'DOWN':
                target_price = current_price * 0.98

        return {
            "target_price": round(target_price, 2),
            "current_price": round(current_price, 2),
            "price_change_pct": round(((target_price - current_price) / current_price) * 100, 2),
            "confidence": 0.4, # Lower confidence for fallback
            "model_used": "linear_fallback",
            "timestamp": datetime.now().isoformat()
        }

    def load_model(self):
        """Load trained model from file"""
        if not self.model_file.exists():
            return
        
        try:
            with open(self.model_file, 'rb') as f:
                self.model = pickle.load(f)
            self.is_trained = True
            logger.info(f"Model loaded from {self.model_file}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
    
    def generate_synthetic_training_data(self, n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic training data for initial model training"""
        np.random.seed(42)
        
        X = []
        y = []
        
        for _ in range(n_samples):
            # Generate random features
            rsi = np.random.uniform(20, 80)
            macd = np.random.uniform(-5, 5)
            macd_hist = np.random.uniform(-3, 3)
            volume_change = np.random.uniform(-50, 100)
            price_change = np.random.uniform(-10, 10)
            current_price = np.random.uniform(50, 2000)
            
            ema_20 = current_price * np.random.uniform(0.9, 1.1)
            ema_50 = current_price * np.random.uniform(0.85, 1.15)
            
            sentiment_score = np.random.uniform(-1, 1)
            fundamental_score = np.random.uniform(0, 100)
            
            trend_val = np.random.choice([-1, 0, 1])
            
            # Prepare features
            tech_data = {
                'rsi': rsi,
                'macd': macd,
                'macd_hist': macd_hist,
                'volume_change': volume_change,
                'price_change_pct': price_change,
                'price': current_price,
                'ema_20': ema_20,
                'ema_50': ema_50,
                'trend': 'UP' if trend_val > 0 else 'DOWN' if trend_val < 0 else 'NEUTRAL'
            }
            
            features = self.prepare_features(tech_data, sentiment_score, fundamental_score)
            X.append(features[0])
            
            # Generate target price (simplified model)
            # Target price depends on technical indicators, sentiment, and fundamentals
            base_change = (rsi - 50) / 100 * 0.1  # RSI influence
            base_change += macd_hist * 0.02  # MACD influence
            base_change += sentiment_score * 0.05  # Sentiment influence
            base_change += (fundamental_score - 50) / 100 * 0.03  # Fundamental influence
            
            target_price = current_price * (1 + base_change + np.random.normal(0, 0.02))
            y.append(target_price)
        
        return np.array(X), np.array(y)


if __name__ == "__main__":
    # Test target price predictor
    predictor = TargetPricePredictor()
    
    # Generate and train on synthetic data
    X, y = predictor.generate_synthetic_training_data(n_samples=500)
    predictor.create_model()
    results = predictor.train(X, y)
    
    # Test prediction
    test_technical = {
        'rsi': 65.0,
        'macd': 2.5,
        'macd_hist': 1.2,
        'volume_change': 25.0,
        'price_change_pct': 3.5,
        'price': 2500.0,
        'ema_20': 2450.0,
        'ema_50': 2400.0,
        'trend': 'UP'
    }
    
    prediction = predictor.predict(test_technical, sentiment_score=0.6, fundamental_score=75.0)
    print(f"Target Price: ₹{prediction['target_price']}")
    print(f"Confidence: {prediction['confidence']:.1%}")
