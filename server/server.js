import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/upload.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Connect to MongoDB before starting server
connectDB().then(() => {
    app.use('/api/auth', authRoutes)
    app.use('/file', uploadRoutes)

    // Start server
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`)
    })
}).catch((error) => {
    process.exit(1)
})
