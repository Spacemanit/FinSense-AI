import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FinSense_Logo from '../assets/FinSense_Logo.png';

function HomePage({ onLogout }) {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file type
            const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm', 'audio/flac', 'audio/aac'];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const allowedExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac'];

            if (!audioTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
                setError('Please select a valid audio file (MP3, WAV, M4A, OGG, WEBM, FLAC, AAC)');
                return;
            }

            // Validate file size (100MB max)
            if (file.size > 100 * 1024 * 1024) {
                setError('File size must be less than 100MB');
                return;
            }

            setError('');
            setUploadSuccess(false);
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setError('');
        setUploadSuccess(false);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('audio', selectedFile);

        try {
            const response = await fetch('http://localhost:5000/file/upload', {
                method: 'POST',
                body: formData
            })

            const data = await response.json();
            if (response.ok) {
                setUploadSuccess(true);
                setSelectedFile(null);
            } else {
                setError(data.message || 'Failed to upload file. Please try again.');
            }
            setIsUploading(false);

        } catch (err) {
            setIsUploading(false);
            setError('Failed to upload file. Please try again.');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <img src={FinSense_Logo} alt="FinSense AI Logo" className="w-5 h-5" />
                        <span className="text-xl font-bold">FinSense AI</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button className="text-gray-300 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-2">Upload Recording</h1>
                    <p className="text-gray-400 mb-8">
                        Upload your audio recording to get started with transcription and analysis
                    </p>

                    {/* Upload Area */}
                    <div className="mb-8">
                        <div
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 border-gray-700 bg-gray-800/50`}
                        >
                            <div className="flex flex-col items-center space-y-4">
                                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>

                                <div>
                                    <p className="text-lg mb-2">
                                        Drag and drop your audio file here
                                    </p>
                                    <p className="text-gray-400 text-sm">or</p>
                                </div>

                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <span className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg inline-block transition-colors duration-200">
                                        Browse Files
                                    </span>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        accept="audio/*"
                                        onChange={handleFileChange}
                                    />
                                </label>

                                <p className="text-sm text-gray-500">
                                    Supported formats: MP3, WAV, M4A, OGG (Max 100MB)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {uploadSuccess && (
                        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-6">
                            ✓ File uploaded successfully! Ready for transcription.
                        </div>
                    )}

                    {/* Selected File Info */}
                    {selectedFile && (
                        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setError('');
                                        setUploadSuccess(false);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={isUploading || uploadSuccess}
                                className={`w-full py-3 rounded-lg font-semibold transition-colors duration-200 ${isUploading || uploadSuccess
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {uploadSuccess ? '✓ Uploaded Successfully' : isUploading ? (
                                    <span className="flex items-center justify-center gap-1">
                                        Uploading
                                        <span className="flex gap-1">
                                            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                                            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                                            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                                        </span>
                                    </span>
                                ) : 'Upload & Process'}
                            </button>
                        </div>
                    )}

                    {/* Recent Uploads Section */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6">Recent Uploads</h2>
                        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 text-center">
                            <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-gray-400">No recordings uploaded yet</p>
                            <p className="text-sm text-gray-500 mt-2">Your uploaded recordings will appear here</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
