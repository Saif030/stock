import { useState, useEffect, useRef } from 'react';
import { useStock } from '../context/StockContext';
import EmptyState from './ui/EmptyState';
import { IoNotifications, IoAdd, IoClose, IoCheckmarkCircle } from 'react-icons/io5';

export default function AlertsPanel() {
  const { alerts, addAlert, removeAlert, triggerAlert, stockData, showToast } = useStock();
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState('above');
  const [price, setPrice] = useState('');
  const triggeredRef = useRef(new Set());

  const handleAdd = (e) => {
    e.preventDefault();
    if (!symbol.trim() || !price) return;
    addAlert({ symbol: symbol.toUpperCase(), direction, price: +price });
    setSymbol('');
    setPrice('');
    setShowForm(false);
  };

  useEffect(() => {
    for (const a of alerts) {
      if (a.triggered || triggeredRef.current.has(a.id)) continue;
      const cur = stockData[a.symbol]?.price;
      if (cur == null) continue;
      const hit = (a.direction === 'above' && cur >= a.price) || (a.direction === 'below' && cur <= a.price);
      if (hit) {
        triggeredRef.current.add(a.id);
        triggerAlert(a.id);
        showToast(`🔔 ${a.symbol} crossed ${a.direction === 'above' ? 'above' : 'below'} $${a.price.toFixed(2)} (now $${cur.toFixed(2)})`, 'warning');
        const ev = new CustomEvent('stock-alert', { detail: { ...a, currentPrice: cur } });
        window.dispatchEvent(ev);
      }
    }
  }, [alerts, stockData, triggerAlert, showToast]);

  const inputCls = "w-full bg-gray-700/70 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition";

  return (
    <section className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <IoNotifications className="text-orange-400" /> Alerts
          {alerts.length > 0 && (
            <span className="text-xs text-gray-500 font-normal bg-gray-700/60 px-1.5 py-0.5 rounded-full tabular-nums">{alerts.filter(a => !a.triggered).length}</span>
          )}
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-xs font-semibold bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-lg transition">
          <IoAdd /> {showForm ? 'Cancel' : 'New'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 p-3 bg-gray-900/50 border border-gray-700/40 rounded-lg space-y-2">
          <input
            type="text"
            placeholder="Symbol (e.g. TSLA)"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className={inputCls}
            autoFocus
          />
          <div className="flex gap-2">
            <select value={direction} onChange={e => setDirection(e.target.value)} className={`${inputCls} flex-1`}>
              <option value="above">Rises above</option>
              <option value="below">Falls below</option>
            </select>
            <input type="number" step="0.01" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} className={`${inputCls} w-24`} min="0" />
          </div>
          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-sm font-semibold py-2 rounded-lg transition">Set Alert</button>
        </form>
      )}

      {alerts.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No price alerts yet"
          description="Set an alert to get notified when a stock crosses a price."
        />
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
          {alerts.map((a) => (
            <div key={a.id} className={`flex items-center justify-between gap-2 p-2.5 rounded-lg group ${a.triggered ? 'bg-gray-900/40 border border-gray-800' : 'bg-gray-700/30 border border-gray-700/30'}`}>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  {a.symbol}
                  {a.triggered && <IoCheckmarkCircle className="text-green-400" size={14} />}
                </p>
                <p className="text-xs text-gray-400 tabular-nums">{a.direction === 'above' ? '>' : '<'} ${a.price.toFixed(2)}{a.triggered ? ' · triggered' : ''}</p>
              </div>
              <button onClick={() => removeAlert(a.id)} className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition shrink-0" aria-label="Remove alert">
                <IoClose />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
