import express from 'express'
import User from '../models/User.js'
import bcrypt from 'bcryptjs';

const router = express.Router();

// Sign Up Route
router.post('/signup', async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword } = req.body

        // Validation
        if (!fullName || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        if (password !== confirmPassword) {
            console.log("Passwords do not match")
            return res.status(400).json({ message: 'Passwords do not match' })
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' })
        }

        // Create new user
        const user = new User({
            fullName,
            email,
            password: await bcrypt.hash(password, 8)
        })

        await user.save()

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email
            }
        })
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        // Find user
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        // Check password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email
            }
        })
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

export default router
