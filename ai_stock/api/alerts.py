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
    
    def format_stock_alert(self, stock_data: Dict) -> tuple[str, str]:
        """Format stock recommendation alert"""
        symbol = stock_data.get('symbol', 'N/A')
        recommendation = stock_data.get('recommendation', 'N/A')
        final_score = stock_data.get('final_score', 0.0)
        current_price = stock_data.get('current_price', 0.0)
        target_price_data = stock_data.get('target_price', {})
        target_price = target_price_data.get('target_price', 0.0) if isinstance(target_price_data, dict) else target_price_data
        
        # Text version
        text = f"""
🚨 STOCK ALERT: {symbol} 🚨

Recommendation: {recommendation}
Final Score: {final_score}/100

Current Price: ₹{current_price:.2f}
Target Price: ₹{target_price:.2f}
Expected Change: {((target_price - current_price) / current_price * 100):.2f}%

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
        <p><strong>Expected Change:</strong> {((target_price - current_price) / current_price * 100):.2f}%</p>
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
        
        # Format message
        text = "📊 TOP STOCK RECOMMENDATIONS\n\n"
        text += "=" * 50 + "\n"
        text += "TOP 5 BUY:\n"
        for i, stock in enumerate(top_buy, 1):
            text += f"{i}. {stock.get('symbol')} - Score: {stock.get('final_score', 0):.1f}\n"
        
        text += "\nTOP 5 SELL:\n"
        for i, stock in enumerate(top_sell, 1):
            text += f"{i}. {stock.get('symbol')} - Score: {stock.get('final_score', 0):.1f}\n"
        
        text += f"\nTimestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        subject = "Daily Top Stock Recommendations"
        
        tasks = []
        if use_email:
            tasks.append(self.send_email(subject, text))
        
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
