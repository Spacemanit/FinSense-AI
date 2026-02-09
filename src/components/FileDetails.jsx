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
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading file details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500">Error: {error}</div>
            </div>
        );
    }

    if (!fileData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div>No file data found</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">File Details</h1>
            
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-b pb-3">
                        <p className="text-gray-600 text-sm">File ID</p>
                        <p className="font-semibold">{fileData.id || fileId}</p>
                    </div>
                    
                    <div className="border-b pb-3">
                        <p className="text-gray-600 text-sm">File Name</p>
                        <p className="font-semibold">{fileData.fileName || fileData.name}</p>
                    </div>
                    
                    <div className="border-b pb-3">
                        <p className="text-gray-600 text-sm">File Size</p>
                        <p className="font-semibold">{fileData.fileSize || fileData.size}</p>
                    </div>
                    
                    <div className="border-b pb-3">
                        <p className="text-gray-600 text-sm">Upload Date</p>
                        <p className="font-semibold">
                            {fileData.uploadDate ? new Date(fileData.uploadDate).toLocaleString() : 'N/A'}
                        </p>
                    </div>
                    
                    <div className="border-b pb-3">
                        <p className="text-gray-600 text-sm">File Type</p>
                        <p className="font-semibold">{fileData.fileType || fileData.type}</p>
                    </div>
                    
                    <div className="border-b pb-3">
                        <p className="text-gray-600 text-sm">Status</p>
                        <p className="font-semibold">{fileData.status || 'Processed'}</p>
                    </div>
                </div>
                
                {fileData.url && (
                    <div className="mt-6">
                        <a 
                            href={fileData.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded inline-block"
                        >
                            View File
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileDetails;