"""
Debug script to test voice command processing
Tests the complete flow: NLP → Intent Detection → Action Response
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_stock.nlp.voice_nlp import VoiceNLPProcessor
from ai_stock.nlp.intent_detector import IntentDetector

def test_voice_command(command):
    print(f"\n{'='*60}")
    print(f"Testing: {command}")
    print('='*60)
    
    # Initialize processors
    nlp_processor = VoiceNLPProcessor()
    intent_detector = IntentDetector()
    
    # Step 1: Extract entities
    print("\n[1] Extracting entities...")
    entities = nlp_processor.extract_entities(command)
    print(f"   Stocks: {entities['stocks']}")
    print(f"   Sector: {entities['sector']}")
    print(f"   Limit: {entities['limit']}")
    print(f"   Normalized: {entities['normalized_text']}")
    
    # Step 2: Detect intent
    print("\n[2] Detecting intent...")
    intent, confidence = intent_detector.detect_intent(
        entities['normalized_text'],
        confidence_threshold=0.4
    )
    
    if not intent:
        print("   ❌ No intent detected with normalized text, trying original...")
        intent, confidence = intent_detector.detect_intent(
            command,
            confidence_threshold=0.3
        )
    
    if intent:
        print(f"   ✅ Intent: {intent}")
        print(f"   ✅ Confidence: {confidence:.2f}")
    else:
        print(f"   ❌ No intent detected (confidence: {confidence:.2f})")
        return
    
    # Step 3: Build action
    print("\n[3] Building action...")
    if intent == "RUN_ANALYSIS":
        print("   → Action: POST /ai/run-analysis")
    elif intent == "SHOW_SECTOR_RANKING":
        print(f"   → Action: Navigate to Sector Ranking")
        if entities['sector']:
            print(f"   → Filter: Sector = {entities['sector']}")
        if entities['limit']:
            print(f"   → Filter: Limit = {entities['limit']}")
    elif intent == "SHOW_TARGET_PRICE":
        print(f"   → Action: Navigate to Target Price")
        if entities['stocks']:
            print(f"   → Filter: Stock = {entities['stocks'][0]}")
    elif intent == "SHOW_BEST_STOCKS":
        print(f"   → Action: Navigate to Rankings")
    elif intent == "SHOW_NEWS":
        print(f"   → Action: Navigate to News")
        if entities['stocks']:
            print(f"   → Filter: Stock = {entities['stocks'][0]}")
    elif intent == "SHOW_RISK_ANALYSIS":
        print(f"   → Action: Navigate to Risk Analysis")
    else:
        print(f"   → Action: {intent}")
    
    print("\n✅ Command processing complete!")

if __name__ == "__main__":
    # Test commands in Hindi/Hinglish
    test_commands = [
        "Reliance ka bhav batao",
        "रिलायंस का भाव बताओ",
        "top 5 banking stocks dikhao",
        "टॉप 5 बैंकिंग स्टॉक दिखाओ",
        "TCS aur Infosys compare karo",
        "analysis karo",
        "complete analysis chalao",
        "news dikhao",
        "risk analysis dikhao",
        "sector ranking batao",
    ]
    
    for cmd in test_commands:
        test_voice_command(cmd)
