import requests
import json
import time

BASE_URL = "http://localhost:8000"

def audit_endpoint(name, method, path, body=None, params=None):
    print(f"Testing [{name}] -> {path}...")
    try:
        if method == "GET":
            r = requests.get(f"{BASE_URL}{path}", params=params, timeout=10)
        else:
            r = requests.post(f"{BASE_URL}{path}", json=body, params=params, timeout=10)
        
        if r.status_code == 200:
            print(f"  ✅ SUCCESS")
            return r.json()
        else:
            print(f"  ❌ FAILED (Status: {r.status_code})")
            print(f"     Error: {r.text[:200]}")
            return None
    except Exception as e:
        print(f"  🔥 ERROR: {e}")
        return None

def main_audit():
    print("=== STARTING FULL SYSTEM AUDIT ===\n")
    
    # 1. Basic Health
    audit_endpoint("Health Check", "GET", "/health")
    
    # 2. Market Data
    audit_endpoint("Indices Data", "GET", "/market-index")
    constituents = audit_endpoint("Nifty 50 Constituents", "GET", "/market-index-constituents", params={"index": "NIFTY 50"})
    
    # 3. Stock Analysis Logic
    audit_endpoint("Single Analysis (RELIANCE)", "GET", "/analyze/RELIANCE", params={"mode": "swing"})
    
    # 4. AI Engine
    audit_endpoint("AI Config Status", "GET", "/ai/config-status")
    audit_endpoint("AI Recommendations", "GET", "/ai/recommendations")
    audit_endpoint("AI Top Stocks", "GET", "/ai/top-stocks", params={"category": "buy"})
    
    # 5. Trading & Portfolio (Check if JSON files exist/work)
    audit_endpoint("Portfolio Dashboard", "GET", "/api/trading/dashboard")
    
    # 6. Check for Sentiment Data
    audit_endpoint("AI News Sentiment", "GET", "/ai/news")

    print("\n=== AUDIT COMPLETE ===")

if __name__ == "__main__":
    main_audit()
