import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Zap, TrendingUp, History, Star, Layout, Activity, Newspaper, Bell, Heart, Settings, Play } from 'lucide-react';

/**
 * SpotlightSearch - Keyboard-first command palette
 * Usage: Ctrl + K to open
 */
function SpotlightSearch({ stocks, onStockClick, onClose, isOpen, onAction }) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const scrollRef = useRef(null);

    // Command Actions
    const actions = [
        { id: 'view-overview', label: 'Go to Overview', icon: Layout, type: 'action', command: '/overview', alias: 'dashboard' },
        { id: 'view-momentum', label: 'View Momentum Breakouts', icon: Activity, type: 'action', command: '/momentum', alias: 'breakout' },
        { id: 'view-news', label: 'Market Intelligence News', icon: Newspaper, type: 'action', command: '/news', alias: 'sentiment' },
        { id: 'view-watchlist', label: 'My Watchlist', icon: Heart, type: 'action', command: '/watchlist', alias: 'fav' },
        { id: 'view-alerts', label: 'Active Alerts', icon: Bell, type: 'action', command: '/alerts', alias: 'notification' },
        { id: 'view-research', label: 'AI Research Dashboard', icon: Zap, type: 'action', command: '/ai', alias: 'engine' },
        { id: 'view-tour', label: 'Start AI Guide Tour', icon: Zap, type: 'action', command: '/tour', alias: 'help' },
    ];

    // Filter logic
    const getResults = () => {
        const q = query.toLowerCase().trim();

        if (q === '') {
            return [
                { id: 'actions-header', label: 'Quick Navigation', icon: Command, type: 'header' },
                ...actions.slice(0, 3),
                { id: 'trending', label: 'Trending Stocks', icon: TrendingUp, type: 'header' },
                ...stocks.slice(0, 5).map(s => ({ ...s, type: 'stock' })),
            ];
        }

        const filteredActions = actions.filter(a =>
            a.command.includes(q) || a.label.toLowerCase().includes(q) || a.alias.includes(q)
        );

        const filteredStocks = stocks.filter(s =>
            s.symbol?.toLowerCase().includes(q) ||
            s.name?.toLowerCase().includes(q)
        ).slice(0, 8).map(s => ({ ...s, type: 'stock' }));

        const results = [];
        if (filteredActions.length > 0) {
            results.push({ id: 'actions-header', label: 'Commands', icon: Command, type: 'header' });
            results.push(...filteredActions);
        }
        if (filteredStocks.length > 0) {
            results.push({ id: 'stocks-header', label: 'Stocks', icon: TrendingUp, type: 'header' });
            results.push(...filteredStocks);
        }

        return results;
    };

    const results = getResults();
    const selectableItems = results.filter(r => r.type === 'stock' || r.type === 'action');

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(selectableItems.length - 1, prev + 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(0, prev - 1));
            } else if (e.key === 'Enter' && selectableItems[selectedIndex]) {
                const item = selectableItems[selectedIndex];
                if (item.type === 'stock') {
                    onStockClick(item.symbol);
                } else if (item.type === 'action') {
                    onAction && onAction(item.id.replace('view-', ''));
                }
                onClose();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, selectableItems, selectedIndex, onStockClick, onClose, onAction]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-start justify-center pt-[15vh] px-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" onClick={onClose} />

            {/* Search Box */}
            <div className="relative w-full max-w-2xl bg-dark-card/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden animate-in fade-in zoom-in duration-200 ring-1 ring-white/20">
                <div className="flex items-center px-6 py-5 border-b border-white/5">
                    <Search className="w-6 h-6 text-blue-accent mr-4" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none text-dark-text text-xl font-medium placeholder:text-dark-text-secondary/30"
                        placeholder="Type a command (/) or search stocks..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5 shadow-inner">
                            <span className="text-[10px] font-black text-dark-text-secondary uppercase">ESC</span>
                        </div>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="max-h-[65vh] overflow-y-auto p-3 custom-scrollbar"
                >
                    {results.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-dark-text-secondary/50" />
                            </div>
                            <p className="text-dark-text-secondary text-lg">No matching results found for <span className="text-white font-bold">"{query}"</span></p>
                            <p className="text-sm text-dark-text-secondary/50 mt-2">Try searching for a different symbol or command</p>
                        </div>
                    ) : (
                        results.map((item, idx) => {
                            if (item.type === 'header') {
                                const Icon = item.icon || Command;
                                return (
                                    <div key={item.id} className="px-4 py-3 mt-3 first:mt-0 flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-blue-accent/70" />
                                        <span className="text-[11px] uppercase tracking-[0.2em] font-black text-dark-text-secondary">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            }

                            const selectableIdx = results.slice(0, idx).filter(r => r.type === 'stock' || r.type === 'action').length;
                            const isActive = selectableIdx === selectedIndex;
                            const Icon = item.icon || Zap; // Fallback to avoid crash

                            return (
                                <div
                                    key={item.id || item.symbol}
                                    className={`
                                        group flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 mb-1
                                        ${isActive ? 'bg-blue-accent text-white shadow-lg scale-[1.01] ring-1 ring-white/30' : 'hover:bg-white/5 text-dark-text'}
                                    `}
                                    onClick={() => {
                                        if (item.type === 'stock') onStockClick(item.symbol);
                                        else if (item.type === 'action') onAction && onAction(item.id.replace('view-', ''));
                                        onClose();
                                    }}
                                    onMouseEnter={() => setSelectedIndex(selectableIdx)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg transition-transform duration-300
                                            ${isActive ? 'bg-white/20 rotate-3' : 'bg-dark-bg border border-white/5 text-blue-accent group-hover:scale-110'}
                                        `}>
                                            {item.type === 'action' ? <Icon className="w-5 h-5" /> : item.symbol?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-base">{item.type === 'action' ? item.label : item.symbol}</p>
                                                {item.type === 'action' && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-white/20' : 'bg-white/5 text-dark-text-secondary'}`}>
                                                        {item.command}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-xs mt-0.5 ${isActive ? 'text-white/70' : 'text-dark-text-secondary'}`}>
                                                {item.type === 'action' ? `Navigate to ${item.label.toLowerCase()}` : (item.name || 'Equity Stock')}
                                            </p>
                                        </div>
                                    </div>

                                    {isActive && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase bg-black/20 px-2 py-1 rounded tracking-widest">
                                                {item.type === 'action' ? 'Execute' : 'Open Analysis'}
                                            </span>
                                            <Zap className="w-5 h-5 text-white animate-pulse" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="px-6 py-4 bg-dark-bg/80 backdrop-blur-md border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[11px] text-dark-text-secondary transition-colors hover:text-white cursor-help group">
                            <span className="p-1 px-1.5 bg-white/5 rounded-md border border-white/5 border-b-2 group-hover:border-white/20">↑↓</span>
                            <span className="font-medium">Navigate</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-dark-text-secondary transition-colors hover:text-white cursor-help group">
                            <span className="p-1 px-1.5 bg-white/5 rounded-md border border-white/5 border-b-2 group-hover:border-white/20">ENTER</span>
                            <span className="font-medium">Select</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-dark-text-secondary transition-colors hover:text-white cursor-help group">
                            <span className="p-1 px-1.5 bg-white/5 rounded-md border border-white/5 border-b-2 group-hover:border-white/20">/</span>
                            <span className="font-medium">Commands</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Command className="w-3 h-3 text-blue-accent/40" />
                        <div className="text-[10px] font-bold text-blue-accent/40 uppercase tracking-[.25em]">
                            Trading Engineer AI
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SpotlightSearch;
