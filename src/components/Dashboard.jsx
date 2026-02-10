import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FinSense_Logo from '../assets/FinSense_Logo.png';
import TotalCallsIcon from '../assets/icons/phone.png';
import SatisfiedCallsIcon from '../assets/icons/thumb-up.png';
import DissatisfiedCallsIcon from '../assets/icons/thumb-down.png';
import AvgCallTimeIcon from '../assets/icons/time.png';
import FraudsDetectedIcon from '../assets/icons/warning.png';
import TotalDurationIcon from '../assets/icons/date.png';
import TotalStorageIcon from '../assets/icons/database.png';

function Dashboard({ onLogout }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalCalls: 0,
        satisfiedCalls: 0,
        dissatisfiedCalls: 0,
        averageCallTime: 0,
        fraudsDetected: 0,
        totalDuration: 0,
        totalSize: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/file/statistics');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setStats(data.statistics || stats);
            setError('');
        } catch (err) {
            console.error('Error fetching statistics:', err);
            setError('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    const formatTime = (seconds) => {
        if (!seconds) return '0m 0s';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}m ${secs}s`;
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 MB';
        const mb = (bytes / (1024 * 1024)).toFixed(2);
        return `${mb} MB`;
    };

    const StatCard = ({ icon, title, value, subtitle, color = 'fuchsia' }) => (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-fuchsia-500 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${color}-500/20 rounded-lg flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Abstract Blurred Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -left-20 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-3xl"></div>
                <div className="absolute top-40 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-32 left-1/4 w-96 h-96 bg-fuchsia-600/25 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-lime-500/15 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-purple-600/10 rounded-full blur-3xl"></div>
            </div>
            
            {/* Header */}
            <nav className="bg-black/50 backdrop-blur-sm border-b border-gray-700 px-6 py-4 relative z-10">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <img src={FinSense_Logo} alt="FinSense AI Logo" className="w-10 h-10" />
                            <span className="text-xl font-bold">FinSense AI</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/home')}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Home
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-4 py-2 text-fuchsia-500 font-semibold"
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleLogout}
                            className="px-6 py-2 bg-transparent border border-fuchsia-600 hover:bg-fuchsia-700 rounded-lg transition-colors duration-200"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-12 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
                        <p className="text-gray-400">
                            Real-time insights and statistics from your call recordings
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                <span className="animate-spin">⏳</span>
                                Loading analytics...
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Primary Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard
                                    icon={
                                        <img src={ TotalCallsIcon } alt="Total Calls" className="w-6 h-6 text-fuchsia-500" />
                                    }
                                    title="Total Calls"
                                    value={stats.totalCalls}
                                    subtitle="All recordings"
                                />

                                <StatCard
                                    icon={
                                        <img src={ SatisfiedCallsIcon } alt="Satisfied Calls" className="w-6 h-6 text-green-500" />
                                    }
                                    title="Satisfied Calls"
                                    value={stats.satisfiedCalls}
                                    subtitle={`${stats.totalCalls > 0 ? Math.round((stats.satisfiedCalls / stats.totalCalls) * 100) : 0}% satisfaction rate`}
                                    
                                />

                                <StatCard
                                    icon={
                                        <img src={ DissatisfiedCallsIcon } alt="Dissatisfied Calls" className="w-6 h-6 text-red-500" />
                                    }
                                    title="Dissatisfied Calls"
                                    value={stats.dissatisfiedCalls}
                                    subtitle={`${stats.totalCalls > 0 ? Math.round((stats.dissatisfiedCalls / stats.totalCalls) * 100) : 0}% dissatisfaction rate`}
                                />

                                <StatCard
                                    icon={
                                        <img src={ AvgCallTimeIcon } alt="Avg Call Time" className="w-6 h-6 text-purple-500" />
                                    }
                                    title="Avg Call Time"
                                    value={formatTime(stats.averageCallTime)}
                                    subtitle="Per recording"
                                />
                            </div>

                            {/* Secondary Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <StatCard
                                    icon={
                                        <img src={ FraudsDetectedIcon } alt="Frauds Detected" className="w-6 h-6 text-yellow-500" />
                                    }
                                    title="Frauds Detected"
                                    value={stats.fraudsDetected}
                                    subtitle="Potential fraud cases"
                                />

                                <StatCard
                                    icon={
                                        <img src={ TotalDurationIcon } alt="Total Duration" className="w-6 h-6 text-cyan-500" />
                                    }
                                    title="Total Duration"
                                    value={formatTime(stats.totalDuration)}
                                    subtitle="All recordings combined"
                                />

                                <StatCard
                                    icon={
                                        <img src={ TotalStorageIcon } alt="Total Storage" className="w-6 h-6 text-lime-500" />
                                    }
                                    title="Total Storage"
                                    value={formatSize(stats.totalSize)}
                                    subtitle="Database size"
                                />
                            </div>

                            {/* Summary Card */}
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
                                <h2 className="text-2xl font-bold mb-6">Quick Insights</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-fuchsia-500 mb-3">Satisfaction Overview</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Satisfied</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-32 bg-gray-700 rounded-full h-2">
                                                        <div 
                                                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                                            style={{ width: `${stats.totalCalls > 0 ? (stats.satisfiedCalls / stats.totalCalls) * 100 : 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-white font-semibold w-12 text-right">
                                                        {stats.totalCalls > 0 ? Math.round((stats.satisfiedCalls / stats.totalCalls) * 100) : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Dissatisfied</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-32 bg-gray-700 rounded-full h-2">
                                                        <div 
                                                            className="bg-red-500 h-2 rounded-full transition-all duration-500"
                                                            style={{ width: `${stats.totalCalls > 0 ? (stats.dissatisfiedCalls / stats.totalCalls) * 100 : 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-white font-semibold w-12 text-right">
                                                        {stats.totalCalls > 0 ? Math.round((stats.dissatisfiedCalls / stats.totalCalls) * 100) : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-fuchsia-500 mb-3">Security Alerts</h3>
                                        <div className="space-y-2">
                                            <p className="text-gray-400">
                                                {stats.fraudsDetected === 0 
                                                    ? "✓ No fraudulent activity detected" 
                                                    : `⚠️ ${stats.fraudsDetected} potential fraud case${stats.fraudsDetected > 1 ? 's' : ''} detected`}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Last updated: {new Date().toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
