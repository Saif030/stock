import { useEffect, useState } from 'react';
import { fetchQuote } from '../api/yahoo';
import { formatChangePercent } from '../hooks/useStock';
import { IoTrendingUp, IoTrendingDown, IoTimeOutline } from 'react-icons/io5';

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'Dow Jones' },
];

function getMarketStatus() {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getUTCDay();
  const minutes = et.getUTCHours() * 60 + et.getUTCMinutes();
  const isWeekday = day >= 1 && day <= 5;
  const isOpen = isWeekday && minutes >= 570 && minutes <= 960;
  return { isOpen, label: isOpen ? 'Market Open' : 'Market Closed' };
}

export default function MarketStrip() {
  const [data, setData] = useState({});
  const { isOpen, label } = getMarketStatus();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = {};
      for (const idx of INDICES) {
        try {
          const q = await fetchQuote(idx.symbol);
          if (q) results[idx.symbol] = q;
        } catch { /* skip */ }
      }
      if (!cancelled) setData(results);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
      <span className={`inline-flex items-center gap-1.5 shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-full ${isOpen ? 'bg-green-500/10 text-green-400' : 'bg-gray-700/40 text-gray-400'}`}>
        <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
        {label}
      </span>

      {INDICES.map(idx => {
        const q = data[idx.symbol];
        const up = q?.changePercent >= 0;
        const Icon = up ? IoTrendingUp : IoTrendingDown;
        return (
          <div key={idx.symbol} className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/50 min-w-max">
            <span className="text-xs text-gray-400">{idx.name}</span>
            {q?.price != null ? (
              <>
                <span className="text-sm font-bold tabular-nums">{q.price.toFixed(2)}</span>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
                  <Icon size={12} />
                  {formatChangePercent(q.changePercent)}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-600">…</span>
            )}
          </div>
        );
      })}

      <span className="hidden md:flex items-center gap-1.5 ml-auto text-xs text-gray-500 shrink-0">
        <IoTimeOutline size={14} />
        Prices delayed &bull; {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
