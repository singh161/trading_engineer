"""
Module 6: Alert System
Email (SMTP), Telegram bot, and FastAPI endpoints
"""
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional
from datetime import datetime
import aiohttp
import asyncio
import hashlib
import json
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AlertSystem:
    """Alert system for sending notifications"""
    
    def __init__(self):
        # Email configuration
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.email_from = os.getenv("EMAIL_FROM", self.smtp_username)
        self.email_to = os.getenv("EMAIL_TO", "").split(",") if os.getenv("EMAIL_TO") else []
        
        # Telegram configuration
        self.telegram_bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID")
        
        # Alert deduplication cache
        self.cache_file = Path(__file__).parent.parent / "data" / "sent_alerts.json"
        self.sent_cache = self._load_cache()
    
    def _load_cache(self) -> Dict:
        """Load the sent alerts cache from file"""
        try:
            if self.cache_file.exists():
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading alert cache: {e}")
        return {}

    def _save_cache(self):
        """Save the sent alerts cache to file"""
        try:
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.sent_cache, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving alert cache: {e}")

    def _is_duplicate(self, alert_id: str, data: Dict, ignore_fields: List[str] = ["timestamp"]) -> bool:
        """Check if an alert is a duplicate of what was last sent"""
        # Create a copy and remove ignored fields for hashing
        data_to_hash = data.copy()
        for field in ignore_fields:
            if field in data_to_hash:
                data_to_hash.pop(field)
        
        # Stable sort keys for consistent hashing
        data_str = json.dumps(data_to_hash, sort_keys=True, default=str)
        data_hash = hashlib.md5(data_str.encode()).hexdigest()
        
        if self.sent_cache.get(alert_id) == data_hash:
            return True
        
        # Update cache if it's new
        self.sent_cache[alert_id] = data_hash
        self._save_cache()
        return False
    
    async def send_email(self, subject: str, body: str, html_body: Optional[str] = None) -> bool:
        """Send email alert (async wrapper for blocking SMTP)"""
        if not self.smtp_username or not self.smtp_password or not self.email_to:
            logger.warning("Email configuration incomplete")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.email_from
            msg['To'] = ", ".join(self.email_to)
            
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)
            
            if html_body:
                html_part = MIMEText(html_body, 'html')
                msg.attach(html_part)
            
            def _blocking_send():
                if self.smtp_port == 465:
                    import ssl
                    context = ssl.create_default_context()
                    with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port, context=context) as server:
                        server.login(self.smtp_username, self.smtp_password)
                        server.send_message(msg)
                else:
                    with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                        server.ehlo()
                        server.starttls()
                        server.ehlo()
                        server.login(self.smtp_username, self.smtp_password)
                        server.send_message(msg)
            
            await asyncio.to_thread(_blocking_send)
            logger.info(f"Email sent: {subject}")
            return True
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
    
    async def send_telegram(self, message: str) -> bool:
        """Send Telegram alert"""
        if not self.telegram_bot_token or not self.telegram_chat_id:
            logger.warning("Telegram configuration incomplete")
            return False
        
        url = f"https://api.telegram.org/bot{self.telegram_bot_token}/sendMessage"
        params = {
            "chat_id": self.telegram_chat_id,
            "text": message,
            "parse_mode": "HTML"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        logger.info("Telegram message sent")
                        return True
                    else:
                        logger.error(f"Telegram API error: {response.status}")
                        return False
        except Exception as e:
            logger.error(f"Error sending Telegram message: {e}")
            return False

    def _clean_data(self, data: any) -> any:
        """Recursively remove fields that should be ignored from hashing"""
        if isinstance(data, dict):
            return {k: self._clean_data(v) for k, v in data.items() if k not in ["timestamp", "execution_time_seconds"]}
        elif isinstance(data, list):
            return [self._clean_data(i) for i in data]
        return data

    def _is_duplicate(self, alert_id: str, data: Dict) -> bool:
        """Check if an alert is a duplicate of what was last sent"""
        # Clean data (remove timestamps etc)
        data_to_hash = self._clean_data(data)
        
        # Stable sort keys for consistent hashing
        data_str = json.dumps(data_to_hash, sort_keys=True, default=str)
        data_hash = hashlib.md5(data_str.encode()).hexdigest()
        
        if self.sent_cache.get(alert_id) == data_hash:
            return True
        
        # Update cache if it's new
        self.sent_cache[alert_id] = data_hash
        self._save_cache()
        return False
    
    def format_stock_alert(self, stock_data: Dict) -> tuple[str, str]:
        """Format stock recommendation alert"""
        symbol = stock_data.get('symbol', 'N/A')
        recommendation = stock_data.get('recommendation', 'N/A')
        final_score = stock_data.get('final_score', 0.0)
        current_price = stock_data.get('current_price', 0.0)
        target_price_data = stock_data.get('target_price', {})
        target_price = 0.0
        
        if isinstance(target_price_data, dict):
            target_price = target_price_data.get('target_price', 0.0)
        elif isinstance(target_price_data, (int, float)):
            target_price = float(target_price_data)

        # Fallback to technical sell_price if ML target is missing
        if not target_price or target_price <= 0:
            target_price = stock_data.get('sell_price', 0.0)
            
        # Calculate expected change safely
        expected_change = 0.0
        if current_price > 0 and target_price > 0:
            expected_change = ((target_price - current_price) / current_price) * 100
        
        # Text version
        text = f"""
🚨 STOCK ALERT: {symbol} 🚨

Recommendation: {recommendation}
Final Score: {final_score}/100

Current Price: ₹{current_price:.2f}
Target Price: ₹{target_price:.2f}
Expected Change: {expected_change:.2f}%

Technical Score: {stock_data.get('technical_score', 0):.1f}
Sentiment Score: {stock_data.get('sentiment_score', 0):.1f}
Fundamental Score: {stock_data.get('fundamental_score', 0):.1f}
Momentum Score: {stock_data.get('momentum_score', 0):.1f}

Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        # HTML version
        html = f"""
        <html>
        <body>
        <h2>🚨 STOCK ALERT: {symbol} 🚨</h2>
        <p><strong>Recommendation:</strong> {recommendation}</p>
        <p><strong>Final Score:</strong> {final_score}/100</p>
        <hr>
        <p><strong>Current Price:</strong> ₹{current_price:.2f}</p>
        <p><strong>Target Price:</strong> ₹{target_price:.2f}</p>
        <p><strong>Expected Change:</strong> {expected_change:.2f}%</p>
        <hr>
        <h3>Score Breakdown:</h3>
        <ul>
        <li>Technical Score: {stock_data.get('technical_score', 0):.1f}</li>
        <li>Sentiment Score: {stock_data.get('sentiment_score', 0):.1f}</li>
        <li>Fundamental Score: {stock_data.get('fundamental_score', 0):.1f}</li>
        <li>Momentum Score: {stock_data.get('momentum_score', 0):.1f}</li>
        </ul>
        <p><em>Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</em></p>
        </body>
        </html>
        """
        
        return text.strip(), html
    
    async def send_stock_alert(self, stock_data: Dict, use_email: bool = True, use_telegram: bool = True):
        """Send stock recommendation alert"""
        text, html = self.format_stock_alert(stock_data)
        symbol = stock_data.get('symbol', 'STOCK')
        recommendation = stock_data.get('recommendation', 'N/A')

        # Deduplication check
        if self._is_duplicate(f"stock_{symbol}", stock_data):
            logger.info(f"Skipping duplicate alert for {symbol} (no data change)")
            return

        subject = f"Stock Alert: {symbol} - {recommendation}"
        
        tasks = []
        if use_email:
            tasks.append(self.send_email(subject, text, html))
        
        if use_telegram:
            tasks.append(self.send_telegram(text))
            
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def send_top_stocks_alert(self, ranking_results: Dict, use_email: bool = True, use_telegram: bool = True):
        """Send alert with top stock recommendations"""
        top_buy = ranking_results.get('top_5_buy', [])
        top_sell = ranking_results.get('top_5_sell', [])

        # Deduplication check
        # We hash the lists of top stocks to detect changes
        alert_data = {"buy": top_buy, "sell": top_sell}
        if self._is_duplicate("top_recommendations", alert_data):
            logger.info("Skipping duplicate top stocks alert (no recommendations changed)")
            return

        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Format Text message (for Telegram/Plain Text Fallback)
        text = "📊 MARKET PULSE - TOP RECOMMENDATIONS\n"
        text += f"📅 {timestamp}\n"
        text += "━" * 30 + "\n\n"
        
        text += "📈 TOP BUY PICKS:\n"
        if top_buy:
            for i, stock in enumerate(top_buy, 1):
                text += f"{i}. {stock.get('symbol')} (Score: {stock.get('final_score', 0):.1f})\n"
        else:
            text += "No strong buy signals found.\n"
            
        text += "\n📉 TOP SELL PICKS:\n"
        if top_sell:
            for i, stock in enumerate(top_sell, 1):
                text += f"{i}. {stock.get('symbol')} (Score: {stock.get('final_score', 0):.1f})\n"
        else:
            text += "No strong sell signals found.\n"
        
        text += "\nCheck your Dashboard for full analysis."
        
        # Format HTML Email
        def build_table_rows(stocks, is_buy=True):
            rows = ""
            for i, s in enumerate(stocks, 1):
                score = s.get('final_score', 0)
                current = s.get('current_price', 0)
                entry = s.get('buy_price') or s.get('entry_price') or current
                target = s.get('sell_price') or s.get('target_price', {}).get('target_price') or (s.get('target_price') if isinstance(s.get('target_price'), (int, float)) else 0)
                stop_loss = s.get('stop_loss') or (entry * 0.97 if is_buy else entry * 1.03) # 3% default SL if missing
                
                # Calculations
                potential_pct = 0
                if current > 0 and target > 0:
                    potential_pct = ((target - current) / current) * 100 if is_buy else ((current - target) / current) * 100
                
                # RR Ratio calculation
                rr_ratio = "1:2.5" # Default placeholder
                risk = abs(entry - stop_loss)
                reward = abs(target - entry)
                if risk > 0:
                    rr_ratio = f"1:{reward/risk:.1f}"

                color = "#10b981" if is_buy else "#ef4444"
                
                rows += f"""
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">{i}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                        <div style="font-weight: bold; color: #1e293b;">{s.get('symbol')}</div>
                        <div style="font-size: 11px; color: #64748b;">Score: {score:.1f}</div>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                        <div style="color: #0f172a; font-weight: 500;">₹{entry:,.2f}</div>
                        <div style="font-size: 10px; color: #64748b;">(Trigger)</div>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                        <div style="color: {color}; font-weight: bold;">₹{target:,.2f}</div>
                        <div style="font-size: 10px; color: #64748b;">(Target)</div>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                        <div style="color: {color}; font-weight: bold;">{potential_pct:+.2f}%</div>
                        <div style="font-size: 10px; color: #64748b;">RR {rr_ratio}</div>
                    </td>
                </tr>
                """
            return rows if rows else '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #64748b;">No high-confidence picks found.</td></tr>'

        html = f"""
        <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; color: #1e293b; padding: 20px; line-height: 1.6;">
            <div style="max-width: 650px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 26px; letter-spacing: 1px;">� AI Trade Intelligence</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.8; font-size: 14px;">Smart Scanning Report • {timestamp}</p>
                </div>
                
                <div style="padding: 24px;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <h2 style="color: #10b981; margin: 0; font-size: 20px;">📈 BEST BUY SETUPS</h2>
                        <span style="margin-left: 10px; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">ACCUMULATE</span>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                            <tr style="background: #f8fafc; text-align: left;">
                                <th style="padding: 12px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">#</th>
                                <th style="padding: 12px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Stock</th>
                                <th style="padding: 12px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Buy At</th>
                                <th style="padding: 12px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Exit At</th>
                                <th style="padding: 12px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Return/RR</th>
                            </tr>
                        </thead>
                        <tbody>{build_table_rows(top_buy, is_buy=True)}</tbody>
                    </table>

                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <h2 style="color: #ef4444; margin: 0; font-size: 20px;">📉 BEST SELL SETUPS</h2>
                        <span style="margin-left: 10px; background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">DISTRIBUTION</span>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8fafc; text-align: left;">
                                <th style="padding: 12px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">#</th>
                                <th style="padding: 12px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Stock</th>
                                <th style="padding: 12px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Sell At</th>
                                <th style="padding: 12px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Cover At</th>
                                <th style="padding: 12px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Return/RR</th>
                            </tr>
                        </thead>
                        <tbody>{build_table_rows(top_sell, is_buy=False)}</tbody>
                    </table>

                    <div style="margin-top: 35px; padding: 20px; background: #fffbeb; border-radius: 12px; border: 1px solid #fde68a;">
                        <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 14px;">⚡ Trading Strategy Tip:</h4>
                        <p style="margin: 0; color: #b45309; font-size: 13px;">
                            Focus on stocks with <strong>RR Ratio > 1:2</strong> for sustainable growth. 
                            The <strong>Potential %</strong> is calculated from the current market price to the AI-predicted target. 
                            Always monitor volume during breakout at Buy levels.
                        </p>
                    </div>
                </div>
                
                <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                        This is an automated analysis by your Personal Trading Engineer.<br>
                        Sent to: <strong>{", ".join(self.email_to)}</strong>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        subject = f"📊 AI Market Intelligence: Top Picks for {timestamp}"
        
        tasks = []
        if use_email:
            tasks.append(self.send_email(subject, text, html))
        
        if use_telegram:
            tasks.append(self.send_telegram(text))
            
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)


if __name__ == "__main__":
    # Test alert system
    alert_system = AlertSystem()
    
    test_stock = {
        "symbol": "RELIANCE",
        "recommendation": "BUY",
        "final_score": 85.5,
        "current_price": 2500.0,
        "target_price": {"target_price": 2750.0},
        "technical_score": 80.0,
        "sentiment_score": 75.0,
        "fundamental_score": 85.0,
        "momentum_score": 90.0
    }
    
    # Test email (will only work if configured)
    # alert_system.send_stock_alert(test_stock, use_email=True, use_telegram=False)
    
    print("Alert system initialized")
