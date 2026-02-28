"""
Portfolio Manager — JSON File Storage (No MySQL)
Persists user portfolio to a local JSON file: portfolio_data.json
"""
import json
import os
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

PORTFOLIO_FILE = os.path.join(os.path.dirname(__file__), "portfolio_data.json")


def _load_data() -> Dict:
    """Load portfolio data from JSON file."""
    if not os.path.exists(PORTFOLIO_FILE):
        return {"holdings": {}}
    try:
        with open(PORTFOLIO_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load portfolio data: {e}")
        return {"holdings": {}}


def _save_data(data: Dict):
    """Persist portfolio data to JSON file."""
    try:
        with open(PORTFOLIO_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Failed to save portfolio data: {e}")


class PortfolioManager:
    """Manages User Portfolio using a local JSON file — No MySQL required."""

    @classmethod
    def setup_table(cls):
        """Initialise JSON storage file if not present."""
        if not os.path.exists(PORTFOLIO_FILE):
            _save_data({"holdings": {}})
            logger.info("✅ Portfolio JSON storage initialised.")
        else:
            logger.info("✅ Portfolio JSON file already exists.")

    @classmethod
    def get_portfolio(cls) -> List[Dict]:
        """Get all portfolio holdings as list."""
        data = _load_data()
        holdings = data.get("holdings", {})
        return [
            {
                "symbol": sym,
                "quantity": info["quantity"],
                "average_price": info["average_price"]
            }
            for sym, info in holdings.items()
        ]

    @classmethod
    def add_transaction(cls, symbol: str, quantity: int, price: float) -> Dict:
        """
        Add buy transaction. If stock already exists, averages down/up.
        Negative quantity = sell.
        """
        symbol = symbol.upper()
        data = _load_data()
        holdings = data.setdefault("holdings", {})

        if symbol in holdings:
            old_qty = holdings[symbol]["quantity"]
            old_avg = holdings[symbol]["average_price"]
            new_qty = old_qty + quantity

            if new_qty > 0:
                new_avg = ((old_qty * old_avg) + (quantity * price)) / new_qty
                holdings[symbol] = {"quantity": new_qty, "average_price": round(new_avg, 4)}
                msg = f"Updated {symbol}. New avg: ₹{new_avg:.2f}, Qty: {new_qty}"
            elif new_qty == 0:
                del holdings[symbol]
                msg = f"Sold all of {symbol} — removed from portfolio."
            else:
                return {"error": f"Cannot sell {abs(quantity)} shares. You only own {old_qty}."}
        else:
            if quantity <= 0:
                return {"error": f"You don't own {symbol}. Cannot sell."}
            holdings[symbol] = {"quantity": quantity, "average_price": round(price, 4)}
            msg = f"Added {symbol} to portfolio. Qty: {quantity} @ ₹{price}"

        _save_data(data)
        return {"message": msg}

    @classmethod
    def remove_stock(cls, symbol: str) -> Dict:
        """Completely remove a stock from portfolio."""
        symbol = symbol.upper()
        data = _load_data()
        holdings = data.get("holdings", {})

        if symbol not in holdings:
            return {"error": f"{symbol} not found in portfolio."}

        del holdings[symbol]
        _save_data(data)
        return {"message": f"Removed {symbol} from portfolio."}

    @staticmethod
    def calculate_average_down(
        current_qty: int, current_avg: float,
        new_qty: int, new_price: float
    ) -> Dict:
        """Calculate new average price if you buy more shares."""
        total_qty = current_qty + new_qty
        if total_qty == 0:
            return {"new_quantity": 0, "new_average_price": 0.0, "total_investment": 0.0}

        total_cost = (current_qty * current_avg) + (new_qty * new_price)
        new_avg = total_cost / total_qty

        return {
            "new_quantity": total_qty,
            "new_average_price": round(new_avg, 2),
            "total_investment": round(total_cost, 2),
            "savings_per_share": round(current_avg - new_avg, 2)
        }
