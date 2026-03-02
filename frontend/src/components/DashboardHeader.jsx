import React from 'react';
import { Search, Bell, User, Menu, Mic, RefreshCw, Volume2, VolumeX, Sparkles } from 'lucide-react';

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
        <header className="h-20 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30 px-6">
            <div className="h-full flex items-center justify-between gap-6">
                {/* Left: Search with K Shortcut */}
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all border border-white/5"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="relative flex-1 max-w-lg group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Find stocks, indices or signals..."
                            className="
                                w-full pl-11 pr-14 py-3
                                bg-white/5 border border-white/5 rounded-2xl
                                text-slate-100 placeholder-slate-500 font-medium
                                focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/[0.08]
                                transition-all duration-300 shadow-inner
                            "
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 border border-white/10 bg-white/5 px-2 py-1 rounded-lg">
                            <span className="text-[10px] font-black text-slate-500">Ctrl K</span>
                        </div>
                    </div>
                </div>

                {/* Right: Premium Actions */}
                <div className="flex items-center gap-3">
                    {/* Data Status */}
                    <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5 shadow-inner group/status cursor-help">
                        <div className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sseConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${sseConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        </div>
                        <div className="flex flex-col items-start leading-none min-w-[70px]">
                            <span className="text-[9px] font-black text-slate-100 uppercase tracking-widest">
                                {sseConnected ? 'Live Pulse' : 'Standby'}
                            </span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                                {new Date().getHours() >= 9 && new Date().getHours() < 16 ? 'Market Open' : 'Market Closed'}
                            </span>
                        </div>
                        {/* Hinglish Help Prompt */}
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('start-guide-tour'))}
                            className="ml-2 p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all border border-blue-500/20"
                            title="Help Chahiye?"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="h-8 w-px bg-white/5 hidden sm:block mx-1"></div>

                    {/* Action Group */}
                    <div className="flex items-center gap-1.5 p-1.5 bg-white/5 border border-white/5 rounded-2xl">
                        {/* Voice Alerts */}
                        <button
                            onClick={onVoiceToggle}
                            className={`p-2 rounded-xl transition-all duration-300 ${voiceEnabled ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                            title={voiceEnabled ? "Voice Enabled" : "Voice Silent"}
                        >
                            {voiceEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
                        </button>

                        {/* Mic */}
                        <button
                            onClick={onVoiceClick}
                            className="p-2 rounded-xl text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300 group"
                            title="Voice AI"
                        >
                            <Mic className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                        </button>

                        {/* Refresh */}
                        <button
                            onClick={onRefreshClick}
                            disabled={analyzing}
                            className={`p-2 rounded-xl transition-all duration-300 ${analyzing ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                            title="Force Analysis"
                        >
                            <RefreshCw className={`w-4.5 h-4.5 ${analyzing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Profile & Notifications */}
                    <div className="flex items-center gap-3 ml-2">
                        <button className="relative p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all border border-white/5 group">
                            <Bell className="w-5 h-5 group-hover:shake" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0f172a]" />
                        </button>

                        <button className="group flex items-center gap-3 pl-1 pr-3 py-1.5 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all shadow-inner">
                            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center p-0.5 shadow-lg group-hover:rotate-3 transition-transform">
                                <div className="w-full h-full bg-[#0f172a] rounded-[10px] flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-500" />
                                </div>
                            </div>
                            <div className="hidden lg:flex flex-col items-start leading-none">
                                <span className="text-[11px] font-black text-white">PRO ADMIN</span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Verified</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default DashboardHeader;
