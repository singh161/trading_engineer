import React, { useState, useEffect } from 'react';
import axios from 'axios';

// All the indices options from the provided list
const INDICES_LIST = [
    ["NIFTY 50", "NIFTY 50"],
    ["NIFTY BANK", "NIFTY BANK"],
    ["NIFTY COMMODITIES", "NIFTY COMMODITIES"],
    ["NIFTY CONSUMPTION", "NIFTY INDIA CONSUMPTION"],
    ["NIFTY DIV OPPS 50", "NIFTY DIVIDEND OPPORTUNITIES 50"],
    ["NIFTY ENERGY", "NIFTY ENERGY"],
    ["NIFTY FIN SERVICE", "NIFTY FINANCIAL SERVICES"],
    ["NIFTY FMCG", "NIFTY FMCG"],
    ["NIFTY GROWSECT 15", "NIFTY GROWTH SECTORS 15"],
    ["NIFTY INFRA", "NIFTY INFRASTRUCTURE"],
    ["NIFTY IT", "NIFTY IT"],
    ["NIFTY MEDIA", "NIFTY MEDIA"],
    ["NIFTY METAL", "NIFTY METAL"],
    ["NIFTY MIDCAP 100", "NIFTY MIDCAP 100"],
    ["NIFTY MIDCAP 150", "NIFTY MIDCAP 150"],
    ["NIFTY MID LIQ 15", "NIFTY MIDCAP LIQUID 15"],
    ["NIFTY MIDSML 400", "NIFTY MIDSMALLCAP 400"],
    ["NIFTY M150 QLTY50", "NIFTY MIDCAP150 QUALITY 50"],
    ["NIFTY INDIA MFG", "NIFTY INDIA MANUFACTURING"],
    ["NIFTY200 ALPHA 30", "NIFTY200 ALPHA 30"],
    ["NIFTYM150MOMNTM50", "NIFTY MIDCAP150 MOMENTUM 50"],
    ["NIFTY MIDSML HLTH", "NIFTY MIDSMALL HEALTHCARE"],
    ["NIFTY MULTI MFG", "NIFTY500 MULTICAP INDIA MANUFACTURING 50:30:20"],
    ["NIFTY TATA 25 CAP", "NIFTY INDIA CORPORATE GROUP INDEX - TATA GROUP 25% CAP"],
    ["NIFTY IND DEFENCE", "NIFTY INDIA DEFENCE"],
    ["NIFTY IND TOURISM", "NIFTY INDIA TOURISM"],
    ["NIFTY CAPITAL MKT", "NIFTY CAPITAL MARKETS"],
    ["NIFTY500MOMENTM50", "NIFTY500 MOMENTUM 50"],
    ["NIFTYMS400 MQ 100", "NIFTY MIDSMALLCAP400 MOMENTUM QUALITY 100"],
    ["NIFTYSML250MQ 100", "NIFTY SMALLCAP250 MOMENTUM QUALITY 100"],
    ["BHARATBOND-APR25", "NIFTY BHARAT BOND INDEX - APRIL 2025"],
    ["BHARATBOND-APR30", "NIFTY BHARAT BOND INDEX - APRIL 2030"],
    ["BHARATBOND-APR32", "NIFTY BHARAT BOND INDEX - APRIL 2032"],
    ["BHARATBOND-APR33", "NIFTY BHARAT BOND INDEX - APRIL 2033"],
    ["NIFTY AQLV 30", "NIFTY ALPHA QUALITY VALUE LOW-VOLATILITY 30"],
    ["NIFTY 100", "NIFTY 100"],
    ["NIFTY 200", "NIFTY 200"],
    ["NIFTY 500", "NIFTY 500"],
    ["NIFTY ALPHA 50", "NIFTY ALPHA 50"],
    ["NIFTY AUTO", "NIFTY AUTO"],
    ["NIFTY CPSE", "NIFTY CPSE"],
    ["NIFTY MIDCAP 50", "NIFTY MIDCAP 50"],
    ["NIFTY SMLCAP 250", "NIFTY SMALLCAP 250"],
    ["NIFTY50 PR 1X INV", "NIFTY50 PR 1X INVERSE"],
    ["NIFTY GS 10YR", "NIFTY 10 YR BENCHMARK G-SEC"],
    ["NIFTY GS 11 15YR", "NIFTY 11-15 YR G-SEC INDEX"],
    ["NIFTY GS 4 8YR", "NIFTY 4-8 YR G-SEC INDEX"],
    ["INDIA VIX", "INDIA VIX"],
    ["NIFTY LARGEMID250", "NIFTY LARGEMIDCAP 250"],
    ["NIFTY MULTI INFRA", "NIFTY500 MULTICAP INFRASTRUCTURE 50:30:20"],
    ["NIFTY TOP 10 EW", "NIFTY TOP 10 EQUAL WEIGHT"],
    ["BHARATBOND-APR31", "NIFTY BHARAT BOND INDEX - APRIL 2031"],
    ["NIFTY AQL 30", "NIFTY ALPHA QUALITY LOW-VOLATILITY 30"],
    ["NIFTY SML250 Q50", "NIFTY SMALLCAP250 QUALITY 50"],
    ["NIFTY COREHOUSING", "NIFTY CORE HOUSING"],
    ["NIFTY MS IND CONS", "NIFTY MIDSMALL INDIA CONSUMPTION"],
    ["NIFTY TRANS LOGIS", "NIFTY TRANSPORTATION & LOGISTICS"],
    ["Nifty India Corporate Group Index - Mahindra Group", "NIFTY INDIA CORPORATE GROUP INDEX - MAHINDRA GROUP"],
    ["Nifty REITs & InvITs", "NIFTY REITS & INVITS"],
    ["Nifty 50 Futures Index", "NIFTY 50 FUTURES INDEX"],
    ["Nifty 1D Rate Index", "NIFTY 1D RATE INDEX"],
    ["Nifty50 USD", "NIFTY50 USD"],
    ["NIFTY500 QLTY50", "NIFTY500 QUALITY 50"],
    ["NIFTY500 LOWVOL50", "NIFTY500 LOW VOLATILITY 50"],
    ["NIFTY MNC", "NIFTY MNC"],
    ["NIFTY NEXT 50", "NIFTY NEXT 50"],
    ["NIFTY PHARMA", "NIFTY PHARMA"],
    ["NIFTY PSE", "NIFTY PSE"],
    ["NIFTY PSU BANK", "NIFTY PSU BANK"],
    ["NIFTY PVT BANK", "NIFTY PRIVATE BANK"],
    ["NIFTY REALTY", "NIFTY REALTY"],
    ["NIFTY SERV SECTOR", "NIFTY SERVICES SECTOR"],
    ["NIFTY SMLCAP 100", "NIFTY SMALLCAP 100"],
    ["NIFTY SMLCAP 50", "NIFTY SMALLCAP 50"],
    ["NIFTY100 EQL WGT", "NIFTY100 EQUAL WEIGHT"],
    ["NIFTY100 LIQ 15", "NIFTY100 LIQUID 15"],
    ["NIFTY100 LOWVOL30", "NIFTY100 LOW VOLATILITY 30"],
    ["NIFTY100 QUALTY30", "NIFTY100 QUALITY 30"],
    ["NIFTY200 QUALTY30", "NIFTY200 QUALITY 30"],
    ["NIFTY50 EQL WGT", "NIFTY50 EQUAL WEIGHT"],
    ["NIFTY50 PR 2X LEV", "NIFTY50 PR 2X LEVERAGE"],
    ["NIFTY50 TR 1X INV", "NIFTY50 TR 1X INVERSE"],
    ["NIFTY50 TR 2X LEV", "NIFTY50 TR 2X LEVERAGE"],
    ["NIFTY50 VALUE 20", "NIFTY50 VALUE 20"],
    ["NIFTY50 DIV POINT", "NIFTY50 DIVIDEND POINTS"],
    ["NIFTY GS 10YR CLN", "NIFTY 10 YR BENCHMARK G-SEC (CLEAN PRICE)"],
    ["NIFTY GS 15YRPLUS", "NIFTY 15 YR AND ABOVE G-SEC INDEX"],
    ["NIFTY GS 8 13YR", "NIFTY 8-13 YR G-SEC"],
    ["NIFTY GS COMPSITE", "NIFTY COMPOSITE G-SEC INDEX"],
    ["NIFTY ALPHALOWVOL", "NIFTY ALPHA LOW-VOLATILITY 30"],
    ["NIFTY FINSRV25 50", "NIFTY FINANCIAL SERVICES 25/50"],
    ["NIFTY200MOMENTM30", "NIFTY200 MOMENTUM 30"],
    ["NIFTY100ESGSECLDR", "NIFTY100 ESG SECTOR LEADERS"],
    ["NIFTY CONSR DURBL", "NIFTY CONSUMER DURABLES"],
    ["NIFTY OIL AND GAS", "NIFTY OIL & GAS"],
    ["NIFTY HEALTHCARE", "NIFTY HEALTHCARE INDEX"],
    ["NIFTY500 MULTICAP", "NIFTY500 MULTICAP 50:25:25"],
    ["NIFTY MID SELECT", "NIFTY MIDCAP SELECT"],
    ["NIFTY TOTAL MKT", "NIFTY TOTAL MARKET"],
    ["NIFTY MICROCAP250", "NIFTY MICROCAP 250"],
    ["NIFTY IND DIGITAL", "NIFTY INDIA DIGITAL"],
    ["NIFTY100 ESG", "NIFTY100 ESG"],
    ["NIFTY EV", "NIFTY EV & NEW AGE AUTOMOTIVE"],
    ["NIFTY HIGHBETA 50", "NIFTY HIGH BETA 50"],
    ["NIFTY NEW CONSUMP", "NIFTY INDIA NEW AGE CONSUMPTION"],
    ["NIFTY CORP MAATR", "NIFTY INDIA SELECT 5 CORPORATE GROUPS (MAATR)"],
    ["NIFTY LOW VOL 50", "NIFTY LOW VOLATILITY 50"],
    ["NIFTY MOBILITY", "NIFTY MOBILITY"],
    ["NIFTY QLTY LV 30", "NIFTY QUALITY LOW-VOLATILITY 30"],
    ["NIFTY TOP 15 EW", "NIFTY TOP 15 EQUAL WEIGHT"],
    ["NIFTY100 ALPHA 30", "NIFTY100 ALPHA 30"],
    ["NIFTY100 ENH ESG", "NIFTY100 ENHANCED ESG"],
    ["NIFTY200 VALUE 30", "NIFTY200 VALUE 30"],
    ["NIFTY500 EW", "NIFTY500 EQUAL WEIGHT"],
    ["NIFTY MULTI MQ 50", "NIFTY500 MULTICAP MOMENTUM QUALITY 50"],
    ["NIFTY500 VALUE 50", "NIFTY500 VALUE 50"],
    ["NIFTY TOP 20 EW", "NIFTY TOP 20 EQUAL WEIGHT"],
    ["NIFTY FINSEREXBNK", "NIFTY FINANCIAL SERVICES EX-BANK"],
    ["NIFTY HOUSING", "NIFTY HOUSING"],
    ["NIFTY IPO", "NIFTY IPO"],
    ["NIFTY MS FIN SERV", "NIFTY MIDSMALL FINANCIAL SERVICES"],
    ["NIFTY MS IT TELCM", "NIFTY MIDSMALL IT & TELECOM"],
    ["NIFTY NONCYC CONS", "NIFTY NON-CYCLICAL CONSUMER"],
    ["NIFTY RURAL", "NIFTY RURAL"],
    ["NIFTY SHARIAH 25", "NIFTY SHARIAH 25"],
    ["NIFTY50 SHARIAH", "NIFTY50 SHARIAH"],
    ["NIFTY500 LMS EQL", "NIFTY500 LARGEMIDSMALL EQUAL-CAP WEIGHTED"],
    ["NIFTY500 SHARIAH", "NIFTY500 SHARIAH"],
    ["Nifty India Corporate Group Index - Aditya Birla Group", "NIFTY INDIA CORPORATE GROUP INDEX - ADITYA BIRLA GROUP"],
    ["Nifty India Corporate Group Index - Tata Group", "NIFTY INDIA CORPORATE GROUP INDEX - TATA GROUP"],
    ["NIFTY INTERNET", "NIFTY INDIA INTERNET"],
    ["Nifty 50 Arbitrage", "NIFTY 50 ARBITRAGE"],
    ["Nifty 50 Futures TR Index", "NIFTY 50 FUTURES TR INDEX"],
    ["NIFTY500 MQVLV50", "NIFTY500 MULTIFACTOR MQVLV 50"],
    ["Securities in F&O", "SECURITIES IN F&O"],
    ["Permitted to Trade", "PERMITTED TO TRADE"],
    ["NIFTY SME EMERGE", "NIFTY SME EMERGE"],
    ["NIFTY FPI 150", "NIFTY INDIA FPI 150"],
    ["NIFTY500 FLEXICAP", "NIFTY500 FLEXICAP QUALITY 30"],
    ["NIFTY TMMQ 50", "NIFTY TOTAL MARKET MOMENTUM QUALITY 50"],
    ["NIFTY CHEMICALS", "NIFTY CHEMICALS"],
    ["NIFTY WAVES", "NIFTY WAVES"],
    ["NIFTY INFRALOG", "NIFTY INDIA INFRASTRUCTURE & LOGISTICS"],
    ["NIFTY500 HEALTH", "NIFTY500 HEALTHCARE"],
    ["NIFTY RAILWAYSPSU", "NIFTY INDIA RAILWAYS PSU"],
    ["NIFTYCONGLOMERATE", "NIFTY CONGLOMERATE 50"]
];

