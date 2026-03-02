import React, { useState } from 'react';
import {
    LayoutDashboard,
    TrendingUp,
    Newspaper,
    Target,
    AlertTriangle,
    BarChart3,
    Settings,
    X,
    Zap,
    List,
    CandlestickChart,
    ChevronRight,
} from 'lucide-react';

function DashboardSidebar({ activeTab, onTabChange, isMobileMenuOpen, setIsMobileMenuOpen }) {
    const menuItems = [
        { id: 'overview', icon: LayoutDashboard, label: 'Market Pulse', badge: null },
        { id: 'trading', icon: CandlestickChart, label: 'Paper Trading', badge: 'LIVE' },
        { id: 'stocks', icon: TrendingUp, label: 'Equity Scanner', badge: null },
        { id: 'momentum', icon: Zap, label: 'Momentum Radar', badge: 'NEW' },
        { id: 'indices', icon: List, label: 'NSE Indices', badge: null },
        { id: 'ai-research', icon: BarChart3, label: 'AI Intelligence', badge: 'BETA' },
        { id: 'news', icon: Newspaper, label: 'Signal News', badge: null },
        { id: 'watchlist', icon: Target, label: 'My Watchlist', badge: null },
        { id: 'alerts', icon: AlertTriangle, label: 'Signal Alerts', badge: '3' },
    ];

    return (
        <>
            {/* Mobile Menu Overlay with Blur */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar with Glassmorphism */}
            <aside className={`
                fixed lg:sticky top-0 left-0 h-screen
                w-64 bg-[#0f172a] border-r border-white/5
                transform transition-all duration-300 ease-in-out
                z-50 lg:z-auto shadow-2xl
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo/Header */}
                <div className="h-20 flex items-center justify-between px-6 mb-4">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6 text-white" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f172a]"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-white tracking-tighter italic">STOCK<span className="text-blue-500 not-italic">AI</span></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest -mt-1">Pro Terminal</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden p-2 rounded-full bg-white/5 text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="px-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`
                                    relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                                    transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-blue-600/10 text-white shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]'
                                        : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                                    }
                                `}
                            >
                                {isActive && (
                                    <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                )}

                                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-blue-500' : 'group-hover:scale-110'}`} />
                                <span className="flex-1 text-left text-sm font-bold tracking-tight">{item.label}</span>

                                {item.badge && (
                                    <span className={`
                                        px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest
                                        ${isActive
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-400'
                                        }
                                    `}>
                                        {item.badge}
                                    </span>
                                )}

                                {!isActive && <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Section - Premium Settings Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <button className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-all group">
                        <div className="p-2 rounded-lg bg-white/5 group-hover:rotate-45 transition-transform">
                            <Settings className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">Settings</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default DashboardSidebar;
