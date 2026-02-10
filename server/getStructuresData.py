import asyncio
import json
import datetime
import os
import argparse
import sys
import time
from pathlib import Path
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# DON'T import backboard here - it will be imported in the async function
# DON'T import transcript here - it will be imported when needed to avoid dependency issues
sys.path.append(os.path.dirname(__file__))

"""
TO ADD:
file name
file address
org file name
voiceid
summary
key details:
    mimetype
    size
    duration
    satisfaction
    mood
    fraud
created at
"""

# Load from environment variables
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DB_NAME = "finsense-ai"
COLLECTION_NAME = "fileinfos"

mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]
collection = db[COLLECTION_NAME]
BACKBOARD_API_KEY = os.getenv('BACKBOARD_API_KEY')

if not BACKBOARD_API_KEY:
    print("⚠️  Warning: BACKBOARD_API_KEY not found in environment variables")
    print("   Please add it to the .env file in the project root")


def get_file_from_mongodb(file_id: str) -> dict:
    """
    Fetch file information from MongoDB by ID.
    
    Args:
        file_id: MongoDB ObjectId as string
        
    Returns:
        Dictionary with file information or None if not found
    """
    try:
        query = {"_id": ObjectId(file_id)}
        file_doc = collection.find_one(query)
        
        if file_doc:
            print(f"✓ Found file in MongoDB: {file_doc.get('keyDetails', {}).get('filename', 'Unknown')}")
            return {
                "id": str(file_doc["_id"]),
                "fileAddress": file_doc.get("fileAddress"),
                "filename": file_doc.get("keyDetails", {}).get("filename", "Unknown"),
                "originalname": file_doc.get("keyDetails", {}).get("originalname", "Unknown"),
                "mimetype": file_doc.get("keyDetails", {}).get("mimetype", "audio/mpeg"),
                "size": file_doc.get("keyDetails", {}).get("size", 0)
            }
        else:
            print(f"❌ File not found in MongoDB with ID: {file_id}")
            return None
    except Exception as e:
        print(f"❌ Error fetching file from MongoDB: {e}")
        return None


def get_file_metadata(audio_path: str) -> dict:
    """
    Extract metadata from audio file.
    
    Args:
        audio_path: Path to the audio file
        
    Returns:
        Dictionary with file metadata
    """
    try:
        audio_path = Path(audio_path)
        file_size = audio_path.stat().st_size
        
        return {
            "file_name": audio_path.name,
            "file_address": str(audio_path.absolute()),
            "org_file_name": audio_path.name,
            "mimetype": "audio/wav" if audio_path.suffix == ".wav" else "audio/mpeg",
            "size": file_size
        }
    except Exception as e:
        print(f"⚠ Could not extract file metadata: {e}")
        return {
            "file_name": "unknown",
            "file_address": "",
            "org_file_name": "unknown",
            "mimetype": "audio/wav",
            "size": 0
        }


def wait_for_files(audio_path, diarization_path, timeout=300, check_interval=2):
    """
    Wait for both audio file and diarization JSON to exist.
    
    Args:
        audio_path (str): Path to audio file
        diarization_path (str): Path to diarization JSON file
        timeout (int): Maximum wait time in seconds (default: 5 minutes)
        check_interval (int): Seconds between checks (default: 2 seconds)
    
    Returns:
        bool: True if both files exist, False if timeout reached
    """
    print("\n⏳ Waiting for required files...")
    print(f"   Audio: {audio_path}")
    print(f"   Diarization: {diarization_path}")
    print(f"   Timeout: {timeout} seconds\n")
    
    start_time = time.time()
    audio_exists = False
    diarization_exists = False
    
    while time.time() - start_time < timeout:
        # Check audio file
        if not audio_exists and os.path.exists(audio_path):
            audio_exists = True
            print(f"✅ Audio file found: {Path(audio_path).name}")
        
        # Check diarization JSON
        if not diarization_exists and os.path.exists(diarization_path):
            diarization_exists = True
            print(f"✅ Diarization file found: {Path(diarization_path).name}")
        
        # Both files exist
        if audio_exists and diarization_exists:
            elapsed = time.time() - start_time
            print(f"\n🎉 All required files present! (waited {elapsed:.1f}s)")
            return True
        
        # Show waiting status
        elapsed = time.time() - start_time
        remaining = timeout - elapsed
        status = []
        if not audio_exists:
            status.append("audio")
        if not diarization_exists:
            status.append("diarization")
        
        print(f"⏱️  Still waiting for {', '.join(status)}... ({remaining:.0f}s remaining)", end='\r')
        time.sleep(check_interval)
    
    # Timeout reached
    print("\n\n❌ Timeout reached! Missing files:")
    if not audio_exists:
        print(f"   ❌ Audio file: {audio_path}")
    if not diarization_exists:
        print(f"   ❌ Diarization JSON: {diarization_path}")
    
    return False


