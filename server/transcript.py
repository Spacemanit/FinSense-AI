import json
import os
import re
import logging
from pathlib import Path
from typing import List, Dict, Tuple
import warnings

import torch
import librosa
import soundfile as sf
import numpy as np
import whisper

warnings.filterwarnings('ignore')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


MODEL_NAME = "base"
DEVICE = "cpu"
MIN_SEGMENT_DURATION = 0.1
MAX_SEGMENT_DURATION = 120.0

FINANCIAL_CORRECTIONS = {
    r'\be\s*m\s*i\b': 'EMI',
    r'\bk\s*y\s*c\b': 'KYC',
    r'\bn\s*b\s*f\s*c\b': 'NBFC',
    r'\be\s*c\s*s\b': 'ECS',
    r'\bn\s*a\s*c\s*h\b': 'NACH',
    r'\br\s*t\s*g\s*s\b': 'RTGS',
    r'\bn\s*e\s*f\s*t\b': 'NEFT',
    r'\bi\s*m\s*p\s*s\b': 'IMPS',
    r'\bg\s*s\s*t\b': 'GST',
    r'\bp\s*a\s*n\b': 'PAN',
    r'\ba\s*a\s*d\s*h\s*a\s*r\b': 'Aadhaar',
    r'\bmoritorium\b': 'moratorium',
    r'\bmoretoreum\b': 'moratorium',
    r'\bforclosure\b': 'foreclosure',
    r'\bforclose\b': 'foreclose',
    r'\bpre\s*payment\b': 'prepayment',
    r'\bpre\s*closure\b': 'preclosure',
    r'\bover\s*do\b': 'overdue',
    r'\bdefault\s*er\b': 'defaulter',
    r'\bequated\s+monthly\s+installment': 'EMI',
    r'\bequated\s+monthly\s+instalment': 'EMI',
    r'\bknow\s+your\s+customer\b': 'KYC',
    r'\bnon\s+banking\s+financial\s+company\b': 'NBFC',
    r'\belectronic\s+clearing\s+service\b': 'ECS',
    r'\breal\s+time\s+gross\s+settlement\b': 'RTGS',
    r'\bnational\s+electronic\s+funds\s+transfer\b': 'NEFT',
    r'\bimmediate\s+payment\s+service\b': 'IMPS',
}


def load_diarization_json(json_path: str) -> List[Dict]:
    try:
        encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                with open(json_path, 'r', encoding=encoding) as f:
                    content = f.read()
                    
                if not content.strip():
                    raise ValueError(f"Diarization file is empty: {json_path}")
                
                diarization_data = json.loads(content)
                break
            except (UnicodeDecodeError, json.JSONDecodeError) as e:
                if encoding == encodings[-1]:
                    raise ValueError(f"Could not parse JSON. Error: {e}")
                continue
        
        if not isinstance(diarization_data, list):
            raise ValueError("Diarization JSON must be a list of segments")
        
        for segment in diarization_data:
            if not all(key in segment for key in ['start', 'end', 'speaker']):
                raise ValueError("Each segment must have 'start', 'end', and 'speaker' fields")
        
        logger.info(f"Loaded {len(diarization_data)} segments from {json_path}")
        return diarization_data
    
    except Exception as e:
        logger.error(f"Failed to load diarization JSON: {e}")
        raise


def load_audio(audio_path: str) -> Tuple[np.ndarray, int]:
    try:
        audio, sr = librosa.load(audio_path, sr=16000, mono=True)
        logger.info(f"Loaded audio from {audio_path} - Sample rate: {sr}Hz, Shape: {audio.shape}")
        return audio, sr
    
    except Exception as e:
        logger.error(f"Failed to load audio: {e}")
        raise


def extract_audio_segment(
    audio: np.ndarray,
    sr: int,
    start_time: float,
    end_time: float
) -> np.ndarray:
    start_sample = int(start_time * sr)
    end_sample = int(end_time * sr)
    
    segment = audio[start_sample:end_sample]
    
    return segment


def initialize_whisper_model(model_name: str = MODEL_NAME):
    logger.info(f"Loading Whisper model: {model_name}")
    
    try:
        model = whisper.load_model(model_name, device=DEVICE)
        logger.info("Whisper model loaded successfully")
        return model
    
    except Exception as e:
        logger.error(f"Failed to load Whisper model: {e}")
        raise


def transcribe_segment(audio_segment: np.ndarray, model) -> str:
    try:
        with torch.no_grad():
            result = model.transcribe(
                audio_segment,
                language='en',
                fp16=False,
                verbose=False
            )
        
        transcription = result['text'].strip()
        
        return transcription
    
    except Exception as e:
        logger.warning(f"Transcription failed for segment: {e}")
        return ""


def apply_financial_corrections(text: str) -> str:
    corrected_text = text
    
    for pattern, replacement in FINANCIAL_CORRECTIONS.items():
        corrected_text = re.sub(pattern, replacement, corrected_text, flags=re.IGNORECASE)
    
    return corrected_text


def remove_artifacts(text: str) -> str:
    text = re.sub(r'<unk>', '', text)
    text = re.sub(r'\[PAD\]', '', text)
    text = re.sub(r'\[UNK\]', '', text)
    
    text = re.sub(r'\b(\w+)(\s+\1\b)+', r'\1', text)
    
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text


