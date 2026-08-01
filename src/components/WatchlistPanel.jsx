import { useStock } from '../context/StockContext';
import StockCard from './StockCard';
import EmptyState from './ui/EmptyState';

export default function WatchlistPanel({ onSelectStock }) {
  const { watchlist } = useStock();

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
        <span className="text-yellow-400">⭐</span> Watchlist
        <span className="text-xs text-gray-500 font-normal bg-gray-700/60 px-1.5 py-0.5 rounded-full tabular-nums">{watchlist.length}</span>
      </h2>
      {watchlist.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="Your watchlist is empty"
          description="Search for a ticker above or pick a popular stock to get started."
        />
      ) : (
        <div className="space-y-2">
          {watchlist.map((sym) => (
            <StockCard key={sym} symbol={sym} inWatchlist onSelect={onSelectStock} />
          ))}
        </div>
      )}
    </section>
  );
}
