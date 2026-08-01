import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchQuote,
  fetchCandles,
  fetchProfile,
  searchStocks,
} from '../api/finnhub';

// ============================================================
// Price history (chart data) — Finnhub Candles
// ============================================================
export function usePriceHistory(symbol, range = '1mo') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const daysMap = { '5d': 7, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '5y': 365 * 5 };
  const resolutionMap = { '5d': '5', '1mo': 'D', '3mo': 'D', '6mo': 'D', '1y': 'W', '5y': 'W' };

  useEffect(() => {
    if (!symbol) return;
    const days = daysMap[range] ?? 30;
    const resolution = resolutionMap[range] ?? 'D';
    let cancelled = false;
    setLoading(true);
    setError(null);

    const now = Math.floor(Date.now() / 1000);
    const from = now - (days + 5) * 24 * 60 * 60; // Add buffer to ensure we get enough data

    fetchCandles(symbol, resolution, from, now)
      .then(d => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        console.error('Candle fetch error:', err);
        if (!cancelled) setError('Could not load price history.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [symbol, range, attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);
  return { data, loading, error, retry };
}

// ============================================================
// Stock quote — Finnhub Quote
// ============================================================
export function useStockQuote(symbol) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchQuote(symbol)
      .then(d => { if (!cancelled) setQuote(d); })
      .catch(() => { if (!cancelled) setError('Could not load quote.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [symbol, attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);
  return { quote, loading, error, retry };
}

// ============================================================
// Company overview — Finnhub Profile
// ============================================================
export function useStockOverview(symbol) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProfile(symbol)
      .then(d => { if (!cancelled) setOverview(d); })
      .catch(() => { if (!cancelled) setError('Could not load company overview.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [symbol, attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);
  return { overview, loading, error, retry };
}

// ============================================================
// Technical indicator — Finnhub Technical Analysis (Premium)
// Note: Technical indicators require premium subscription
// ============================================================
export function useTechnicalIndicator(symbol, indicatorType = 'sma', params = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!symbol) return;
    // Finnhub technical indicators require premium subscription
    // For now, we'll calculate simple indicators from candle data
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Calculate simple moving average from price history
    const period = params.period ?? 20;
    const now = Math.floor(Date.now() / 1000);
    const from = now - (period + 50) * 24 * 60 * 60; // Add more buffer

    fetchCandles(symbol, 'D', from, now)
      .then(candles => {
        if (!cancelled && candles.length >= period) {
          const smaData = [];
          for (let i = period - 1; i < candles.length; i++) {
            const sum = candles.slice(i - period + 1, i + 1).reduce((acc, c) => acc + c.close, 0);
            smaData.push({
              time: candles[i].time,
              date: candles[i].date,
              value: sum / period,
            });
          }
          setData(smaData);
        }
      })
      .catch((err) => {
        console.error('Technical indicator error:', err);
        if (!cancelled) setError(`Could not load ${indicatorType}.`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [symbol, indicatorType, JSON.stringify(params), attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);
  return { data, loading, error, retry };
}

// ============================================================
// Search — Finnhub Search
// ============================================================
export function useStockSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const search = useCallback(async (query) => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    setError(null);

    try {
      const raw = await searchStocks(query);
      setResults(raw);
    } catch {
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback((query) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(query), 300);
  }, [search]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { results, loading, error, search, debouncedSearch };
}

// ============================================================
// Utility formatters
// ============================================================
export function formatCurrency(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function formatLargeNumber(n) {
  if (n == null || Number.isNaN(n)) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function formatChangePercent(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export function formatPercent(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(2)}%`;
}
