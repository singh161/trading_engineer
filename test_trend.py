import requests
import json

def test_analyze(symbol):
    print(f"--- Analyzing {symbol} in SWING mode ---")
    try:
        r = requests.get(f"http://localhost:8000/analyze/{symbol}?mode=swing")
        if r.status_code == 200:
            data = r.json()
            print(f"Symbol: {data.get('symbol')}")
            print(f"Verdict: {data.get('final_verdict')}")
            print(f"Trend: {data.get('trend')}")
            print(f"Buy/Sell Counts: B:{data.get('buy_count')} / S:{data.get('sell_count')}")
        else:
            print(f"Error {r.status_code}: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

test_analyze("RELIANCE")
test_analyze("TCS")
test_analyze("NIFTY 50")
