import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import FinSense_Logo from '../assets/FinSense_Logo.png';

function SignUp({ onSignup }) {
    const navigate = useNavigate()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: '',
        confirmPassword: '',
        termsAccepted: false,
    })

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (formData.fullname.trim() === '' || formData.email.trim() === '' || formData.password.trim() === '' || formData.confirmPassword.trim() === '') {
            setError('Please fill in all fields')
            return
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (!formData.termsAccepted) {
            setError('Please accept the terms and conditions')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName: formData.fullname,
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword
                })
            })

            const data = await response.json()

            if (response.ok) {
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.user))
                onSignup()
                navigate('/home')
            } else {
                setError(data.message || 'Signup failed')
            }
        } catch (err) {
            setError('Network error. Please check if the server is running.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-8 relative overflow-hidden">
            {/* Abstract Blurred Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -left-20 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-3xl"></div>
                <div className="absolute top-40 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-32 left-1/4 w-96 h-96 bg-fuchsia-600/25 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-lime-500/15 rounded-full blur-3xl"></div>
            </div>
            
            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3">
                        <img src={ FinSense_Logo } alt="FinSense AI Logo" className="w-10 h-10" />
                        <span className="text-2xl font-medium">FinSense AI</span>
                    </div>
                </div>

                {/* Sign Up Card */}
                <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                    <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                    <p className="text-gray-400 mb-8">Get started for free</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Full Name Field */}
                        <div>
                            <label htmlFor="fullname" className="block text-sm font-medium mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="fullname"
                                name="fullname"
                                value={formData.fullname}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500 transition"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500 transition"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500 transition"
                                placeholder="Create a password"
                                required
                            />
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500 transition"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        {/* Terms & Conditions */}
                        <div>
                            <label className="flex items-start">
                                <input 
                                    type="checkbox" 
                                    name="termsAccepted"
                                    checked={formData.termsAccepted}
                                    onChange={handleChange}
                                    className="mr-2 mt-1" 
                                />
                                <span className="text-sm text-gray-400">
                                    I agree to the{' '}
                                    <a href="#" className="text-fuchsia-500 hover:text-fuchsia-400">
                                        Terms & Conditions
                                    </a>
                                </span>
                            </label>
                        </div>

                        {/* Sign Up Button */}
                        <button
                            type="submit"
                            className="w-full bg-transparent border border-fuchsia-600 hover:bg-fuchsia-700 py-3 rounded-lg font-medium transition disabled:bg-gray-700 disabled:cursor-not-allowed"
                            disabled={!formData.termsAccepted || loading}
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-gray-400 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-fuchsia-500 hover:text-fuchsia-400">
                            Log in
                        </Link>
                    </p>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link to="/" className="text-gray-400 hover:text-white transition">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default SignUp
