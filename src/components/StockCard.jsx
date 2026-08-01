import { useStock } from '../context/StockContext';
import { formatCurrency, formatLargeNumber, formatChangePercent } from '../hooks/useStock';
import { SkeletonCard } from './ui/Skeleton';
import { IoStar, IoStarOutline, IoTrashOutline } from 'react-icons/io5';

function Sparkline({ prices, up }) {
  if (!prices || prices.length < 2) return null;
  const closes = prices.map(p => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const points = closes.map((c, i) => {
    const x = (i / (closes.length - 1)) * w;
    const y = h - ((c - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  const color = up ? '#4ade80' : '#f87171';
  const id = `spark-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function StockCard({ symbol, inWatchlist = false, inPortfolio = false, onSelect }) {
  const { stockData, addToWatchlist, removeFromWatchlist, removeFromPortfolio } = useStock();
  const data = stockData[symbol];

  if (!data) return <SkeletonCard />;

  const isUp = data.change >= 0;
  const color = isUp ? 'text-green-400' : 'text-red-400';
  const bgColor = isUp ? 'bg-green-500/10' : 'bg-red-500/10';

  return (
    <div
      onClick={() => onSelect?.(symbol)}
      className="group rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-800/40 p-4 transition-all hover:border-gray-600 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-white truncate">{symbol}</h3>
            <span className="text-xs text-gray-400 truncate">{data.name}</span>
          </div>
          <p className="text-2xl font-bold mt-1 tabular-nums">{formatCurrency(data.price)}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          {inWatchlist ? (
            <button onClick={(e) => { e.stopPropagation(); removeFromWatchlist(symbol); }} className="p-1.5 text-yellow-400 hover:text-yellow-300 opacity-0 group-hover:opacity-100 transition" aria-label={`Remove ${symbol} from watchlist`}>
              <IoStar />
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); addToWatchlist(symbol); }} className="p-1.5 text-gray-500 hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition" aria-label={`Add ${symbol} to watchlist`}>
              <IoStarOutline />
            </button>
          )}
          {inPortfolio && (
            <button onClick={(e) => { e.stopPropagation(); removeFromPortfolio(symbol); }} className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition" aria-label={`Remove ${symbol} from portfolio`}>
              <IoTrashOutline />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <span className={`inline-flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded ${bgColor} ${color}`}>
          <span className="text-[10px]">{isUp ? '▲' : '▼'}</span>
          {formatCurrency(Math.abs(data.change))}
        </span>
        <span className={`text-sm font-semibold ${color}`}>{formatChangePercent(data.changePercent)}</span>
      </div>

      <div className="mt-2">
        <Sparkline prices={data.prices} up={isUp} />
      </div>

      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="tabular-nums">H: <span className="text-gray-300">{formatCurrency(data.high)}</span></span>
        <span className="tabular-nums">L: <span className="text-gray-300">{formatCurrency(data.low)}</span></span>
        <span className="tabular-nums">Vol: <span className="text-gray-300">{formatLargeNumber(data.volume)}</span></span>
      </div>
    </div>
  );
}
