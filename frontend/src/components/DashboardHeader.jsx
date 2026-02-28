import React from 'react';
import { Search, Bell, User, Menu, Mic, RefreshCw, Volume2, VolumeX } from 'lucide-react';

/**
 * Modern Dashboard Header
 * Clean top bar with search, notifications, and user menu
 */
function DashboardHeader({
    searchTerm,
    onSearchChange,
    onMenuClick,
    onVoiceClick,
    onRefreshClick,
    analyzing,
    sseConnected,
    lastUpdateTime,
    voiceEnabled,
    onVoiceToggle
}) {
    return (
        <header className="h-16 bg-dark-card border-b border-dark-border sticky top-0 z-30">
            <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
                {/* Left: Mobile Menu + Search */}
                <div className="flex items-center gap-4 flex-1">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-lg text-dark-text-secondary hover:bg-dark-border hover:text-dark-text transition-all"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-secondary" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search stocks or press Ctrl+K..."
                            className="
                w-full pl-10 pr-4 py-2 
                bg-dark-bg border border-dark-border rounded-lg
                text-dark-text placeholder-dark-text-secondary
                focus:outline-none focus:ring-2 focus:ring-blue-accent/50 focus:border-blue-accent
                transition-all
              "
                        />
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Status Indicators */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-bg border border-dark-border">
                        <div className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-green-buy animate-pulse' : 'bg-red-sell'}`} />
                        <span className="text-xs text-dark-text-secondary">
                            {sseConnected ? 'Live' : 'Offline'}
                        </span>
                    </div>

                    {/* Last Update Time */}
                    {lastUpdateTime && (
                        <div className="hidden lg:block text-xs text-dark-text-secondary px-3 py-1.5 rounded-lg bg-dark-bg border border-dark-border">
                            {lastUpdateTime.toLocaleTimeString()}
                        </div>
                    )}

                    {/* Voice Alerts Toggle */}
                    <button
                        onClick={onVoiceToggle}
                        className={`p-2 rounded-lg transition-all ${voiceEnabled ? 'text-blue-accent hover:bg-blue-accent/10' : 'text-dark-text-secondary hover:bg-dark-border'}`}
                        title={voiceEnabled ? "Disable Voice Alerts" : "Enable Voice Alerts"}
                    >
                        {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>

                    {/* Voice Command Button */}
                    <button
                        onClick={onVoiceClick}
                        className="p-2 rounded-lg text-dark-text-secondary hover:bg-blue-accent/10 hover:text-blue-accent transition-all"
                        title="Voice Command"
                    >
                        <Mic className="w-5 h-5" />
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={onRefreshClick}
                        disabled={analyzing}
                        className="p-2 rounded-lg text-dark-text-secondary hover:bg-green-buy/10 hover:text-green-buy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 ${analyzing ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg text-dark-text-secondary hover:bg-dark-border hover:text-dark-text transition-all">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-sell rounded-full" />
                    </button>

                    {/* User Menu */}
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-dark-text-secondary hover:bg-dark-border hover:text-dark-text transition-all">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-accent to-purple-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="hidden md:block text-sm font-medium text-dark-text">Admin</span>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default DashboardHeader;
