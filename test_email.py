"""
Quick email test script — Port 465 SSL check
Run: python test_email.py
"""
import smtplib
import ssl
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER   = os.getenv("SMTP_SERVER")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "465"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM    = os.getenv("EMAIL_FROM")
EMAIL_TO      = os.getenv("EMAIL_TO")

print(f"📧 SMTP Server  : {SMTP_SERVER}")
print(f"🔌 Port         : {SMTP_PORT}")
print(f"👤 Username     : {SMTP_USERNAME}")
print(f"📤 From         : {EMAIL_FROM}")
print(f"📥 To           : {EMAIL_TO}")
print()

try:
    if SMTP_PORT == 465:
        context = ssl.create_default_context()
        print("🔒 Connecting with SMTP_SSL (port 465)...")
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            print("✅ Login successful!")
            server.sendmail(
                EMAIL_FROM,
                EMAIL_TO,
                f"Subject: Test Email from Trading Engineer\n\nYe ek test email hai. Email configuration sahi kaam kar raha hai!"
            )
            print("✅ Test email sent successfully!")
    else:
        print("🔒 Connecting with STARTTLS (port 587)...")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            print("✅ Login successful!")
            server.sendmail(
                EMAIL_FROM,
                EMAIL_TO,
                f"Subject: Test Email from Trading Engineer\n\nYe ek test email hai. Email configuration sahi kaam kar raha hai!"
            )
            print("✅ Test email sent successfully!")

except smtplib.SMTPAuthenticationError as e:
    print(f"❌ Authentication failed: {e}")
    print("   → Username/Password galat hai ya app-password chahiye")
except smtplib.SMTPConnectError as e:
    print(f"❌ Cannot connect to SMTP server: {e}")
    print("   → Server address ya port galat hai, ya firewall block kar raha hai")
except ssl.SSLError as e:
    print(f"❌ SSL Error: {e}")
    print("   → SSL certificate issue ya wrong port")
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
