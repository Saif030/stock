import { useStock, POPULAR_STOCKS } from '../context/StockContext';
import { IoRocket, IoAdd, IoSearch, IoStar, IoCheckmark } from 'react-icons/io5';
import { formatChangePercent } from '../hooks/useStock';

export default function WelcomeHero({ onSelectStock }) {
  const { addToWatchlist, stockData, watchlist } = useStock();

  const handleAdd = (symbol) => {
    addToWatchlist(symbol);
    onSelectStock?.(symbol);
  };

  const steps = [
    { icon: <IoSearch size={16} />, title: 'Search any stock', desc: 'Type a ticker like AAPL or company name in the search bar above.' },
    { icon: <IoStar size={16} />, title: 'Add to your watchlist', desc: 'Pin a stock, then tap it anytime to view live charts & indicators.' },
    { icon: <IoAdd size={16} />, title: 'Track your portfolio', desc: 'Add your shares and the app tracks total value, gains and losses.' },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gray-700/60 bg-gradient-to-br from-gray-900 via-gray-800/80 to-gray-900 p-6 sm:p-8">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-2 text-blue-400 mb-2">
          <IoRocket size={18} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Get started</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Welcome to StockDash
        </h1>
        <p className="text-gray-400 max-w-xl mb-6">
          Track stock prices, build a watchlist, manage a portfolio, and set price alerts — all in one place.
          Here's how to begin:
        </p>

        <ol className="grid gap-3 mb-8 max-w-2xl sm:grid-cols-3">
          {steps.map((item, i) => (
            <li key={i} className="flex sm:flex-col gap-3 items-start sm:items-center text-left sm:text-center p-3 rounded-xl bg-gray-800/50 border border-gray-700/40">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 shrink-0">{item.icon}</span>
              <div>
                <p className="font-semibold text-sm text-white">Step {i + 1}: {item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div>
          <p className="text-sm font-semibold text-white mb-3">Or jump in with a popular stock:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_STOCKS.map((s) => {
              const data = stockData[s.symbol];
              const pct = data?.changePercent;
              const added = watchlist.includes(s.symbol);
              return (
                <button
                  key={s.symbol}
                  onClick={() => handleAdd(s.symbol)}
                  disabled={added}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition ${added
                    ? 'bg-green-500/10 border-green-500/40 cursor-default'
                    : 'bg-gray-800/80 hover:bg-blue-600/20 border-gray-700/60 hover:border-blue-500/50'}`}
                >
                  <span className="font-bold text-sm text-white">{s.symbol}</span>
                  <span className="text-xs text-gray-400 group-hover:text-gray-300 hidden xs:inline sm:inline">{s.name}</span>
                  {data?.price != null && (
                    <span className={`text-xs font-semibold tabular-nums ${pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatChangePercent(pct)}
                    </span>
                  )}
                  <span className={`flex items-center gap-1 text-[11px] font-semibold ${added ? 'text-green-400' : 'text-blue-400'}`}>
                    {added ? <><IoCheckmark size={12} /> Added</> : <><IoAdd size={12} /> Add</>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
