import os
import json
import torch
from pyannote.audio import Pipeline
from huggingface_hub import login
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

class SpeakerDiarizer:
    def __init__(self, num_speakers=2):
        self.num_speakers = num_speakers
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    def diarize(self, audio_path):
        pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
        pipeline.to(self.device)
        
        diarization = pipeline(audio_path, num_speakers=self.num_speakers)
        
        segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segments.append({
                "speaker": speaker,
                "start": round(turn.start, 2),
                "end": round(turn.end, 2),
                "duration": round(turn.end - turn.start, 2)
            })
        
        return segments
    
    def save_results(self, segments, audio_path):
        base_name = os.path.splitext(audio_path)[0]
        txt_path = f"{base_name}_diarization.txt"
        json_path = f"{base_name}_diarization.json"
        
        with open(txt_path, "w", encoding="utf-8") as f:
            for seg in segments:
                line = f"[{seg['start']:.2f} - {seg['end']:.2f}] {seg['speaker']}\n"
                f.write(line)
        
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(segments, f, indent=2)
        
        return txt_path, json_path

if __name__ == "__main__":
    AUDIO_FILE = r".\\audio_files\\file1_cleaned.wav"
    HF_TOKEN = os.getenv('HUGGINGFACE_TOKEN')
    NUM_SPEAKERS = 2
    
    if not HF_TOKEN:
        print("❌ Error: HUGGINGFACE_TOKEN not found in environment variables")
        print("   Please add it to the .env file in the project root")
        exit(1)
    
    login(token=HF_TOKEN)
    
    print(f"Using device: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
    print(f"Processing: {AUDIO_FILE}")
    
    diarizer = SpeakerDiarizer(num_speakers=NUM_SPEAKERS)
    
    segments = diarizer.diarize(AUDIO_FILE)
    
    txt_file, json_file = diarizer.save_results(segments, AUDIO_FILE)
    
    print(f"\nDiarization complete!")
    print(f"Total segments: {len(segments)}")
    print(f"Speakers found: {len(set(seg['speaker'] for seg in segments))}")
    print(f"\nFiles saved:")
    print(f"  {txt_file}")
    print(f"  {json_file}")