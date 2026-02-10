#!/usr/bin/env python3
"""
Simple test script to verify the MongoDB -> file workflow
"""
import os
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DB_NAME = "finsense-ai"
COLLECTION_NAME = "fileinfos"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

print("=" * 70)
print("Testing FinSense AI Workflow")
print("=" * 70 + "\n")

# Get a file from MongoDB
file_id = "6989e07e4e1be2bae7233086"
print(f"📋 Fetching file with ID: {file_id}")

file_doc = collection.find_one({"_id": ObjectId(file_id)})

if file_doc:
    print(f"✅ Found file in MongoDB!")
    print(f"   Filename: {file_doc.get('keyDetails', {}).get('filename', 'Unknown')}")
    print(f"   File address: {file_doc.get('fileAddress', 'No address')}")
    print(f"   Size: {file_doc.get('keyDetails', {}).get('size', 0)} bytes")
    
    file_path = file_doc.get('fileAddress')
    if file_path:
        if os.path.exists(file_path):
            print(f"✅ File exists on disk: {file_path}")
        else:
            print(f"❌ File NOT found on disk: {file_path}")
    else:
        print("❌ No file address in database")
else:
    print(f"❌ File not found in MongoDB")

print("\n" + "=" * 70)
print("✅ Workflow test complete!")
print("=" * 70)

client.close()
