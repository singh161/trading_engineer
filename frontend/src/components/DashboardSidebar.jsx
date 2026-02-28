import React, { useState } from 'react';
import {
    LayoutDashboard,
    TrendingUp,
    Newspaper,
    Target,
    AlertTriangle,
    BarChart3,
    Search,
    Settings,
    Mic,
    RefreshCw,
    Menu,
    X,
    Zap,
    List,
    CandlestickChart,
} from 'lucide-react';

/**
 * Modern Dashboard Sidebar Component
 * Clean, professional navigation with icons
 */
function DashboardSidebar({ activeTab, onTabChange, isMobileMenuOpen, setIsMobileMenuOpen }) {
    const menuItems = [
        { id: 'overview', icon: LayoutDashboard, label: 'Overview', badge: null },
        { id: 'trading', icon: CandlestickChart, label: 'Trading', badge: 'Live' },
        { id: 'stocks', icon: TrendingUp, label: 'Stocks', badge: null },
        { id: 'momentum', icon: Zap, label: 'Momentum', badge: 'New' },
        { id: 'indices', icon: List, label: 'Indices', badge: 'New' },
        { id: 'ai-research', icon: BarChart3, label: 'AI Research', badge: 'AI' },
        { id: 'news', icon: Newspaper, label: 'News', badge: null },
        { id: 'watchlist', icon: Target, label: 'Watchlist', badge: null },
        { id: 'alerts', icon: AlertTriangle, label: 'Alerts', badge: '3' },
    ];

    return (
        <>
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:sticky top-0 left-0 h-screen
        w-64 bg-dark-card border-r border-dark-border
        transform transition-transform duration-300 ease-in-out
        z-50 lg:z-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Logo/Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-dark-border">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-accent to-purple-500 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-dark-text">StockAI</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden text-dark-text-secondary hover:text-dark-text"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
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
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive
                                        ? 'bg-blue-accent text-white shadow-lg shadow-blue-accent/20'
                                        : 'text-dark-text-secondary hover:bg-dark-border hover:text-dark-text'
                                    }
                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="flex-1 text-left font-medium">{item.label}</span>
                                {item.badge && (
                                    <span className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold
                    ${isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-blue-accent/20 text-blue-accent'
                                        }
                  `}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-border">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-dark-text-secondary hover:bg-dark-border hover:text-dark-text transition-all">
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default DashboardSidebar;
