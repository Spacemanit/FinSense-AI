import asyncio
import json
import datetime
from pymongo import MongoClient
from backboard import BackboardClient
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

MONGO_URI = "mongodb://localhost:5000/"
DB_NAME = "fileinfos"
COLLECTION_NAME = "finsense-ai"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]
BACKBOARD_API_KEY = "espr_d1PIZFtmGB0DcMaiUMt1qBqpum0QaqfpluoUOHXyEdE"

async def main():
    client = BackboardClient(api_key=BACKBOARD_API_KEY)

    # DEFINE THE TOOL (same as before)
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

    # CREATE ASSISTANT (same as before)
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
        "2. AMOUNT: Extract the exact numeric value (e.g., 5000). If none, return 0. Check if the amout mentioned is in dollars, rupees, etc and convert them to rupees. Take rupees as default\n"
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
    print(f"Assistant created: {assistant.assistant_id}\n")

    # CREATE THREAD (same as before)
    thread = await client.create_thread(assistant.assistant_id)
    print(f"Thread created: {thread.thread_id}\n")

    # TEST INPUT
    messy_input = "the total numsum loan amt dispersed will be 987432 bucks"
    #TODO: messy_input = ccfile()
    print(f"Input: {messy_input}\n")

    # SEND MESSAGE - THIS IS WHERE IT CHANGES!
    # Specify OpenAI as the provider and which model to use
    print(" Processing with OpenAI...")
    response = await client.add_message(
        thread_id=thread.thread_id,
        content=messy_input,
    )

    # Rest is the same...
    print(f"\n Status: {response.status}")
    print(f"   Provider: {response.model_provider if hasattr(response, 'model_provider') else 'unknown'}")
    print(f"   Model: {response.model_name if hasattr(response, 'model_name') else 'unknown'}")
    print(f"   Tokens: {response.total_tokens if hasattr(response, 'total_tokens') else 'N/A'}")
    
    if response.status == "FAILED":
        print(f" Processing failed!")
        print(f"   Reason: {response.content}")
        return

    # CHECK FOR TOOL CALLS
    if response.tool_calls and len(response.tool_calls) > 0:
        print(f"\n AI called {len(response.tool_calls)} tool(s)!")
        
        tool_outputs = []
        
        for i, tool_call in enumerate(response.tool_calls):
            print(f"\n Tool Call {i+1}:")
            print(f"   Function: {tool_call.function.name}")
            
            if tool_call.function.name == "submit_clean_report":
                try:
                    if hasattr(tool_call.function, 'parsed_arguments'):
                        cleaned_data = tool_call.function.parsed_arguments
                    else:
                        cleaned_data = json.loads(tool_call.function.arguments)
                    
                    print("\n" + "=" * 70)
                    print(" SUCCESS! EXTRACTED DATA:")
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
                            print(f"✓ Document updated successfully! Modified {result.modified_count} field(s)")
                            print(f"  Updated {len(update_fields)} field(s): {', '.join(update_fields.keys())}")
                        else:
                            print(f"⚠ No document found with filename: {cleaned_data.get('file_name')}")
                            print(f"  Make sure the file exists in the database first.")
                    else:
                        print(f"⚠ No fields to update - all fields were empty or missing")

                    tool_outputs.append({
                        "tool_call_id": tool_call.id,
                        "output": json.dumps({
                            "status": "saved",
                            "success": True,
                            "message": "Data successfully processed and stored"
                        })
                    })
                    
                except json.JSONDecodeError as e:
                    print(f" Failed to parse: {e}")
        
        # SUBMIT TOOL OUTPUTS
        if tool_outputs:
            print(f"\n Submitting tool results...")
            
            run_id = response.run_id if hasattr(response, 'run_id') else None
            
            if run_id:
                final_response = await client.submit_tool_outputs(
                    thread_id=thread.thread_id,
                    run_id=run_id,
                    tool_outputs=tool_outputs
                )
                
                print(f"Complete!")
                if hasattr(final_response, 'content'):
                    print(f"AI: {final_response.content}")
    
    else:
        print(f"\n AI did not call any tools")
        print(f"   AI said: {response.content}")

    print(f"\n" + "=" * 70)
    print("COMPLETE!")
    print("=" * 70)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"\n Error: {e}")
        import traceback
        traceback.print_exc()