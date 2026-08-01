import { useState } from 'react';
import { useStock } from '../context/StockContext';
import { formatCurrency, formatChangePercent } from '../hooks/useStock';
import EmptyState from './ui/EmptyState';
import { IoAdd, IoTrash, IoPricetag } from 'react-icons/io5';

export default function PortfolioPanel() {
  const { portfolio, addToPortfolio, removeFromPortfolio, stockData } = useStock();
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [avgPrice, setAvgPrice] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!symbol.trim() || !shares || !avgPrice) return;
    addToPortfolio({ symbol: symbol.toUpperCase(), shares: +shares, avgPrice: +avgPrice });
    setSymbol('');
    setShares('');
    setAvgPrice('');
    setShowForm(false);
  };

  const totalValue = portfolio.reduce((sum, p) => {
    const cur = stockData[p.symbol]?.price ?? p.avgPrice;
    return sum + cur * p.shares;
  }, 0);

  const totalCost = portfolio.reduce((sum, p) => sum + p.avgPrice * p.shares, 0);
  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost ? (totalPL / totalCost) * 100 : 0;
  const plColor = totalPL >= 0 ? 'text-green-400' : 'text-red-400';

  const inputCls = "w-full bg-gray-700/70 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <section className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <IoPricetag className="text-blue-400" /> Portfolio
          {portfolio.length > 0 && (
            <span className="text-xs text-gray-500 font-normal bg-gray-700/60 px-1.5 py-0.5 rounded-full tabular-nums">{portfolio.length}</span>
          )}
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition">
          <IoAdd /> {showForm ? 'Cancel' : 'Add'}
        </button>
      </div>

      {portfolio.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Value</p>
            <p className="text-sm font-bold tabular-nums mt-1">{formatCurrency(totalValue)}</p>
          </div>
          <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Cost</p>
            <p className="text-sm font-bold tabular-nums mt-1">{formatCurrency(totalCost)}</p>
          </div>
          <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">P&L</p>
            <p className={`text-sm font-bold tabular-nums mt-1 ${plColor}`}>
              {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)}
              <span className="text-xs ml-1">({formatChangePercent(totalPLPercent)})</span>
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 p-3 bg-gray-900/50 border border-gray-700/40 rounded-lg space-y-2">
          <input
            type="text"
            placeholder="Symbol (e.g. AAPL)"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className={inputCls}
            autoFocus
          />
          <div className="flex gap-2">
            <input type="number" placeholder="Shares" value={shares} onChange={e => setShares(e.target.value)} className={inputCls} min="0" step="any" />
            <input type="number" step="0.01" placeholder="Avg Price" value={avgPrice} onChange={e => setAvgPrice(e.target.value)} className={inputCls} min="0" />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-sm font-semibold py-2 rounded-lg transition">Add to Portfolio</button>
        </form>
      )}

      {portfolio.length === 0 ? (
        <EmptyState
          icon="💼"
          title="No holdings yet"
          description="Add shares you own to track your total value and profit & loss."
        />
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
          {portfolio.map((p) => {
            const cur = stockData[p.symbol]?.price ?? p.avgPrice;
            const pl = (cur - p.avgPrice) * p.shares;
            const plPct = ((cur - p.avgPrice) / p.avgPrice) * 100;
            const value = cur * p.shares;
            return (
              <div key={p.symbol} className="flex items-center justify-between gap-2 p-2.5 bg-gray-700/30 border border-gray-700/30 rounded-lg group">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-white">{p.symbol}</p>
                  <p className="text-xs text-gray-400">{p.shares} shares @ {formatCurrency(p.avgPrice)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums">{formatCurrency(value)}</p>
                  <p className={`text-xs tabular-nums ${pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pl >= 0 ? '+' : ''}{formatCurrency(pl)} ({formatChangePercent(plPct)})
                  </p>
                </div>
                <button onClick={() => removeFromPortfolio(p.symbol)} className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition shrink-0" aria-label={`Remove ${p.symbol}`}>
                  <IoTrash />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
