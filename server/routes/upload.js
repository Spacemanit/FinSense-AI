import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import FileInfo from '../models/FileInfo.js'

const router = express.Router()

router.get('/', (req, res) => {
    console.log('router working for /file');
})

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create files directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../files')

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now()
        const fileExtension = path.extname(file.originalname)
        const filename = timestamp + fileExtension
        cb(null, filename)
    }
})

// File filter to accept only audio files
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav',
        'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm',
        'audio/flac', 'audio/aac'
    ]
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.flac', '.aac']
    const fileExtension = path.extname(file.originalname).toLowerCase()

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true)
    } else {
        cb(new Error('Only audio files are allowed!'), false)
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max file size
    }
})

router.post('/upload', upload.single('audio'), async (req, res) => {
    try {
        
        if (!req.file) {
            console.log('No file in request')
            return res.status(400).json({ message: 'No audio file uploaded' })
        }

        const newFileInfo = new FileInfo({
            fileAddress: req.file.path,
            voiceID: null,
            keyDetails: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            },
            summary: null
        })

        const savedFile = await newFileInfo.save()

        res.status(200).json({
            message: 'File uploaded successfully',
            file: {
                id: savedFile._id,
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                uploadDate: savedFile.createdAt
            }
        })
    } catch (error) {
        console.error('=== Upload Error ===')
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        console.error('Error name:', error.name)
        
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Get all uploaded files
router.get('/files', async (req, res) => {
    try {
        const files = await FileInfo.find().sort({ createdAt: -1 })
        
        const formattedFiles = files.map(file => ({
            id: file._id,
            filename: file.keyDetails?.filename || 'Unknown',
            originalname: file.keyDetails?.originalname || 'Unknown',
            mimetype: file.keyDetails?.mimetype || 'audio/mpeg',
            size: file.keyDetails?.size || 0,
            path: file.fileAddress,
            uploadDate: file.createdAt,
            voiceID: file.voiceID,
            summary: file.summary
        }))

        res.status(200).json({
            message: 'Files retrieved successfully',
            files: formattedFiles,
            count: formattedFiles.length
        })
    } catch (error) {
        console.error('Error fetching files:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

router.delete('/files/delete/:id', async (req, res) => {
    try {
        const fileId = req.params.id
        const fileInfo = await FileInfo.findById(fileId)

        if (!fileInfo) {
            return res.status(404).json({ message: 'File not found' })
        }
        await FileInfo.findByIdAndDelete(fileId)

        fs.unlink(fileInfo.fileAddress, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error deleting file from filesystem', error: err.message })
            }
            res.status(200).json({ message: 'File deleted successfully' })
        })
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Get statistics endpoint - MUST BE BEFORE /files/:id route
router.get('/statistics', async (req, res) => {
    try {
        const allFiles = await FileInfo.find()
        
        // Calculate statistics
        const totalCalls = allFiles.length
        let totalDuration = 0
        let totalSize = 0
        let satisfiedCalls = 0
        let dissatisfiedCalls = 0
        let fraudsDetected = 0

        allFiles.forEach(file => {
            // Add size from keyDetails
            if (file.keyDetails?.size) {
                totalSize += file.keyDetails.size
            }

            // Get duration from keyDetails
            if (file.keyDetails?.duration) {
                totalDuration += file.keyDetails.duration
            }

            // Get satisfaction from keyDetails (satisfied, dissatisfied, neutral)
            if (file.keyDetails?.satisfaction) {
                const satisfaction = file.keyDetails.satisfaction.toLowerCase()
                if (satisfaction === 'satisfied' || satisfaction === 'positive' || satisfaction === 'yes') {
                    satisfiedCalls++
                } else if (satisfaction === 'dissatisfied' || satisfaction === 'negative' || satisfaction === 'no') {
                    dissatisfiedCalls++
                }
            }

            // Get fraud status from keyDetails
            if (file.keyDetails?.fraud) {
                const fraud = file.keyDetails.fraud.toString().toLowerCase()
                if (fraud === 'yes' || fraud === 'true' || fraud === '1') {
                    fraudsDetected++
                }
            }
        })

        const averageCallTime = totalCalls > 0 ? Math.floor(totalDuration / totalCalls) : 0

        res.status(200).json({
            message: 'Statistics retrieved successfully',
            statistics: {
                totalCalls,
                satisfiedCalls,
                dissatisfiedCalls,
                averageCallTime,
                fraudsDetected,
                totalDuration,
                totalSize
            }
        })
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

router.get('/files/:id', async (req, res) => {
    try {
        const fileId = req.params.id
        const fileInfo = await FileInfo.findById(fileId)

        if (!fileInfo) {
            return res.status(404).json({ message: 'File not found' })
        }

        res.status(200).json({
            message: 'File details retrieved successfully',
            file: {
                id: fileInfo._id,
                filename: fileInfo.keyDetails?.filename || 'Unknown',
                originalname: fileInfo.keyDetails?.originalname || 'Unknown',
                mimetype: fileInfo.keyDetails?.mimetype || 'audio/mpeg',
                size: fileInfo.keyDetails?.size || 0,
                path: fileInfo.fileAddress,
                uploadDate: fileInfo.createdAt,
                voiceID: fileInfo.voiceID,
                summary: fileInfo.summary
            }
        })
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

export default router



/*
key details:
    amount
    payment method
    payment date
    other data
*/