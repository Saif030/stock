const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchQuote(symbol) {
  return parseQuote(await request(`/quote/${encodeURIComponent(symbol)}`));
}

export async function fetchHistory(symbol, range = '1mo', interval) {
  const params = new URLSearchParams({ range });
  if (interval) params.set('interval', interval);
  return parseHistory(await request(`/history/${encodeURIComponent(symbol)}?${params}`));
}

export async function searchStocks(query) {
  return parseSearch(await request(`/search?q=${encodeURIComponent(query)}`));
}

export async function fetchNews(count = 8) {
  return parseNews(await request(`/news?count=${count}`));
}

/* --- parsers (normalize backend responses) --- */

export function parseQuote(data) {
  if (!data) return null;
  const prices = (data.prices ?? []).filter(p => p.close != null);
  const current = data.price ?? prices[prices.length - 1]?.close;
  const prev = data.previousClose ?? data.change != null ? current - data.change : current;
  return {
    symbol: data.symbol,
    name: data.name ?? data.symbol,
    price: current,
    change: data.change ?? (current != null && prev != null ? current - prev : 0),
    changePercent: data.changePercent ?? (prev ? ((current - prev) / prev) * 100 : 0),
    previousClose: prev,
    high: data.high,
    low: data.low,
    volume: data.volume,
    prices,
  };
}

export function parseHistory(data) {
  if (!Array.isArray(data)) return [];
  return data.filter(p => p.close != null).map(p => ({
    time: p.time, open: p.open, high: p.high,
    low: p.low, close: p.close, volume: p.volume,
  }));
}

export function parseSearch(data) {
  if (!Array.isArray(data)) return [];
  return data.map(q => ({
    symbol: q.symbol,
    name: q.name ?? q.shortName ?? q.longName ?? q.symbol,
    exchange: q.exchange ?? '',
  }));
}

export function parseNews(data) {
  if (!Array.isArray(data)) return [];
  return data.map(n => ({
    id: n.id,
    title: n.title,
    pubDate: n.pubDate,
    publisher: n.publisher,
    link: n.link,
  }));
}
