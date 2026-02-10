import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const FileDetails = () => {
    const { fileId } = useParams();
    const [fileData, setFileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFileDetails = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:5000/file/files/${fileId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setFileData(data.file);
                setError(null);
            } catch (err) {
                setError(err.message || 'Failed to fetch file details');
            } finally {
                setLoading(false);
            }
        };

        if (fileId) {
            fetchFileDetails();
        }
    }, [fileId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-lg">Loading file details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-red-500">Error: {error}</div>
            </div>
        );
    }

    if (!fileData) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div>No file data found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Abstract Blurred Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -left-20 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-3xl"></div>
                <div className="absolute top-40 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-32 left-1/4 w-96 h-96 bg-fuchsia-600/25 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-lime-500/15 rounded-full blur-3xl"></div>
            </div>
            
            <div className="container mx-auto p-6 max-w-4xl relative z-10">
                <h1 className="text-3xl font-bold mb-6">File Details</h1>
                
                <div className="bg-gray-800 shadow-md rounded-lg p-6 border border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border-b border-gray-700 pb-3">
                            <p className="text-gray-400 text-sm">File ID</p>
                            <p className="font-semibold">{fileData.id || fileId}</p>
                        </div>
                        
                        <div className="border-b border-gray-700 pb-3">
                            <p className="text-gray-400 text-sm">File Name</p>
                            <p className="font-semibold">{fileData.fileName || fileData.name}</p>
                        </div>
                        
                        <div className="border-b border-gray-700 pb-3">
                            <p className="text-gray-400 text-sm">File Size</p>
                            <p className="font-semibold">{fileData.fileSize || fileData.size}</p>
                        </div>
                        
                        <div className="border-b border-gray-700 pb-3">
                            <p className="text-gray-400 text-sm">Upload Date</p>
                            <p className="font-semibold">
                                {fileData.uploadDate ? new Date(fileData.uploadDate).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                        
                        <div className="border-b border-gray-700 pb-3">
                            <p className="text-gray-400 text-sm">File Type</p>
                            <p className="font-semibold">{fileData.fileType || fileData.type}</p>
                        </div>
                        
                        <div className="border-b border-gray-700 pb-3">
                            <p className="text-gray-400 text-sm">Status</p>
                            <p className="font-semibold">{fileData.status || 'Processed'}</p>
                        </div>
                    </div>
                    
                    {fileData.url && (
                        <div className="mt-6">
                            <a 
                                href={fileData.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-transparent border border-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2 rounded inline-block transition-colors duration-200"
                            >
                                View File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileDetails;