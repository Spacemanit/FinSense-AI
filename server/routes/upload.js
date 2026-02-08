import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const router = express.Router()

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create files directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../files')
console.log('Upload directory:', uploadDir)
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
    console.log('Created upload directory')
} else {
    console.log('Upload directory already exists')
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + '-' + file.originalname)
    }
})

// File filter to only accept audio files
const fileFilter = (req, file, cb) => {
    // Allowed audio mime types
    const allowedMimes = [
        'audio/mpeg',        // .mp3
        'audio/wav',         // .wav
        'audio/wave',        // .wav
        'audio/x-wav',       // .wav
        'audio/mp4',         // .m4a
        'audio/x-m4a',       // .m4a
        'audio/ogg',         // .ogg
        'audio/webm',        // .webm
        'audio/flac',        // .flac
        'audio/aac',         // .aac
    ]

    // Check file extension as backup
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.flac', '.aac']
    const fileExtension = path.extname(file.originalname).toLowerCase()

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true)
    } else {
        cb(new Error('Only audio files are allowed! (MP3, WAV, M4A, OGG, WEBM, FLAC, AAC)'), false)
    }
}

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max file size
    }
})

router.post('/upload', upload.single('audio'), async (req, res) => {
    try {
        console.log('Upload request received')
        console.log('Request file:', req.file)
        console.log('Request body:', req.body)
        
        if (!req.file) {
            console.log('No file in request')
            return res.status(400).json({ message: 'No audio file uploaded' })
        }

        console.log('File uploaded successfully to:', req.file.path)
        
        // File successfully uploaded
        const fileInfo = {
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            uploadDate: new Date()
        }

        res.status(200).json({ 
            message: 'File uploaded successfully',
            file: fileInfo
        })
    } catch (error) {
        console.error('Upload error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Error handling middleware for multer
router.use((error, req, res, next) => {
    console.error('Multer error:', error)
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size is too large. Maximum size is 100MB.' })
        }
        return res.status(400).json({ message: error.message })
    }
    res.status(500).json({ message: error.message })
})

export default router