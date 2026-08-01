import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchQuote,
  fetchHistory,
  searchStocks,
} from '../api/yahoo';

// ============================================================
// Price history (chart data) — Yahoo Finance History
// ============================================================
export function usePriceHistory(symbol, range = '1mo') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchHistory(symbol, range)
      .then(d => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        console.error('History fetch error:', err);
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
// Stock quote — Yahoo Quote
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
// Company overview — Yahoo Quote (includes company info)
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

    fetchQuote(symbol)
      .then(d => { if (!cancelled) setOverview(d); })
      .catch(() => { if (!cancelled) setError('Could not load company overview.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [symbol, attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);
  return { overview, loading, error, retry };
}

// ============================================================
// Technical indicator — Calculated from Yahoo History
// ============================================================
export function useTechnicalIndicator(symbol, indicatorType = 'sma', params = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Calculate simple moving average from price history
    const period = params.period ?? 20;
    const range = '1y'; // Get enough data for calculation

    fetchHistory(symbol, range)
      .then(candles => {
        if (!cancelled && candles.length >= period) {
          const smaData = [];
          for (let i = period - 1; i < candles.length; i++) {
            const sum = candles.slice(i - period + 1, i + 1).reduce((acc, c) => acc + c.close, 0);
            smaData.push({
              time: candles[i].time,
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
// Search — Yahoo Search
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