async def main(audio_path: str = None, diarization_json_path: str = None, transcript_text: str = None):
    """
    Main function to process audio transcript and extract structured data.
    
    Args:
        audio_path: Path to audio file (optional, for metadata)
        diarization_json_path: Path to diarization JSON (to run transcription)
        transcript_text: Pre-generated transcript text (if available, skips transcription)
    """
    # Track JSON file for cleanup
    transcript_json_to_delete = None
    
    # Import backboard here to avoid argparse conflicts
    try:
        from backboard import BackboardClient
    except ImportError:
        print("⚠️ backboard not installed. Install with: pip install backboard")
        return
    
    print("=" * 70)
    print("FinSense AI - Structured Data Extraction Pipeline")
    print("=" * 70 + "\n")
    
    # Step 1: Generate transcript if needed
    if not transcript_text and audio_path and diarization_json_path:
        print("📝 Generating transcript from audio with diarization...\n")
        
        # Check if diarization JSON exists
        if not os.path.exists(diarization_json_path):
            print(f"❌ Diarization JSON not found: {diarization_json_path}")
            print("   Diarization is required for transcript generation")
            return
        
        try:
            # Import transcript module to generate JSON file
            from transcript import main_transcription_pipeline
            
            # Create output path for transcript JSON
            audio_dir = Path(audio_path).parent
            audio_stem = Path(audio_path).stem
            transcript_json_path = audio_dir / f"{audio_stem}_transcript.json"
            
            print(f"⏳ Running transcript.py to generate JSON...")
            print(f"   Audio: {audio_path}")
            print(f"   Diarization: {diarization_json_path}")
            print(f"   Output: {transcript_json_path}")
            
            # Generate transcript and save to JSON file
            transcripts, transcript_text = main_transcription_pipeline(
                audio_path=audio_path,
                diarization_json_path=diarization_json_path,
                model_name="base",
                save_files=True  # This will save the JSON file
            )
            
            print(f"\n✓ Transcript JSON generated with {len(transcripts)} segments")
            print(f"✓ Transcript text: {len(transcript_text)} characters\n")
            
            # Store the JSON path for later deletion
            transcript_json_to_delete = transcript_json_path
            
        except ImportError as e:
            print(f"❌ Error: Missing dependencies for transcription")
            print(f"   {e}")
            print(f"   Install with: pip install openai-whisper librosa soundfile")
            return
        except Exception as e:
            print(f"❌ Error during transcription: {e}")
            import traceback
            traceback.print_exc()
            return
    
    # Step 2: Verify we have transcript text
    if not transcript_text:
        print("❌ No transcript text available")
        print("   Please provide audio file for transcription or transcript text")
        return
    
    print(f"📖 Processing transcript ({len(transcript_text)} characters)...\n")
    
    # Step 3: Extract file metadata
    file_metadata = {}
    if audio_path:
        file_metadata = get_file_metadata(audio_path)
        print(f"📁 File metadata extracted:")
        print(f"   File: {file_metadata['file_name']}")
        print(f"   Size: {file_metadata['size']} bytes\n")
    
    # Step 4: Initialize Backboard client and create assistant
    client = BackboardClient(api_key=BACKBOARD_API_KEY)

    # DEFINE THE TOOL
    tools = [{
    "type": "function",
    "function": {
        "name": "submit_clean_report",
        "description": "Submit structured financial data from collections call.",
        "parameters": {
            "type": "object",
            "properties": {
                # Core data
                "clean_text": {
                    "type": "string",
                    "description": "1-2 sentence professional summary, no fillers."
                },
                "summary": {
                    "type": "string",
                    "description": "3-5 sentence detailed summary: discussion, promises, concerns, next steps."
                },
                "intent": {
                    "type": "string",
                    "enum": ["payment_promise", "dispute", "refusal", "hardship", "settlement", "query", "irrelevant"]
                },
                
                # Financial (optional - omit if not mentioned)
                "amount": {
                    "type": "number",
                    "description": "Amount in rupees. Omit if not mentioned."
                },
                "payment_method": {
                    "type": "string",
                    "enum": ["UPI", "NEFT", "RTGS", "IMPS", "NACH", "CHEQUE", "CASH", "NOT_SPECIFIED"]
                },
                "payment_date": {
                    "type": "string",
                    "description": "Payment date mentioned. Omit if not mentioned."
                },
                
                # Analysis
                "risk_flag": {
                    "type": "boolean"
                },
                "sentiment": {
                    "type": "string",
                    "enum": ["cooperative", "neutral", "upset", "hostile"]
                },
                "satisfaction": {
                    "type": "string",
                    "enum": ["satisfied", "neutral", "dissatisfied", "very_dissatisfied"]
                },
                "mood": {
                    "type": "string",
                    "enum": ["calm", "anxious", "frustrated", "angry", "confused", "distressed"]
                },
                "fraud": {
                    "type": "boolean"
                },
                
                # File metadata (provided in input)
                "file_name": {"type": "string"},
                "file_address": {"type": "string"},
                "org_file_name": {"type": "string"},
                "voice_id": {"type": "string"},
                "mimetype": {"type": "string"},
                
                # Technical (optional)
                "size": {
                    "type": "integer",
                    "description": "File size in bytes. Omit if unknown."
                },
                "duration": {
                    "type": "number",
                    "description": "Call duration in seconds. Omit if unknown."
                }
            },
            "required": [
                "clean_text", "summary", "intent", "payment_method",
                "risk_flag", "sentiment", "satisfaction", "mood", "fraud",
                "file_name", "file_address", "org_file_name", "voice_id", "mimetype"
            ]
        }
    }
}]

    # CREATE ASSISTANT
    assistant = await client.create_assistant(
        name="Finance Cleaner Bot - OpenAI",
        system_prompt= (
        "You are the AI Data Engine for a Fintech Collections Agency. "
        "Your input is a raw text log from a voice recording (Speech-to-Text). "
        "Your goal is to filter noise, clean conversational artifacts, and extract structured financial data.\n\n"

        "--- PHASE 1: AUDIO CLEANING & NORMALIZATION ---\n"
        "The input will contain speech artifacts. You must CLEAN them before processing:\n"
        "1. Remove Fillers: 'um', 'uh', 'like', 'you know', 'I mean', '[inaudible]', '[laughter]'.\n"
        "2. Fix Spoken Numbers:\n"
        "   - 'twelve k' / '12k' -> 12000\n"
        "   - 'one point five lakhs' -> 150000\n"
        "   - 'two crore' -> 20000000\n"
        "3. Handle Corrections: If user says 'pay ten... I mean fifteen thousand', use 15000.\n"
        "4. Expand Abbreviations (Indian Finance Context):\n"
        "   - ptp -> Promise to Pay\n"
        "   - rnr -> Ringing No Response\n"
        "   - nach / ecs -> Auto-Debit\n"
        "   - w/o -> Write Off\n"
        "   - emi -> Monthly Installment\n\n"

        "--- PHASE 2: RELEVANCE GATEKEEPER ---\n"
        "Decide if the text contains actionable financial data.\n"
        "-> VALID: Mentions of debt, payments, amounts, dates, disputes, settlements, anything related to finance.\n"
        "-> INVALID: Greetings only ('hello?'), dead air, wrong numbers, or personal agent chit-chat.\n"
        "   *IF INVALID:* Call function with intent='irrelevant'.\n\n"

        "--- PHASE 3: DATA EXTRACTION ---\n"
        "If VALID, extract the following into the function parameters:\n"
        "1. INTENT: Classify as 'payment_promise', 'dispute', 'refusal', 'hardship', 'settlement', or 'query'.\n"
        "2. AMOUNT: Extract the exact numeric value (e.g., 5000). If none, return 0. Check if the amount mentioned is in dollars, rupees, etc and convert them to rupees. Take rupees as default\n"
        "3. METHOD: Detect UPI, NEFT, RTGS, CHEQUE, CASH, or NACH, etc\n"
        "4. PAYMENT DATE: Extract *when* the money is coming. If no date mentioned, return null.\n"
        "4. RISK FLAG: Set TRUE if user threatens (lawyer, sue, RBI, police), uses profanity, or claims harassment, or gives contradictory information\n"
        "5. SUMMARY: Generate a 1-sentence professional summary for the Bank Manager (e.g., 'Customer disputed the late fee and threatened legal action').\n\n"

        "--- PHASE 4: EXECUTION RULES ---\n"
        "1. You must ALWAYS call the 'submit_clean_report' tool.\n"
        "2. NEVER respond with plain text or markdown.\n"
        "3. If multiple amounts are mentioned, extract the final agreed/discussed amount."
    ),
        tools=tools
    )
    print(f"✓ Assistant created: {assistant.assistant_id}\n")

    # CREATE THREAD
    thread = await client.create_thread(assistant.assistant_id)
    print(f"✓ Thread created: {thread.thread_id}\n")

    # Step 5: Send transcript to AI
    print("🤖 Sending to Backboard AI for extraction...\n")
    
    response = await client.add_message(
        thread_id=thread.thread_id,
        content=transcript_text,
    )

    # Step 6: Process response
    print(f"✓ Response received:")
    print(f"   Status: {response.status}")
    print(f"   Provider: {response.model_provider if hasattr(response, 'model_provider') else 'unknown'}")
    print(f"   Model: {response.model_name if hasattr(response, 'model_name') else 'unknown'}")
    print(f"   Tokens: {response.total_tokens if hasattr(response, 'total_tokens') else 'N/A'}")
    
    if response.status == "FAILED":
        print(f"Processing failed!")
        print(f"   Reason: {response.content}")
        return

    # CHECK FOR TOOL CALLS
    if response.tool_calls and len(response.tool_calls) > 0:
        print(f"\n✓ AI called {len(response.tool_calls)} tool(s)!")
        
        tool_outputs = []
        
        for i, tool_call in enumerate(response.tool_calls):
            print(f"\n📋 Tool Call {i+1}:")
            print(f"   Function: {tool_call.function.name}")
            
            if tool_call.function.name == "submit_clean_report":
                try:
                    if hasattr(tool_call.function, 'parsed_arguments'):
                        cleaned_data = tool_call.function.parsed_arguments
                    else:
                        cleaned_data = json.loads(tool_call.function.arguments)
                    
                    print("\n" + "=" * 70)
                    print("✅ SUCCESS! EXTRACTED DATA:")
                    print("=" * 70)
                    print(json.dumps(cleaned_data, indent=2))
                    print("=" * 70)
                    
                    # Find and update existing document
                    # Use file_name as the unique identifier to find the document
                    filter_query = {"keyDetails.filename": cleaned_data.get("file_name")}
                    
                    # Dynamically build update data from ALL fields the AI provides
                    update_fields = {}
                    
                    # Fields that go to top level of document
                    top_level_fields = {
                        "summary": "summary",
                        "voice_id": "voiceID"
                    }
                    
                    # Fields that should NOT be added to keyDetails (metadata fields)
                    excluded_fields = ["file_name", "file_address", "org_file_name"]
                    
                    # Iterate through ALL fields returned by AI
                    for key, value in cleaned_data.items():
                        # Skip empty/null values
                        if value is None or value == "":
                            continue
                        
                        # Handle top-level fields
                        if key in top_level_fields:
                            update_fields[top_level_fields[key]] = value
                        # Skip excluded fields
                        elif key in excluded_fields:
                            continue
                        # Everything else goes into keyDetails
                        else:
                            # Convert fraud boolean to yes/no for consistency
                            if key == "fraud":
                                update_fields[f"keyDetails.{key}"] = "yes" if value else "no"
                            else:
                                update_fields[f"keyDetails.{key}"] = value
                    
                    # Only update if there are fields to update
                    if update_fields:
                        update_data = {"$set": update_fields}
                        result = collection.update_one(filter_query, update_data)
                        
                        if result.matched_count > 0:
                            print(f"\nDocument updated successfully! Modified {result.modified_count} field(s)")
                            print(f"   Updated {len(update_fields)} field(s): {', '.join(update_fields.keys())}")
                        else:
                            print(f"\n⚠ No document found with filename: {cleaned_data.get('file_name')}")
                            print(f"   Make sure the file exists in the database first.")
                    else:
                        print(f"\n⚠ No fields to update - all fields were empty or missing")

                    tool_outputs.append({
                        "tool_call_id": tool_call.id,
                        "output": json.dumps({
                            "status": "saved",
                            "success": True,
                            "message": "Data successfully processed and stored"
                        })
                    })
                    
                except json.JSONDecodeError as e:
                    print(f"Failed to parse: {e}")
        
        # SUBMIT TOOL OUTPUTS
        if tool_outputs:
            print(f"\nSubmitting tool results...")
            
            run_id = response.run_id if hasattr(response, 'run_id') else None
            
            if run_id:
                final_response = await client.submit_tool_outputs(
                    thread_id=thread.thread_id,
                    run_id=run_id,
                    tool_outputs=tool_outputs
                )
                
                print(f"Complete!")
                if hasattr(final_response, 'content'):
                    print(f"   AI: {final_response.content}")
    
    else:
        print(f"\n⚠ AI did not call any tools")
        print(f"   AI said: {response.content}")

    print(f"\n" + "=" * 70)
    print("✅ PIPELINE COMPLETE!")
    print("=" * 70)
    
    # Cleanup: Delete transcript JSON file to save space
    if transcript_json_to_delete and os.path.exists(transcript_json_to_delete):
        try:
            os.remove(transcript_json_to_delete)
            print(f"\n🗑️  Cleaned up transcript JSON: {transcript_json_to_delete.name}")
        except Exception as e:
            print(f"\n⚠️  Could not delete transcript JSON: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FinSense AI - Structured Data Extraction Pipeline")
    parser.add_argument("--file-id", type=str, help="MongoDB file ID to process")
    parser.add_argument("--audio-path", type=str, help="Direct audio file path")
    parser.add_argument("--diarization-path", type=str, help="Diarization JSON path")
    parser.add_argument("--transcript-text", type=str, help="Pre-generated transcript text")
    args = parser.parse_args()
    
    try:
        if args.file_id:
            # Fetch file from MongoDB
            print("=" * 70)
            print("FinSense AI - Processing from MongoDB")
            print("=" * 70 + "\n")
            
            file_info = get_file_from_mongodb(args.file_id)
            if not file_info:
                print("❌ Cannot proceed without file information")
                sys.exit(1)
            
            audio_path = file_info["fileAddress"]
            
            print(f"📁 File Info: {file_info['filename']}")
            print(f"   Path: {audio_path}")
            print(f"   Size: {file_info['size']} bytes")
            
            # Construct diarization JSON path (REQUIRED)
            audio_dir = Path(audio_path).parent
            audio_stem = Path(audio_path).stem
            diarization_path = audio_dir / f"{audio_stem}_diarization.json"
            
            # Wait for both files to be present (with 5 minute timeout)
            files_ready = wait_for_files(
                audio_path=audio_path,
                diarization_path=str(diarization_path),
                timeout=300,  # 5 minutes
                check_interval=2  # Check every 2 seconds
            )
            
            if not files_ready:
                print(f"\n⚠️  Cannot proceed without required files:")
                print(f"   1. Audio file: {audio_path}")
                print(f"   2. Diarization JSON: {diarization_path}")
                print(f"\n💡 Make sure to generate diarization JSON before/after upload.")
                sys.exit(1)
            
            print(f"\n🎯 Starting pipeline: transcript.py → Backboard AI...\n")
            
            asyncio.run(main(
                audio_path=audio_path,
                diarization_json_path=str(diarization_path)
            ))
        
        elif args.audio_path:
            # Direct path mode
            asyncio.run(main(
                audio_path=args.audio_path,
                diarization_json_path=args.diarization_path,
                transcript_text=args.transcript_text
            ))
        else:
            print("❌ Please provide --file-id or --audio-path")
            print("\nExamples:")
            print("  python getStructuresData.py --file-id 507f1f77bcf86cd799439011")
            print("  python getStructuresData.py --audio-path ./files/audio.wav")
            sys.exit(1)
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        mongo_client.close()
