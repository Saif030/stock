import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchQuote } from '../api/yahoo';

const StockContext = createContext();

const STORAGE_WATCHLIST = 'stock_watchlist';
const STORAGE_PORTFOLIO = 'stock_portfolio';
const STORAGE_ALERTS = 'stock_alerts';
const REFRESH_MS = Number(import.meta.env.VITE_PRICE_REFRESH_INTERVAL) || 30000;

const SEED_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'];

export const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'SPY', name: 'S&P 500 ETF' },
];

function loadArray(key) {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}

export function StockProvider({ children }) {
  const [watchlist, setWatchlist] = useState(() => loadArray(STORAGE_WATCHLIST));
  const [portfolio, setPortfolio] = useState(() => loadArray(STORAGE_PORTFOLIO));
  const [stockData, setStockData] = useState({});
  const [alerts, setAlerts] = useState(() => loadArray(STORAGE_ALERTS));
  const [news, setNews] = useState([]);
  const [toasts, setToasts] = useState([]);

  const watchlistRef = useRef(watchlist);
  const portfolioRef = useRef(portfolio);
  const pricesCache = useRef({});

  useEffect(() => { watchlistRef.current = watchlist; }, [watchlist]);
  useEffect(() => { portfolioRef.current = portfolio; }, [portfolio]);

  useEffect(() => {
    localStorage.setItem(STORAGE_WATCHLIST, JSON.stringify(watchlist));
    localStorage.setItem(STORAGE_PORTFOLIO, JSON.stringify(portfolio));
    localStorage.setItem(STORAGE_ALERTS, JSON.stringify(alerts));
  }, [watchlist, portfolio, alerts]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshPrices = useCallback(async () => {
    const wl = watchlistRef.current;
    const pf = portfolioRef.current;
    const userSymbols = [...new Set([...wl, ...pf.map(p => p.symbol)])];
    const symbols = userSymbols.length > 0 ? userSymbols : SEED_SYMBOLS;

    const results = {};
    for (const sym of symbols.slice(0, 20)) {
      try {
        const data = await fetchQuote(sym);
        if (data) { results[sym] = data; continue; }
      } catch { /* skip */ }
      if (!results[sym] && pricesCache.current[sym]) results[sym] = pricesCache.current[sym];
    }
    if (Object.keys(results).length) {
      pricesCache.current = { ...pricesCache.current, ...results };
      setStockData(prev => ({ ...prev, ...results }));
    }
  }, []);

  useEffect(() => {
    refreshPrices();
    const id = setInterval(refreshPrices, REFRESH_MS);
    return () => clearInterval(id);
  }, [refreshPrices]);

  const addToWatchlist = (symbol) => {
    const sym = symbol.toUpperCase();
    if (!watchlist.includes(sym)) {
      setWatchlist(prev => [...prev, sym]);
      showToast(`${sym} added to watchlist`);
    } else {
      showToast(`${sym} is already on your watchlist`, 'info');
    }
  };
  const removeFromWatchlist = (symbol) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
    showToast(`${symbol} removed from watchlist`, 'info');
  };

  const addToPortfolio = (entry) => {
    setPortfolio(prev => [...prev, { ...entry, symbol: entry.symbol.toUpperCase() }]);
    showToast(`${entry.symbol.toUpperCase()} added to portfolio`);
  };
  const removeFromPortfolio = (symbol) => {
    setPortfolio(prev => prev.filter(p => p.symbol !== symbol));
    showToast(`${symbol} removed from portfolio`, 'info');
  };
  const updatePortfolio = (symbol, updates) => setPortfolio(prev =>
    prev.map(p => p.symbol === symbol ? { ...p, ...updates } : p)
  );

  const addAlert = (alert) => {
    setAlerts(prev => [...prev, { ...alert, id: Date.now(), triggered: false }]);
    showToast(`Alert set for ${alert.symbol}`);
  };
  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    showToast('Alert removed', 'info');
  };
  const triggerAlert = (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, triggered: true } : a));

  return (
    <StockContext.Provider value={{
      watchlist, addToWatchlist, removeFromWatchlist,
      portfolio, addToPortfolio, removeFromPortfolio, updatePortfolio,
      stockData, refreshPrices,
      alerts, addAlert, removeAlert, triggerAlert,
      news, setNews,
      toasts, showToast, dismissToast,
    }}>
      {children}
    </StockContext.Provider>
  );
}

export const useStock = () => useContext(StockContext);
