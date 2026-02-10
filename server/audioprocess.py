import os
import argparse
import logging
import numpy as np
import librosa
import soundfile as sf
import noisereduce as nr
from pydub import AudioSegment
from pydub.silence import split_on_silence
from scipy.signal import butter, sosfilt
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

AudioSegment.converter = os.path.join(os.getcwd(), "ffmpeg.exe")

# MongoDB Configuration
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DB_NAME = "finsense-ai"
COLLECTION_NAME = "fileinfos"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AudioPreprocessor:
    def __init__(self, target_sr=16000):
        self.target_sr = target_sr
        # Initialize MongoDB connection
        self.mongo_client = MongoClient(MONGO_URI)
        self.db = self.mongo_client[DB_NAME]
        self.collection = self.db[COLLECTION_NAME]
    
    def get_file_from_mongodb(self, file_id=None, filename=None):
        """
        Fetch file information from MongoDB.
        
        Args:
            file_id: MongoDB ObjectId as string
            filename: Original filename to search for
            
        Returns:
            Dictionary with file information or None if not found
        """
        try:
            if file_id:
                # Search by MongoDB _id
                query = {"_id": ObjectId(file_id)}
                file_doc = self.collection.find_one(query)
            elif filename:
                # Search by filename in keyDetails
                query = {"keyDetails.filename": filename}
                file_doc = self.collection.find_one(query)
            else:
                logger.error("Either file_id or filename must be provided")
                return None
            
            if file_doc:
                logger.info(f"✓ Found file in MongoDB: {file_doc.get('keyDetails', {}).get('filename', 'Unknown')}")
                return {
                    "id": str(file_doc["_id"]),
                    "fileAddress": file_doc.get("fileAddress"),
                    "filename": file_doc.get("keyDetails", {}).get("filename", "Unknown"),
                    "originalname": file_doc.get("keyDetails", {}).get("originalname", "Unknown"),
                    "mimetype": file_doc.get("keyDetails", {}).get("mimetype", "audio/mpeg"),
                    "size": file_doc.get("keyDetails", {}).get("size", 0)
                }
            else:
                logger.error(f"File not found in MongoDB with {'ID: ' + file_id if file_id else 'filename: ' + filename}")
                return None
        except Exception as e:
            logger.error(f"Error fetching file from MongoDB: {e}")
            return None

    def load_audio(self, file_path):
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        try:
            y, sr = librosa.load(file_path, sr=self.target_sr, mono=True)
            return y, sr
        except Exception as e:
            raise RuntimeError(f"Failed to load audio: {e}")

    def apply_high_pass_filter(self, y, sr, cutoff=50):
        try:
            sos = butter(5, cutoff, 'hp', fs=sr, output='sos')
            filtered_y = sosfilt(sos, y)
            return filtered_y
        except Exception as e:
            return y

    def apply_low_pass_filter(self, y, sr, cutoff=8000):
        try:
            sos = butter(5, cutoff, 'lp', fs=sr, output='sos')
            filtered_y = sosfilt(sos, y)
            return filtered_y
        except Exception as e:
            return y

    def reduce_noise(self, y, sr):
        try:
            reduced_y = nr.reduce_noise(y=y, sr=sr, stationary=True, prop_decrease=0.25, n_std_thresh_stationary=1.5)
            return reduced_y
        except Exception as e:
            return y

    def normalize_volume(self, audio_segment, target_dBFS=-20.0):
        change_in_dBFS = target_dBFS - audio_segment.dBFS
        return audio_segment.apply_gain(change_in_dBFS)

    def process_pipeline(self, input_path):
        try:
            y, sr = self.load_audio(input_path)
            y_filtered = self.apply_high_pass_filter(y, sr)
            y_denoised = self.reduce_noise(y_filtered, sr)

            y_int16 = (y_denoised * 32767).astype(np.int16)
            audio_segment = AudioSegment(
                y_int16.tobytes(), 
                frame_rate=sr,
                sample_width=2, 
                channels=1
            )

            chunks = split_on_silence(
                audio_segment,
                min_silence_len=800,
                silence_thresh=-50,
                keep_silence=500
            )
            
            if len(chunks) == 0:
                processed_audio = audio_segment
            else:
                processed_audio = sum(chunks)

            final_audio = self.normalize_volume(processed_audio, target_dBFS=-20.0)

            filename, ext = os.path.splitext(input_path)
            output_path = f"{filename}_cleaned.wav"
            
            final_audio.export(output_path, format="wav", parameters=["-ac", "1"])
            logger.info(f"✓ Audio processing complete: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Error in processing pipeline: {e}")
            return None
    
    def process_from_mongodb(self, file_id=None, filename=None):
        """
        Process audio file fetched from MongoDB.
        
        Args:
            file_id: MongoDB ObjectId as string
            filename: Original filename to search for
            
        Returns:
            Path to processed audio file or None if failed
        """
        # Fetch file info from MongoDB
        file_info = self.get_file_from_mongodb(file_id=file_id, filename=filename)
        
        if not file_info:
            logger.error("Could not retrieve file information from MongoDB")
            return None
        
        file_address = file_info.get("fileAddress")
        
        if not file_address or not os.path.exists(file_address):
            logger.error(f"File does not exist at address: {file_address}")
            return None
        
        logger.info(f"📁 Processing file: {file_info['filename']}")
        logger.info(f"   Path: {file_address}")
        logger.info(f"   Size: {file_info['size']} bytes")
        
        # Process the audio file
        result = self.process_pipeline(file_address)
        
        return result
    
    def close_connection(self):
        """Close MongoDB connection"""
        if self.mongo_client:
            self.mongo_client.close()
            logger.info("MongoDB connection closed")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Audio Preprocessing with MongoDB Integration")
    parser.add_argument("--file-id", type=str, help="MongoDB file ID")
    parser.add_argument("--filename", type=str, help="Filename to search in MongoDB")
    parser.add_argument("--path", type=str, help="Direct file path (without MongoDB)")
    
    args = parser.parse_args()
    
    processor = AudioPreprocessor()
    
    try:
        if args.file_id or args.filename:
            # Process from MongoDB
            logger.info("=" * 70)
            logger.info("Audio Processing Pipeline - MongoDB Mode")
            logger.info("=" * 70)
            result = processor.process_from_mongodb(file_id=args.file_id, filename=args.filename)
        elif args.path:
            # Process from direct path
            logger.info("=" * 70)
            logger.info("Audio Processing Pipeline - Direct Path Mode")
            logger.info("=" * 70)
            if os.path.exists(args.path):
                result = processor.process_pipeline(args.path)
            else:
                logger.error(f"File not found: {args.path}")
                result = None
        else:
            # Default: try to process a demo file
            logger.info("No arguments provided. Use --file-id, --filename, or --path")
            logger.info("\nExamples:")
            logger.info("  python audioprocess.py --file-id 507f1f77bcf86cd799439011")
            logger.info("  python audioprocess.py --filename audio_file.mp3")
            logger.info("  python audioprocess.py --path ./files/audio.mp3")
            result = None
        
        if result:
            logger.info(f"\n{'=' * 70}")
            logger.info(f"✅ SUCCESS: Processed audio saved to:")
            logger.info(f"   {result}")
            logger.info(f"{'=' * 70}")
        else:
            logger.error("\n❌ Processing failed")
    
    finally:
        processor.close_connection()