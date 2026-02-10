import React from 'react';
import { useNavigate } from 'react-router-dom';
import FinSense_Logo from '../assets/FinSense_Logo.png';
import DemoImage from '../assets/demoImage.png';

function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Abstract Blurred Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-1/4 w-96 h-96 bg-fuchsia-600/25 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-lime-500/15 rounded-full blur-3xl"></div>
      </div>
      
      {/* Header/Navbar */}
      <nav className="px-6 py-4 flex justify-between items-center border-b border-gray-800 relative z-10">
        <div className="flex items-center space-x-2">
          <img src={ FinSense_Logo } alt="FinSense AI Logo" className="w-10 h-10" />
          <span className="text-xl font-bold">FinSense AI</span>
        </div>
        <button 
          onClick={handleSignIn}
          className="px-6 py-2 bg-transparent border border-fuchsia-600 hover:bg-fuchsia-700 rounded-lg transition-colors duration-200"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight text-[#D1B0D5]">
            Transform Your Call Recordings into
            <span className="text-[#D1B0D5] hover:text-shadow-purple-400 hover:text-shadow-lg hover:text-fuchsia-600"> Actionable Insights</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Upload your audio recordings and let our AI-powered platform automatically transcribe and analyze your calls, extracting valuable data and insights.
          </p>

          <button 
            onClick={handleGetStarted}
            className="px-8 py-4 bg-transparent border border-fuchsia-600 hover:bg-fuchsia-700 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            Get Started
          </button>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-fuchsia-500 transition-colors duration-200">
            <h3 className="text-xl font-semibold mb-2">Audio Transcription</h3>
            <p className="text-gray-400">
              Advanced AI transcription that captures every word with high accuracy, supporting multiple languages and accents.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-fuchsia-500 transition-colors duration-200">
            <h3 className="text-xl font-semibold mb-2">Data Analytics</h3>
            <p className="text-gray-400">
              Extract meaningful patterns, sentiment analysis, and key metrics from your call recordings automatically.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-fuchsia-500 transition-colors duration-200">
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-400">
              Process hours of audio in minutes with our optimized AI pipeline, delivering results when you need them.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Area */}
      <div>
        <div className="container mx-auto px-6 py-20 max-w-7xl relative z-10">
          <h2 className="text-3xl font-bold mb-6 text-center">See It in Action</h2>
          <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 hover:border hover:border-fuchsia-700">
            <img src={ DemoImage } alt="Demo" className="w-full h-full object-cover rounded-lg" />
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
