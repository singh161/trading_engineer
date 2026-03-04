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
    ChevronLeft,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';

function DashboardSidebar({ activeTab, onTabChange, isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed, setIsCollapsed }) {
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
                bg-[#0f172a] border-r border-white/5
                transform transition-all duration-300 ease-in-out
                z-50 lg:z-auto shadow-2xl flex-shrink-0
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isCollapsed ? 'w-[72px]' : 'w-64'}
            `}>

                {/* Toggle Button - Sidebar ke right edge par */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`
                        hidden lg:flex
                        absolute -right-3.5 top-6
                        w-7 h-7 rounded-full
                        bg-[#1e293b] border border-white/10
                        items-center justify-center
                        text-slate-400 hover:text-blue-400
                        shadow-[0_0_14px_rgba(0,0,0,0.5)]
                        hover:border-blue-500/40 hover:shadow-[0_0_14px_rgba(59,130,246,0.25)]
                        transition-all duration-200 z-10
                        group
                    `}
                    title={isCollapsed ? 'Sidebar Expand karo' : 'Sidebar Collapse karo'}
                >
                    {isCollapsed
                        ? <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                        : <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                    }
                </button>

                {/* Logo/Header */}
                <div className={`h-20 flex items-center px-4 mb-4 ${isCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
                    <div className={`flex items-center gap-3 group cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="relative w-10 h-10 flex-shrink-0 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6 text-white" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f172a]"></div>
                        </div>
                        {/* Collapsed hone par logo text hide */}
                        <div className={`flex flex-col transition-all duration-200 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            <span className="text-xl font-black text-white tracking-tighter italic whitespace-nowrap">STOCK<span className="text-blue-500 not-italic">AI</span></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest -mt-1 whitespace-nowrap">Pro Terminal</span>
                        </div>
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`lg:hidden p-2 rounded-full bg-white/5 text-slate-400 hover:text-white ${isCollapsed ? 'hidden' : ''}`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className={`space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <div key={item.id} className="relative group/item">
                                <button
                                    onClick={() => {
                                        onTabChange(item.id);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`
                                        relative w-full flex items-center gap-3 py-3.5 rounded-xl
                                        transition-all duration-300 group
                                        ${isCollapsed ? 'justify-center px-2' : 'px-4'}
                                        ${isActive
                                            ? 'bg-blue-600/10 text-white shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]'
                                            : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                                        }
                                    `}
                                    title={isCollapsed ? item.label : ''}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                    )}

                                    <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-blue-500' : 'group-hover:scale-110'}`} />

                                    {/* Label - collapsed mein hide */}
                                    <span className={`text-left text-sm font-bold tracking-tight transition-all duration-200 overflow-hidden whitespace-nowrap
                                        ${isCollapsed ? 'w-0 opacity-0' : 'flex-1 opacity-100'}
                                    `}>
                                        {item.label}
                                    </span>

                                    {/* Badge - collapsed mein hide */}
                                    {item.badge && !isCollapsed && (
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

                                    {/* Chevron - expanded non-active mein */}
                                    {!isActive && !isCollapsed && (
                                        <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}

                                    {/* Collapsed badge dot */}
                                    {item.badge && isCollapsed && (
                                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    )}
                                </button>

                                {/* Collapsed Tooltip */}
                                {isCollapsed && (
                                    <div className="
                                        absolute left-full ml-3 top-1/2 -translate-y-1/2
                                        bg-[#1e293b] border border-white/10
                                        text-white text-xs font-bold px-3 py-2 rounded-xl
                                        shadow-[0_8px_24px_rgba(0,0,0,0.4)]
                                        opacity-0 group-hover/item:opacity-100
                                        pointer-events-none
                                        transition-all duration-200 translate-x-1 group-hover/item:translate-x-0
                                        whitespace-nowrap z-50
                                        flex items-center gap-2
                                    ">
                                        {item.label}
                                        {item.badge && (
                                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-black">{item.badge}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Section - Settings */}
                <div className={`absolute bottom-0 left-0 right-0 p-3 ${isCollapsed ? 'px-2' : 'p-4'}`}>
                    <div className="relative group/settings">
                        <button className={`
                            w-full flex items-center gap-3 rounded-2xl
                            bg-white/[0.02] border border-white/5
                            text-slate-400 hover:bg-white/[0.05] hover:text-slate-200
                            transition-all group
                            ${isCollapsed ? 'justify-center p-3' : 'px-4 py-4'}
                        `}>
                            <div className="p-2 rounded-lg bg-white/5 group-hover:rotate-45 transition-transform flex-shrink-0">
                                <Settings className="w-4 h-4" />
                            </div>
                            <span className={`text-sm font-bold tracking-tight transition-all duration-200 overflow-hidden whitespace-nowrap
                                ${isCollapsed ? 'w-0 opacity-0' : 'opacity-100'}
                            `}>
                                Settings
                            </span>
                        </button>

                        {/* Settings Tooltip when collapsed */}
                        {isCollapsed && (
                            <div className="
                                absolute left-full ml-3 bottom-0
                                bg-[#1e293b] border border-white/10
                                text-white text-xs font-bold px-3 py-2 rounded-xl
                                shadow-[0_8px_24px_rgba(0,0,0,0.4)]
                                opacity-0 group-hover/settings:opacity-100
                                pointer-events-none
                                transition-all duration-200
                                whitespace-nowrap z-50
                            ">
                                Settings
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}

export default DashboardSidebar;
