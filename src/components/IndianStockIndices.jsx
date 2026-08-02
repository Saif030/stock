import { useEffect, useState } from 'react';
import { fetchQuote, fetchHistory } from '../api/yahoo';
import { formatChangePercent } from '../hooks/useStock';
import { IoTrendingUp, IoTrendingDown, IoBarChart, IoChevronDown, IoChevronUp } from 'react-icons/io5';
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

const INDIAN_INDICES = [
  { symbol: '^NSEI', name: 'NSE NIFTY 50' },
  { symbol: '^BSESN', name: 'BSE SENSEX' },
];

const RANGES = [
  { label: '1D', value: '5d' },
  { label: '5D', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
];

function getIndianMarketStatus() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getUTCDay();
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Indian market hours: 9:15 AM to 3:30 PM IST (3:15 to 10:00 UTC)
  const isWeekday = day >= 1 && day <= 5;
  const isOpen = isWeekday && totalMinutes >= 195 && totalMinutes <= 600;
  
  return { isOpen, label: isOpen ? 'Market Open' : 'Market Closed' };
}

export default function IndianStockIndices() {
  const [data, setData] = useState({});
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('1mo');
  const [loadingChart, setLoadingChart] = useState(false);
  const { isOpen, label } = getIndianMarketStatus();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = {};
      for (const idx of INDIAN_INDICES) {
        try {
          const q = await fetchQuote(idx.symbol);
          if (q) results[idx.symbol] = q;
        } catch { /* skip */ }
      }
      if (!cancelled) setData(results);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!expandedIndex) return;
    
    let cancelled = false;
    (async () => {
      setLoadingChart(true);
      try {
        const history = await fetchHistory(expandedIndex, selectedRange);
        if (!cancelled) setChartData(history);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        if (!cancelled) setLoadingChart(false);
      }
    })();
    return () => { cancelled = true; };
  }, [expandedIndex, selectedRange]);

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-blue-400">
        <IoBarChart /> Indian Market Indices
      </h3>
      
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isOpen ? 'bg-green-500/10 text-green-400' : 'bg-gray-700/40 text-gray-400'}`}>
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          {label}
        </span>
        <span className="text-xs text-gray-500">IST</span>
      </div>

      <div className="space-y-2">
        {INDIAN_INDICES.map(idx => {
          const q = data[idx.symbol];
          const up = q?.changePercent >= 0;
          const Icon = up ? IoTrendingUp : IoTrendingDown;
          const isExpanded = expandedIndex === idx.symbol;
          const ChevronIcon = isExpanded ? IoChevronUp : IoChevronDown;
          
          return (
            <div key={idx.symbol}>
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx.symbol)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{idx.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {q?.price != null ? (
                    <>
                      <span className="text-sm font-bold tabular-nums">{q.price.toFixed(2)}</span>
                      <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
                        <Icon size={12} />
                        {formatChangePercent(q.changePercent)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-600">Loading...</span>
                  )}
                  <ChevronIcon size={16} className="text-gray-500" />
                </div>
              </button>
              
              {isExpanded && q && (
                <div className="mt-3 bg-gray-700/30 rounded-lg border border-gray-700/50 overflow-hidden">
                  {/* Header with price info */}
                  <div className="p-4 pb-2">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-base font-bold text-white mb-1">{idx.name}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold tabular-nums text-white">₹{q.price?.toFixed(2) || 'N/A'}</span>
                          <div className={`flex items-center gap-1 text-sm font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
                            <Icon size={16} />
                            <span>{q.change?.toFixed(2) || 'N/A'}</span>
                            <span>({formatChangePercent(q.changePercent)})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time range buttons */}
                    <div className="flex flex-wrap gap-1">
                      {RANGES.map(r => (
                        <button
                          key={r.value}
                          onClick={() => setSelectedRange(r.value)}
                          className={`px-3 py-1 rounded text-xs font-medium transition ${selectedRange === r.value ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="h-48 px-2 pb-2">
                    {loadingChart ? (
                      <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                        Loading chart...
                      </div>
                    ) : chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                          <defs>
                            <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={up ? '#4ade80' : '#f87171'} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={up ? '#4ade80' : '#f87171'} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={up ? '#14532d' : '#7f1d1d'} strokeDasharray="3 3" strokeOpacity={0.35} />
                          <XAxis 
                            dataKey="time" 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis 
                            domain={['auto', 'auto']}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => '₹' + v.toFixed(0)}
                            width={50}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0]?.payload;
                              return (
                                <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs shadow-xl">
                                  <p className="text-gray-400">{new Date(d.time).toLocaleDateString()}</p>
                                  <p className="font-bold text-white">₹{d.close?.toFixed(2)}</p>
                                </div>
                              );
                            }}
                            cursor={{ stroke: '#4b5563', strokeDasharray: '3 3' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="close" 
                            stroke={up ? '#4ade80' : '#f87171'} 
                            strokeWidth={2} 
                            fill="url(#chartArea)" 
                            dot={false} 
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                        No chart data available
                      </div>
                    )}
                  </div>

                  {/* Footer with additional info */}
                  <div className="px-4 py-2 border-t border-gray-700/50 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 block">Day High</span>
                      <span className="text-green-400 font-semibold">₹{q.high?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Day Low</span>
                      <span className="text-red-400 font-semibold">₹{q.low?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Volume</span>
                      <span className="text-white font-semibold">
                        {q.volume ? (q.volume / 1000000).toFixed(2) + 'M' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