const NSEIndicesMenu = () => {
    const [selectedIndex, setSelectedIndex] = useState("NIFTY COMMODITIES");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchIndexData = async () => {
            setLoading(true);
            setError(null);
            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const url = `${API_BASE_URL}/market-index-constituents?index=${encodeURIComponent(selectedIndex)}`;

                // We hit our own FAST API proxy Route to bypass CORS
                const response = await axios.get(url);
                setData(response.data);
            } catch (err) {
                console.error("API fetching error:", err);
                // If it fails due to CORS, provide a meaningful message
                setError("Could not fetch data. This is typically due to NSE CORS protection or rate limits. Try setting up a local proxy.");
            } finally {
                setLoading(false);
            }
        };

        if (selectedIndex) {
            fetchIndexData();
        }
    }, [selectedIndex]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-card border border-dark-border p-6 rounded-xl shadow-lg">
                <div>
                    <h2 className="text-2xl font-bold text-dark-text flex items-center gap-2">
                        <span>📊</span> Real-Time Indices Menu
                    </h2>
                    <p className="text-sm text-dark-text-secondary mt-1">Select an NSE Index to view its live breakdown.</p>
                </div>
                <div className="relative">
                    <select
                        value={selectedIndex}
                        onChange={(e) => setSelectedIndex(e.target.value)}
                        className="bg-dark-bg border border-dark-border rounded-lg text-dark-text px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-accent w-full sm:w-72 font-medium shadow-inner transition-colors"
                    >
                        {INDICES_LIST.map((item, idx) => (
                            <option className="bg-dark-bg text-dark-text" key={idx} value={item[0]}>
                                {item[1]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-accent"></div>
                    <span className="ml-4 font-semibold text-dark-text">Fetching Index Data...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-sell/10 border border-red-sell/30 p-6 rounded-xl flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <h3 className="font-bold text-red-sell">Data Fetch Error</h3>
                        <p className="text-dark-text text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {!loading && !error && data && data.data && (
                <div className="overflow-x-auto bg-dark-card rounded-xl border border-dark-border shadow-lg">
                    <div className="p-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                        <div className="font-bold text-dark-text">{data.name} <span className="text-dark-text-secondary text-sm ml-2">Constituents</span></div>
                        <div className="text-sm text-dark-text-secondary">Updated: {data.timestamp || 'Live'}</div>
                    </div>
                    <table className="w-full text-left text-sm text-dark-text whitespace-nowrap">
                        <thead className="bg-dark-bg/80 text-dark-text-secondary text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Symbol</th>
                                <th className="px-6 py-4 font-semibold text-right">Open</th>
                                <th className="px-6 py-4 font-semibold text-right">High</th>
                                <th className="px-6 py-4 font-semibold text-right">Low</th>
                                <th className="px-6 py-4 font-semibold text-right">LTP</th>
                                <th className="px-6 py-4 font-semibold text-right">Chng</th>
                                <th className="px-6 py-4 font-semibold text-right">% Chng</th>
                                <th className="px-6 py-4 font-semibold text-right">Volume</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {data.data.map((stock, idx) => {
                                // Sometimes the first item is the index itself, we can choose to highlight it
                                const isIndex = stock.symbol === data.name || stock.identifier === data.name;

                                return (
                                    <tr key={idx} className={`hover:bg-dark-bg transition-colors ${isIndex ? 'bg-blue-accent/5' : ''}`}>
                                        <td className="px-6 py-4 font-bold text-blue-accent">{stock.symbol}</td>
                                        <td className="px-6 py-4 text-right">{stock.open?.toLocaleString() || '-'}</td>
                                        <td className="px-6 py-4 text-right text-green-buy">{stock.dayHigh?.toLocaleString() || '-'}</td>
                                        <td className="px-6 py-4 text-right text-red-sell">{stock.dayLow?.toLocaleString() || '-'}</td>
                                        <td className="px-6 py-4 text-right font-bold">{stock.lastPrice?.toLocaleString() || '-'}</td>
                                        <td className={`px-6 py-4 text-right font-medium ${stock.change > 0 ? 'text-green-buy' : stock.change < 0 ? 'text-red-sell' : ''}`}>
                                            {stock.change > 0 ? '+' : ''}{stock.change?.toLocaleString() || '-'}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-medium ${stock.pChange > 0 ? 'text-green-buy' : stock.pChange < 0 ? 'text-red-sell' : ''}`}>
                                            {stock.pChange > 0 ? '+' : ''}{stock.pChange}%
                                        </td>
                                        <td className="px-6 py-4 text-right text-dark-text-secondary">
                                            {stock.totalTradedVolume?.toLocaleString() || '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default NSEIndicesMenu;
