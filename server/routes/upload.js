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

export default router