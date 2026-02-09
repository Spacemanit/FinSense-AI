import mongoose from 'mongoose'

const fileInfoSchema = new mongoose.Schema({
    fileAddress: {
        type: String,
        required: true,
        trim: true
    },
    voiceID: {
        type: String,
        required: false,
    },
    keyDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }, 
    summary: {
        type: String,
        required: false,
    }
}, {
    collection: 'fileinfos'  // Explicitly set collection name
})

const FileInfo = mongoose.model('FileInfo', fileInfoSchema)

export default FileInfo
