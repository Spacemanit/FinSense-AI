import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT;

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Connect to MongoDB
connectDB()

// Routes
app.use('/api/auth', authRoutes)

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
