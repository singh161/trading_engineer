import React, { useState, useEffect } from 'react';
import { aiStockAPI } from '../services/api';

function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [newAlert, setNewAlert] = useState({ symbol: '', type: 'price_above', value: '' });
    const [showForm, setShowForm] = useState(false);
    const [configStatus, setConfigStatus] = useState({ email_configured: false, telegram_configured: false });

    useEffect(() => {
        const savedAlerts = JSON.parse(localStorage.getItem('alerts') || '[]');
        setAlerts(savedAlerts);

        // Fetch config status
        const fetchConfig = async () => {
            try {
                const status = await aiStockAPI.getConfigStatus();
                setConfigStatus(status);
            } catch (err) {
                console.error('Failed to fetch config status', err);
            }
        };
        fetchConfig();
    }, []);

    const saveAlerts = (newAlerts) => {
        setAlerts(newAlerts);
        localStorage.setItem('alerts', JSON.stringify(newAlerts));
    };

    const addAlert = (e) => {
        e.preventDefault();
        if (!newAlert.symbol || !newAlert.value) return;

        const updatedAlerts = [...alerts, { ...newAlert, id: Date.now(), active: true, created: new Date().toISOString() }];
        saveAlerts(updatedAlerts);
        setNewAlert({ symbol: '', type: 'price_above', value: '' });
        setShowForm(false);
    };

    const deleteAlert = (id) => {
        const updatedAlerts = alerts.filter(a => a.id !== id);
        saveAlerts(updatedAlerts);
    };

    const toggleAlert = (id) => {
        const updatedAlerts = alerts.map(a =>
            a.id === id ? { ...a, active: !a.active } : a
        );
        saveAlerts(updatedAlerts);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-dark-text">Price & Sentiment Alerts</h2>
                    <p className="text-sm text-dark-text-secondary">Get notified when stocks hit your targets</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-accent hover:bg-blue-accent/90 text-white rounded-lg font-medium transition-all"
                >
                    {showForm ? 'Cancel' : '+ Create Alert'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={addAlert} className="bg-dark-card border border-dark-border p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-dark-text-secondary mb-1">Symbol</label>
                            <input
                                type="text"
                                placeholder="e.g. RELIANCE"
                                value={newAlert.symbol}
                                onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:border-blue-accent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-dark-text-secondary mb-1">Alert Type</label>
                            <select
                                value={newAlert.type}
                                onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
                                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:border-blue-accent"
                            >
                                <option value="price_above">Price Above (₹)</option>
                                <option value="price_below">Price Below (₹)</option>
                                <option value="verdict_is">Verdict Is</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-dark-text-secondary mb-1">Threshold Value</label>
                            {newAlert.type === 'verdict_is' ? (
                                <select
                                    value={newAlert.value}
                                    onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:border-blue-accent"
                                    required
                                >
                                    <option value="">Select Verdict</option>
                                    <option value="STRONG BUY">STRONG BUY</option>
                                    <option value="BUY">BUY</option>
                                    <option value="SELL">SELL</option>
                                    <option value="STRONG SELL">STRONG SELL</option>
                                </select>
                            ) : (
                                <input
                                    type="number"
                                    placeholder="Value"
                                    value={newAlert.value}
                                    onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:border-blue-accent"
                                    required
                                    step="0.05"
                                />
                            )}
                        </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-green-buy hover:bg-green-buy/90 text-white rounded-lg font-bold transition-all">
                        Save Alert
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 gap-4">
                {alerts.length === 0 ? (
                    <div className="text-center py-12 bg-dark-bg border border-dark-border border-dashed rounded-xl">
                        <p className="text-dark-text-secondary">No active alerts. Click "+ Create Alert" to start tracking.</p>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div key={alert.id} className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${alert.type.includes('price') ? 'bg-blue-accent/20 text-blue-accent' : 'bg-purple-500/20 text-purple-500'
                                    }`}>
                                    {alert.type === 'price_above' ? '↗️' : alert.type === 'price_below' ? '↘️' : '⚖️'}
                                </div>
                                <div>
                                    <div className="font-bold text-dark-text">{alert.symbol}</div>
                                    <div className="text-sm text-dark-text-secondary">
                                        {alert.type.replace('_', ' ')}: <span className="text-dark-text font-medium">{alert.value}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleAlert(alert.id)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${alert.active ? 'bg-green-buy/20 text-green-buy' : 'bg-dark-border text-dark-text-secondary'
                                        }`}
                                >
                                    {alert.active ? 'Active' : 'Paused'}
                                </button>
                                <button
                                    onClick={() => deleteAlert(alert.id)}
                                    className="p-2 text-dark-text-secondary hover:text-red-sell transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Alert Destinations */}
            <div className="mt-8 bg-blue-accent/5 border border-blue-accent/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-blue-accent mb-2 flex items-center gap-2">
                    <span>📱</span> Notification Channels
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📧</span>
                            <span className="text-sm text-dark-text">Email Notifications</span>
                        </div>
                        {configStatus.email_configured ? (
                            <span className="text-xs px-2 py-1 bg-green-buy/20 text-green-buy rounded">Active</span>
                        ) : (
                            <span className="text-xs px-2 py-1 bg-yellow-neutral/20 text-yellow-neutral rounded">Config Needed</span>
                        )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">✈️</span>
                            <span className="text-sm text-dark-text">Telegram Alerts</span>
                        </div>
                        {configStatus.telegram_configured ? (
                            <span className="text-xs px-2 py-1 bg-green-buy/20 text-green-buy rounded">Active</span>
                        ) : (
                            <span className="text-xs px-2 py-1 bg-yellow-neutral/20 text-yellow-neutral rounded">Config Needed</span>
                        )}
                    </div>
                </div>
                {!configStatus.email_configured && !configStatus.telegram_configured && (
                    <p className="text-xs text-dark-text-secondary mt-3 italic">
                        * Set SMTP and Telegram keys in the root .env file to enable automated alerts.
                    </p>
                )}
            </div>
        </div>
    );
}

export default Alerts;
