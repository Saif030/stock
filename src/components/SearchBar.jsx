import { useState, useRef, useEffect } from 'react';
import { searchStocks, parseSearch } from '../api/yahoo';
import { useStock } from '../context/StockContext';
import Spinner from './ui/Spinner';
import EmptyState from './ui/EmptyState';
import { IoSearch, IoClose, IoAdd } from 'react-icons/io5';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { addToWatchlist } = useStock();
  const ref = useRef();
  const inputRef = useRef();
  const timer = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(timer.current);
    if (!v.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchStocks(v);
        setResults(parseSearch(data));
        setOpen(true);
      } catch { setResults([]); setOpen(true); }
      setLoading(false);
    }, 300);
  };

  const selectResult = (item) => {
    addToWatchlist(item.symbol);
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search stocks by ticker or name..."
          className="w-full pl-10 pr-14 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 transition"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading ? (
            <Spinner size={14} className="text-gray-400" />
          ) : query ? (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="text-gray-400 hover:text-gray-200" aria-label="Clear search">
              <IoClose />
            </button>
          ) : (
            <kbd className="hidden sm:block text-[10px] font-semibold text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">/</kbd>
          )}
        </div>
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full bg-gray-800/95 backdrop-blur border border-gray-700 rounded-xl shadow-2xl shadow-black/40 z-50 max-h-80 overflow-y-auto scrollbar-thin">
          {loading && (
            <div className="flex items-center gap-2 p-4 text-sm text-gray-400">
              <Spinner size={14} /> Searching...
            </div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="p-3">
              <EmptyState icon="🔍" title="No results found" description={`No matches for "${query}". Try a different ticker or name.`} />
            </div>
          )}
          {!loading && results.map((r) => (
            <button
              key={r.symbol}
              onClick={() => selectResult(r)}
              className="w-full text-left px-4 py-3 hover:bg-gray-700/70 flex items-center justify-between border-b border-gray-700/60 last:border-0 transition"
            >
              <div className="min-w-0">
                <span className="font-semibold text-sm text-white">{r.symbol}</span>
                <span className="text-gray-400 text-xs ml-2 bg-gray-700/60 px-1.5 py-0.5 rounded">{r.exchange}</span>
              </div>
              <span className="text-xs text-gray-400 truncate max-w-[160px]">{r.name}</span>
              <span className="ml-2 text-blue-400 shrink-0"><IoAdd size={14} /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
