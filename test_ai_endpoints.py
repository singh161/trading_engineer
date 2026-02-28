"""
Quick test script for AI Stock Research Engine endpoints
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

endpoints = [
    "/ai/recommendations",
    "/ai/sector-ranking",
    "/ai/news-decisions",
    "/ai/risk-analysis",
    "/ai/sector-analysis",
    "/ai/target-prices",
    "/ai/news"
]

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("\n" + "="*60)
print("AI STOCK RESEARCH ENGINE - ENDPOINT TEST")
print("="*60)
print(f"\nTesting Backend: {BASE_URL}")
print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

results = {}

for endpoint in endpoints:
    try:
        url = f"{BASE_URL}{endpoint}"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            
            # Extract key info
            if endpoint == "/ai/recommendations":
                info = f"BUY: {len(data.get('top_buy', []))}, HOLD: {len(data.get('top_hold', []))}, SELL: {len(data.get('top_sell', []))}"
            elif endpoint == "/ai/sector-ranking":
                info = f"Ranked Sectors: {len(data.get('ranked_sectors', []))}"
            elif endpoint == "/ai/news-decisions":
                info = f"Decisions: {len(data.get('decisions', []))}"
            elif endpoint == "/ai/risk-analysis":
                info = f"Risk Data: {len(data.get('risk_data', []))}"
            elif endpoint == "/ai/sector-analysis":
                sectors = data.get('sector_data', {})
                info = f"Sectors: {len(sectors)}"
            elif endpoint == "/ai/target-prices":
                info = f"Predictions: {len(data.get('predictions', []))}"
            elif endpoint == "/ai/news":
                info = f"News Items: {len(data.get('news', []))}"
            else:
                info = "OK"
            
            print(f"[OK] {endpoint:30} - Status: {response.status_code} - {info}")
            results[endpoint] = "[OK]"
        else:
            print(f"[WARN] {endpoint:30} - Status: {response.status_code}")
            results[endpoint] = f"[WARN] Status {response.status_code}"
            
    except requests.exceptions.ConnectionError:
        print(f"[ERROR] {endpoint:30} - Connection Error (Backend not running?)")
        results[endpoint] = "[ERROR] Connection Error"
    except requests.exceptions.Timeout:
        print(f"[TIMEOUT] {endpoint:30} - Timeout")
        results[endpoint] = "[TIMEOUT]"
    except Exception as e:
        print(f"[ERROR] {endpoint:30} - Error: {str(e)[:50]}")
        results[endpoint] = f"[ERROR] {str(e)[:30]}"

print("\n" + "="*60)
print("📊 SUMMARY")
print("="*60)

working = sum(1 for v in results.values() if "[OK]" in v)
total = len(results)

print(f"\nWorking Endpoints: {working}/{total}")
print(f"Success Rate: {(working/total*100):.1f}%")

if working == total:
    print("\n[SUCCESS] All endpoints are working!")
elif working > 0:
    print(f"\n[WARNING] {total - working} endpoint(s) need attention")
else:
    print("\n[ERROR] Backend may not be running. Check backend server.")

print("\n" + "="*60)
print("[COMPLETE] Test Complete!")
print("="*60 + "\n")
