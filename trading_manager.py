"""
Trading Manager — Paper Trading System (Groww/Zerodha Style)
Manages virtual trades with Stop Loss, Target, P&L tracking.
Persists all data to a local JSON file: trades_data.json
"""
import json
import os
import logging
import uuid
from datetime import datetime
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

TRADES_FILE = os.path.join(os.path.dirname(__file__), "trades_data.json")

# Default virtual balance
DEFAULT_BALANCE = 1000000.0  # ₹10 Lakh


def _load_data() -> Dict:
    """Load trades data from JSON file."""
    if not os.path.exists(TRADES_FILE):
        return {
            "balance": DEFAULT_BALANCE,
            "initial_balance": DEFAULT_BALANCE,
            "orders": [],
            "positions": {},
            "trade_history": [],
            "created_at": datetime.now().isoformat()
        }
    try:
        with open(TRADES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load trades data: {e}")
        return {
            "balance": DEFAULT_BALANCE,
            "initial_balance": DEFAULT_BALANCE,
            "orders": [],
            "positions": {},
            "trade_history": [],
            "created_at": datetime.now().isoformat()
        }


def _save_data(data: Dict):
    """Persist trades data to JSON file."""
    try:
        with open(TRADES_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Failed to save trades data: {e}")


class TradingManager:
    """
    Paper Trading Manager — Groww/Zerodha style.
    Supports Buy/Sell, Stop Loss, Target, P&L tracking.
    """

    @classmethod
    def setup(cls):
        """Initialize trades file if not present."""
        if not os.path.exists(TRADES_FILE):
            _save_data({
                "balance": DEFAULT_BALANCE,
                "initial_balance": DEFAULT_BALANCE,
                "orders": [],
                "positions": {},
                "trade_history": [],
                "created_at": datetime.now().isoformat()
            })
            logger.info("✅ Trading data file initialized.")

    @classmethod
    def get_balance(cls) -> Dict:
        """Get current balance and overall P&L."""
        data = _load_data()
        initial = data.get("initial_balance", DEFAULT_BALANCE)
        current = data.get("balance", DEFAULT_BALANCE)
        
        # Calculate invested amount in open positions
        positions = data.get("positions", {})
        invested = sum(
            p["quantity"] * p["avg_price"]
            for p in positions.values()
            if p["quantity"] > 0
        )
        
        return {
            "balance": round(current, 2),
            "initial_balance": round(initial, 2),
            "invested": round(invested, 2),
            "available": round(current, 2),
            "total_value": round(current + invested, 2),
            "overall_pnl": round((current + invested) - initial, 2),
            "overall_pnl_pct": round((((current + invested) - initial) / initial) * 100, 2) if initial > 0 else 0,
        }

    @classmethod
    def place_order(cls, symbol: str, order_type: str, quantity: int,
                    price: float, stop_loss: Optional[float] = None,
                    target: Optional[float] = None) -> Dict:
        """
        Place a BUY or SELL order.
        
        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            order_type: 'BUY' or 'SELL'
            quantity: Number of shares
            price: Entry price per share
            stop_loss: Optional stop loss price
            target: Optional target price
        
        Returns:
            Order confirmation dict
        """
        symbol = symbol.upper()
        order_type = order_type.upper()
        
        if order_type not in ("BUY", "SELL"):
            return {"error": "Order type must be BUY or SELL"}
        
        if quantity <= 0:
            return {"error": "Quantity must be greater than 0"}
        
        if price <= 0:
            return {"error": "Price must be greater than 0"}

        data = _load_data()
        positions = data.get("positions", {})
        balance = data.get("balance", DEFAULT_BALANCE)
        
        total_cost = quantity * price
        
        if order_type == "BUY":
            # Check balance
            if total_cost > balance:
                return {
                    "error": f"Insufficient balance. Need ₹{total_cost:,.2f} but have ₹{balance:,.2f}"
                }
            
            # Deduct from balance
            data["balance"] = balance - total_cost
            
            # Update or create position
            if symbol in positions:
                pos = positions[symbol]
                old_qty = pos["quantity"]
                old_avg = pos["avg_price"]
                new_qty = old_qty + quantity
                new_avg = ((old_qty * old_avg) + (quantity * price)) / new_qty
                
                positions[symbol] = {
                    **pos,
                    "quantity": new_qty,
                    "avg_price": round(new_avg, 2),
                    "stop_loss": stop_loss if stop_loss else pos.get("stop_loss"),
                    "target": target if target else pos.get("target"),
                    "last_updated": datetime.now().isoformat(),
                }
            else:
                positions[symbol] = {
                    "symbol": symbol,
                    "quantity": quantity,
                    "avg_price": round(price, 2),
                    "stop_loss": stop_loss,
                    "target": target,
                    "entry_date": datetime.now().isoformat(),
                    "last_updated": datetime.now().isoformat(),
                }
        
        elif order_type == "SELL":
            # Check if we have the position
            if symbol not in positions:
                return {"error": f"No position in {symbol} to sell."}
            
            pos = positions[symbol]
            if quantity > pos["quantity"]:
                return {
                    "error": f"Cannot sell {quantity} shares. You only have {pos['quantity']}."
                }
            
            # Calculate P&L for this sell
            buy_avg = pos["avg_price"]
            pnl = (price - buy_avg) * quantity
            pnl_pct = ((price - buy_avg) / buy_avg) * 100 if buy_avg > 0 else 0
            
            # Add proceeds to balance
            data["balance"] = balance + (quantity * price)
            
            # Record trade in history
            trade_record = {
                "id": str(uuid.uuid4())[:8],
                "symbol": symbol,
                "type": "SELL",
                "quantity": quantity,
                "buy_price": round(buy_avg, 2),
                "sell_price": round(price, 2),
                "pnl": round(pnl, 2),
                "pnl_pct": round(pnl_pct, 2),
                "exit_reason": "MANUAL",
                "date": datetime.now().isoformat(),
            }
            data.setdefault("trade_history", []).insert(0, trade_record)
            
            # Update position
            remaining = pos["quantity"] - quantity
            if remaining == 0:
                del positions[symbol]
            else:
                positions[symbol] = {
                    **pos,
                    "quantity": remaining,
                    "last_updated": datetime.now().isoformat(),
                }
        
        # Create order record
        order_id = str(uuid.uuid4())[:8]
        order = {
            "id": order_id,
            "symbol": symbol,
            "type": order_type,
            "quantity": quantity,
            "price": round(price, 2),
            "stop_loss": stop_loss,
            "target": target,
            "total_value": round(total_cost, 2),
            "status": "EXECUTED",
            "timestamp": datetime.now().isoformat(),
        }
        data.setdefault("orders", []).insert(0, order)
        
        # Keep only last 200 orders
        data["orders"] = data["orders"][:200]
        data["positions"] = positions
        
        _save_data(data)
        
        return {
            "message": f"{order_type} order executed for {quantity} shares of {symbol} @ ₹{price:,.2f}",
            "order": order,
            "balance": round(data["balance"], 2),
        }

    @classmethod
    def get_positions(cls, current_prices: Optional[Dict[str, float]] = None) -> List[Dict]:
        """
        Get all open positions with live P&L.
        
        Args:
            current_prices: Dict of symbol -> current_price for live P&L calculation
        
        Returns:
            List of positions with P&L info
        """
        data = _load_data()
        positions = data.get("positions", {})
        
        result = []
        for symbol, pos in positions.items():
            qty = pos["quantity"]
            avg = pos["avg_price"]
            sl = pos.get("stop_loss")
            target = pos.get("target")
            invested = qty * avg
            
            # Use current price if available
            current_price = None
            if current_prices and symbol in current_prices:
                current_price = current_prices[symbol]
            
            current_value = qty * current_price if current_price else None
            pnl = (current_price - avg) * qty if current_price else None
            pnl_pct = ((current_price - avg) / avg) * 100 if current_price and avg > 0 else None
            
            # Check SL/Target status
            sl_status = None
            target_status = None
            if current_price:
                if sl and current_price <= sl:
                    sl_status = "HIT"
                elif sl:
                    sl_distance = ((current_price - sl) / current_price) * 100
                    sl_status = f"{sl_distance:.1f}% away"
                
                if target and current_price >= target:
                    target_status = "HIT"
                elif target:
                    target_distance = ((target - current_price) / current_price) * 100
                    target_status = f"{target_distance:.1f}% away"
            
            result.append({
                "symbol": symbol,
                "quantity": qty,
                "avg_price": round(avg, 2),
                "invested": round(invested, 2),
                "current_price": round(current_price, 2) if current_price else None,
                "current_value": round(current_value, 2) if current_value else None,
                "pnl": round(pnl, 2) if pnl is not None else None,
                "pnl_pct": round(pnl_pct, 2) if pnl_pct is not None else None,
                "stop_loss": sl,
                "target": target,
                "sl_status": sl_status,
                "target_status": target_status,
                "entry_date": pos.get("entry_date"),
            })
        
        # Sort by invested amount descending
        result.sort(key=lambda x: x["invested"], reverse=True)
        return result

    @classmethod
    def update_sl_target(cls, symbol: str, stop_loss: Optional[float] = None,
                         target: Optional[float] = None) -> Dict:
        """Update stop loss and/or target for a position."""
        symbol = symbol.upper()
        data = _load_data()
        positions = data.get("positions", {})
        
        if symbol not in positions:
            return {"error": f"No open position for {symbol}"}
        
        if stop_loss is not None:
            positions[symbol]["stop_loss"] = round(stop_loss, 2)
        if target is not None:
            positions[symbol]["target"] = round(target, 2)
        
        positions[symbol]["last_updated"] = datetime.now().isoformat()
        data["positions"] = positions
        _save_data(data)
        
        return {
            "message": f"Updated {symbol} — SL: ₹{positions[symbol].get('stop_loss')}, Target: ₹{positions[symbol].get('target')}",
            "position": positions[symbol]
        }

    @classmethod
    def get_trade_history(cls, limit: int = 50) -> List[Dict]:
        """Get closed trade history."""
        data = _load_data()
        history = data.get("trade_history", [])
        return history[:limit]

    @classmethod
    def get_orders(cls, limit: int = 50) -> List[Dict]:
        """Get order history."""
        data = _load_data()
        orders = data.get("orders", [])
        return orders[:limit]

    @classmethod
    def get_dashboard_stats(cls, current_prices: Optional[Dict[str, float]] = None) -> Dict:
        """Get overall trading dashboard statistics."""
        data = _load_data()
        balance = data.get("balance", DEFAULT_BALANCE)
        initial = data.get("initial_balance", DEFAULT_BALANCE)
        positions = data.get("positions", {})
        history = data.get("trade_history", [])
        
        # Calculate invested & current value
        invested = 0
        current_value = 0
        total_unrealized_pnl = 0
        
        for symbol, pos in positions.items():
            qty = pos["quantity"]
            avg = pos["avg_price"]
            inv = qty * avg
            invested += inv
            
            if current_prices and symbol in current_prices:
                cp = current_prices[symbol]
                cv = qty * cp
                current_value += cv
                total_unrealized_pnl += (cv - inv)
            else:
                current_value += inv  # assume no change
        
        # Realized P&L from history
        total_realized_pnl = sum(t.get("pnl", 0) for t in history)
        
        # Win/Loss stats
        winning_trades = [t for t in history if t.get("pnl", 0) > 0]
        losing_trades = [t for t in history if t.get("pnl", 0) < 0]
        
        total_trades = len(history)
        win_rate = (len(winning_trades) / total_trades * 100) if total_trades > 0 else 0
        
        # Best and worst trade
        best_trade = max(history, key=lambda t: t.get("pnl", 0)) if history else None
        worst_trade = min(history, key=lambda t: t.get("pnl", 0)) if history else None
        
        total_portfolio_value = balance + current_value
        overall_pnl = total_portfolio_value - initial
        overall_pnl_pct = (overall_pnl / initial) * 100 if initial > 0 else 0
        
        return {
            "balance": round(balance, 2),
            "initial_balance": round(initial, 2),
            "invested": round(invested, 2),
            "current_value": round(current_value, 2),
            "total_portfolio_value": round(total_portfolio_value, 2),
            "overall_pnl": round(overall_pnl, 2),
            "overall_pnl_pct": round(overall_pnl_pct, 2),
            "unrealized_pnl": round(total_unrealized_pnl, 2),
            "realized_pnl": round(total_realized_pnl, 2),
            "total_trades": total_trades,
            "winning_trades": len(winning_trades),
            "losing_trades": len(losing_trades),
            "win_rate": round(win_rate, 1),
            "open_positions": len(positions),
            "best_trade": best_trade,
            "worst_trade": worst_trade,
        }

    @classmethod
    def reset_account(cls) -> Dict:
        """Reset trading account to initial balance."""
        _save_data({
            "balance": DEFAULT_BALANCE,
            "initial_balance": DEFAULT_BALANCE,
            "orders": [],
            "positions": {},
            "trade_history": [],
            "created_at": datetime.now().isoformat()
        })
        return {"message": f"Account reset. Balance: ₹{DEFAULT_BALANCE:,.2f}"}

    @classmethod
    def exit_position(cls, symbol: str, price: float, reason: str = "MANUAL") -> Dict:
        """
        Exit entire position (sell all shares).
        
        Args:
            symbol: Stock symbol
            price: Current/exit price
            reason: Exit reason (MANUAL, SL_HIT, TARGET_HIT)
        """
        symbol = symbol.upper()
        data = _load_data()
        positions = data.get("positions", {})
        
        if symbol not in positions:
            return {"error": f"No open position for {symbol}"}
        
        pos = positions[symbol]
        qty = pos["quantity"]
        avg = pos["avg_price"]
        
        pnl = (price - avg) * qty
        pnl_pct = ((price - avg) / avg) * 100 if avg > 0 else 0
        
        # Add proceeds to balance
        data["balance"] = data.get("balance", DEFAULT_BALANCE) + (qty * price)
        
        # Record in history
        trade_record = {
            "id": str(uuid.uuid4())[:8],
            "symbol": symbol,
            "type": "SELL",
            "quantity": qty,
            "buy_price": round(avg, 2),
            "sell_price": round(price, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
            "exit_reason": reason,
            "date": datetime.now().isoformat(),
        }
        data.setdefault("trade_history", []).insert(0, trade_record)
        
        # Remove position
        del positions[symbol]
        data["positions"] = positions
        
        _save_data(data)
        
        emoji = "🟢" if pnl >= 0 else "🔴"
        return {
            "message": f"{emoji} Exited {symbol}: {qty} shares @ ₹{price:,.2f} | P&L: ₹{pnl:,.2f} ({pnl_pct:.2f}%)",
            "trade": trade_record,
            "balance": round(data["balance"], 2),
        }
