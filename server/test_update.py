#!/usr/bin/env python3
"""
Simplified test script - updates MongoDB without ML processing
Use this to test the upload -> Python -> MongoDB update workflow
"""
import os
import sys
import argparse
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DB_NAME = "finsense-ai"
COLLECTION_NAME = "fileinfos"

def main():
    parser = argparse.ArgumentParser(description="Test MongoDB Update")
    parser.add_argument("--file-id", type=str, help="MongoDB file ID to process")
    args = parser.parse_args()
    
    if not args.file_id:
        print("❌ Please provide --file-id")
        sys.exit(1)
    
    print("=" * 70)
    print(f"Testing MongoDB Update for file ID: {args.file_id}")
    print("=" * 70 + "\n")
    
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        
        # Fetch file info
        file_doc = collection.find_one({"_id": ObjectId(args.file_id)})
        
        if not file_doc:
            print(f"❌ File not found with ID: {args.file_id}")
            sys.exit(1)
        
        filename = file_doc.get('keyDetails', {}).get('filename', 'Unknown')
        print(f"✅ Found file: {filename}")
        
        # Mock update data (simulating what AI would return)
        update_data = {
            "$set": {
                "summary": "Test call - Customer inquiry about payment options",
                "voiceID": "test_voice_123",
                "keyDetails.satisfaction": "satisfied",
                "keyDetails.mood": "calm",
                "keyDetails.fraud": "no",
                "keyDetails.duration": 180
            }
        }
        
        result = collection.update_one({"_id": ObjectId(args.file_id)}, update_data)
        
        if result.modified_count > 0:
            print(f"✅ Successfully updated MongoDB!")
            print(f"   Modified fields: summary, voiceID, satisfaction, mood, fraud, duration")
        else:
            print(f"⚠️ No changes made (document may already have these values)")
        
        print("\n" + "=" * 70)
        print("✅ Test complete!")
        print("=" * 70)
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
