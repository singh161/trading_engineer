import requests
import json

try:
    r = requests.get("http://localhost:8000/ai/recommendations?limit=20")
    data = r.json()
    print(f"Keys in response: {list(data.keys())}")
    if "all_ranked" in data:
        all_ranked = data["all_ranked"]
        print(f"Number of stocks in all_ranked: {len(all_ranked)}")
        if len(all_ranked) > 0:
            for s in all_ranked[:5]:
                print(f"Symbol: {s.get('symbol')}, Rec: {s.get('recommendation')}, Momentum: {s.get('momentum_score')}")
        
        # Check criteria: momentum > 60 and recommendation === BUY
        momentum_gems = [s for s in all_ranked if s.get('momentum_score', 0) > 60 and s.get('recommendation') == 'BUY']
        print(f"Number of momentum gems: {len(momentum_gems)}")
    else:
        print("ERROR: all_ranked not in response")
except Exception as e:
    print(f"Error: {e}")
