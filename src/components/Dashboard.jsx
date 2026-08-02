import { useState } from 'react';
import { useStock } from '../context/StockContext';
import SearchBar from './SearchBar';
import WatchlistPanel from './WatchlistPanel';
import StockChart from './StockChart';
import PortfolioPanel from './PortfolioPanel';
import AlertsPanel from './AlertsPanel';
import NewsPanel from './NewsPanel';
import TechnicalIndicators from './TechnicalIndicators';
import StockCard from './StockCard';
import WelcomeHero from './WelcomeHero';
import Toasts from './Toasts';
import MarketStrip from './MarketStrip';
import TradingData from './TradingData';
import IndianStockIndices from './IndianStockIndices';
import { usePriceHistory } from '../hooks/useStock';
import { IoRefresh, IoTrendingUp, IoTrendingDown, IoStar, IoPricetag, IoNotifications, IoHome } from 'react-icons/io5';

const MOBILE_TABS = [
  { key: 'home', label: 'Home', icon: <IoHome /> },
  { key: 'watchlist', label: 'Watchlist', icon: <IoStar /> },
  { key: 'portfolio', label: 'Portfolio', icon: <IoPricetag /> },
  { key: 'alerts', label: 'Alerts', icon: <IoNotifications /> },
];

export default function Dashboard() {
  const [selectedStock, setSelectedStock] = useState(import.meta.env.VITE_DEFAULT_SYMBOL || 'AAPL');
  const [mobileTab, setMobileTab] = useState('home');
  const { stockData, refreshPrices, watchlist, portfolio } = useStock();
  const { data: chartData } = usePriceHistory(selectedStock);

  const isNewUser = watchlist.length === 0 && portfolio.length === 0;
  const selectedData = stockData[selectedStock];
  const gainers = Object.values(stockData).filter(s => s.change > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers = Object.values(stockData).filter(s => s.change < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  const selectStock = (s) => {
    setSelectedStock(s);
    setMobileTab('home');
  };

  const renderSidebarPanels = () => (
    <div className="space-y-4">
      <WatchlistPanel onSelectStock={selectStock} />
      <PortfolioPanel />
      <AlertsPanel />
    </div>
  );

  const renderMobileTab = () => {
    switch (mobileTab) {
      case 'watchlist': return <WatchlistPanel onSelectStock={selectStock} />;
      case 'portfolio': return <PortfolioPanel />;
      case 'alerts': return <AlertsPanel />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-16 lg:pb-0">
      <Toasts />

      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-black shadow-md shadow-blue-900/40">S</span>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              StockDash
            </h1>
          </div>
          <div className="flex-1 flex justify-center">
            <SearchBar />
          </div>
          <button
            onClick={refreshPrices}
            className="p-2.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition shrink-0"
            title="Refresh prices"
            aria-label="Refresh prices"
          >
            <IoRefresh size={18} />
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <MarketStrip />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-5 lg:py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-[110px] max-h-[calc(100vh-130px)] overflow-y-auto scrollbar-thin pr-1">
              {renderSidebarPanels()}
            </div>
          </aside>

          <main className="flex-1 min-w-0 space-y-4">
            {/* mobile tab panels (shown below main on small screens) */}
            {mobileTab !== 'home' && (
              <div className="lg:hidden">{renderMobileTab()}</div>
            )}

            {isNewUser && mobileTab === 'home' && (
              <WelcomeHero onSelectStock={selectStock} />
            )}

            {selectedStock && mobileTab === 'home' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <StockCard symbol={selectedStock} onSelect={() => {}} />
                <TradingData data={selectedData} symbol={selectedStock} />
              </div>
            )}

            {mobileTab === 'home' && <IndianStockIndices />}

            {mobileTab === 'home' && <StockChart symbol={selectedStock} />}

            {mobileTab === 'home' && chartData.length > 0 && (
              <TechnicalIndicators data={chartData} symbol={selectedStock} />
            )}

            {mobileTab === 'home' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-green-400">
                    <IoTrendingUp /> Top Gainers
                  </h3>
                  {gainers.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No movers to show yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {gainers.map(g => (
                        <button key={g.symbol} onClick={() => selectStock(g.symbol)} className="w-full flex items-center justify-between px-3 py-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition">
                          <span className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{g.symbol}</span>
                            <span className="text-xs text-gray-400 truncate max-w-[120px]">{g.name}</span>
                          </span>
                          <span className="text-green-400 text-sm font-semibold tabular-nums">+{g.changePercent?.toFixed(2)}%</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-red-400">
                    <IoTrendingDown /> Top Losers
                  </h3>
                  {losers.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No movers to show yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {losers.map(g => (
                        <button key={g.symbol} onClick={() => selectStock(g.symbol)} className="w-full flex items-center justify-between px-3 py-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition">
                          <span className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{g.symbol}</span>
                            <span className="text-xs text-gray-400 truncate max-w-[120px]">{g.name}</span>
                          </span>
                          <span className="text-red-400 text-sm font-semibold tabular-nums">{g.changePercent?.toFixed(2)}%</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {mobileTab === 'home' && <NewsPanel />}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
        <div className="flex">
          {MOBILE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${mobileTab === tab.key ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
