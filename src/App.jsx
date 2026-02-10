import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import LandingPage from './components/LandingPage'
import HomePage from './components/HomePage'
import Login from './components/Login'
import SignUp from './components/SignUp'
import FileDetails from './components/FileDetails'
import Dashboard from './components/Dashboard'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/signup" element={<SignUp onSignup={handleLogin} />} />
      <Route 
        path="/home" 
        element={
          isLoggedIn ? (
            <HomePage onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          isLoggedIn ? (
            <Dashboard onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/file/:fileId" 
        element={
          isLoggedIn ? (
            <FileDetails onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  )
}

export default App
