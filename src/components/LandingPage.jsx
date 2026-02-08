import React from 'react';
import { useNavigate } from 'react-router-dom';
import FinSense_Logo from '../assets/FinSense_Logo.png';

function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-gray-900 to-gray-800 text-white">
      {/* Header/Navbar */}
      <nav className="px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <img src={ FinSense_Logo } alt="FinSense AI Logo" className="w-10 h-10" />
          <span className="text-xl font-bold">FinSense AI</span>
        </div>
        <button 
          onClick={handleSignIn}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Transform Your Call Recordings into
            <span className="text-blue-500"> Actionable Insights</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Upload your audio recordings and let our AI-powered platform automatically transcribe and analyze your calls, extracting valuable data and insights.
          </p>

          <button 
            onClick={handleGetStarted}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            Get Started
          </button>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors duration-200">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Audio Transcription</h3>
            <p className="text-gray-400">
              Advanced AI transcription that captures every word with high accuracy, supporting multiple languages and accents.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors duration-200">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Data Analytics</h3>
            <p className="text-gray-400">
              Extract meaningful patterns, sentiment analysis, and key metrics from your call recordings automatically.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors duration-200">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-400">
              Process hours of audio in minutes with our optimized AI pipeline, delivering results when you need them.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2026 FinSense AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