def post_process_transcription(text: str) -> str:
    text = remove_artifacts(text)
    text = apply_financial_corrections(text)
    text = text.strip()
    
    return text


def generate_text_output(transcripts: List[Dict], output_path: str) -> None:
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            for segment in transcripts:
                start_time = segment['start']
                end_time = segment['end']
                speaker = segment['speaker']
                text = segment['text']
                
                start_formatted = f"{int(start_time // 60):02d}:{start_time % 60:05.2f}"
                end_formatted = f"{int(end_time // 60):02d}:{end_time % 60:05.2f}"
                
                f.write(f"[{speaker}] {start_formatted} - {end_formatted}\n")
                f.write(f"{text}\n\n")
        
        logger.info(f"Text transcript saved to {output_path}")
    
    except Exception as e:
        logger.error(f"Failed to save text output: {e}")
        raise


def generate_json_output(transcripts: List[Dict], output_path: str) -> None:
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(transcripts, f, indent=2, ensure_ascii=False)
        
        logger.info(f"JSON transcript saved to {output_path}")
    
    except Exception as e:
        logger.error(f"Failed to save JSON output: {e}")
        raise


def transcribe_diarized_audio(
    audio_path: str,
    diarization_json_path: str,
    model_name: str = MODEL_NAME
) -> List[Dict]:
    diarization_segments = load_diarization_json(diarization_json_path)
    
    audio, sr = load_audio(audio_path)
    
    model = initialize_whisper_model(model_name)
    
    transcripts = []
    total_segments = len(diarization_segments)
    
    logger.info(f"Starting transcription of {total_segments} segments...")
    
    for idx, segment in enumerate(diarization_segments, 1):
        start_time = segment['start']
        end_time = segment['end']
        speaker = segment['speaker']
        duration = end_time - start_time
        
        if duration < MIN_SEGMENT_DURATION:
            logger.debug(f"Skipping segment {idx}/{total_segments} (too short: {duration:.2f}s)")
            continue
        
        if duration > MAX_SEGMENT_DURATION:
            logger.warning(f"Segment {idx}/{total_segments} is very long ({duration:.2f}s)")
        
        try:
            audio_segment = extract_audio_segment(audio, sr, start_time, end_time)
            
            raw_text = transcribe_segment(audio_segment, model)
            
            processed_text = post_process_transcription(raw_text)
            
            transcripts.append({
                'start': round(start_time, 2),
                'end': round(end_time, 2),
                'speaker': speaker,
                'text': processed_text
            })
            
            if idx % 10 == 0:
                logger.info(f"Processed {idx}/{total_segments} segments")
        
        except Exception as e:
            logger.error(f"Error processing segment {idx}/{total_segments}: {e}")
            transcripts.append({
                'start': round(start_time, 2),
                'end': round(end_time, 2),
                'speaker': speaker,
                'text': "[Transcription failed]"
            })
    
    logger.info(f"Transcription complete: {len(transcripts)} segments processed")
    return transcripts


def main_transcription_pipeline(
    audio_path: str,
    diarization_json_path: str,
    model_name: str = MODEL_NAME,
    save_files: bool = True
) -> Tuple[List[Dict], str]:
    """
    Main transcription pipeline that returns transcripts and combined text.
    
    Args:
        audio_path: Path to audio file
        diarization_json_path: Path to diarization JSON
        model_name: Whisper model name
        save_files: Whether to save output files (default True)
        
    Returns:
        Tuple of (transcripts list, combined text string)
    """
    try:
        audio_filename = Path(audio_path).stem
        audio_dir = Path(audio_path).parent
        
        text_output_path = audio_dir / f"{audio_filename}_transcript.txt"
        json_output_path = audio_dir / f"{audio_filename}_transcript.json"
        
        transcripts = transcribe_diarized_audio(
            audio_path=audio_path,
            diarization_json_path=diarization_json_path,
            model_name=model_name
        )
        
        # Generate combined text string
        full_text = []
        for segment in transcripts:
            speaker = segment.get('speaker', 'Unknown')
            text = segment.get('text', '')
            if text:
                full_text.append(f"[{speaker}]: {text}")
        
        combined_text = " ".join(full_text)
        
        # Save files if requested
        if save_files:
            generate_text_output(transcripts, str(text_output_path))
            generate_json_output(transcripts, str(json_output_path))
            
            logger.info("=" * 60)
            logger.info("Transcription pipeline completed successfully!")
            logger.info(f"Text output: {text_output_path}")
            logger.info(f"JSON output: {json_output_path}")
            logger.info("=" * 60)
        
        # Return transcripts and combined text
        return transcripts, combined_text
    
    except Exception as e:
        logger.error(f"Transcription pipeline failed: {e}")
        raise


if __name__ == "__main__":
    AUDIO_PATH = r".\\audio_files\\file1_cleaned.wav"
    DIARIZATION_JSON_PATH = r".\\audio_files\\file1_cleaned_diarization.json"
    
    main_transcription_pipeline(
        audio_path=AUDIO_PATH,
        diarization_json_path=DIARIZATION_JSON_PATH,
        model_name="base"
    )
