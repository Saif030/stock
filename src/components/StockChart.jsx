import { useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { usePriceHistory, formatCurrency, formatChangePercent } from '../hooks/useStock';
import { SkeletonChart } from './ui/Skeleton';
import ErrorState from './ui/ErrorState';
import { IoStatsChart, IoTrendingUp, IoBarChart } from 'react-icons/io5';

const RANGES = [
  { label: '1W', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
];

const CHART_TYPES = [
  { key: 'line', label: 'Line', icon: <IoTrendingUp /> },
  { key: 'candle', label: 'Candle', icon: <IoStatsChart /> },
  { key: 'bar', label: 'Bar', icon: <IoBarChart /> },
];

export default function StockChart({ symbol }) {
  const [range, setRange] = useState('1mo');
  const [chartType, setChartType] = useState('line');
  const { data, loading, error, retry } = usePriceHistory(symbol, range);

  if (!symbol) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm border border-dashed border-gray-700 rounded-xl">
        Select a stock to view chart
      </div>
    );
  }

  if (loading) return <SkeletonChart />;

  if (error) {
    return (
      <div className="bg-gray-800/60 rounded-xl border border-gray-700/50">
        <div className="px-4 pt-4 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold text-white">{symbol} Price Chart</h2>
          <div className="flex gap-1">
            {RANGES.map(r => (
              <button key={r.value} onClick={() => setRange(r.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${range === r.value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{r.label}</button>
            ))}
          </div>
        </div>
        <div className="p-4">
          <ErrorState message={error} onRetry={retry} compact />
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm border border-dashed border-gray-700 rounded-xl">
        No data available for {symbol}
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    date: new Date(d.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: new Date(d.time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
  }));

  const minPrice = Math.min(...chartData.map(d => d.low ?? d.close)) * 0.998;
  const maxPrice = Math.max(...chartData.map(d => d.high ?? d.close)) * 1.002;
  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  const isUp = last.close >= first.close;
  const upColor = '#4ade80';
  const downColor = '#f87171';
  const accent = isUp ? upColor : downColor;
  const changePct = first.close ? ((last.close - first.close) / first.close) * 100 : 0;
  const gridColor = isUp ? '#14532d' : '#7f1d1d';

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
        <p className="text-gray-400 mb-1">{d.fullDate}</p>
        <p className="font-bold text-white">Close: {formatCurrency(d.close)}</p>
        <p className="text-gray-400 mt-1">O: {formatCurrency(d.open)} · H: {formatCurrency(d.high)} · L: {formatCurrency(d.low)}</p>
        {d.volume != null && <p className="text-gray-400 mt-0.5">Vol: {d.volume.toLocaleString()}</p>}
      </div>
    );
  };

  const axisProps = {
    tick: { fontSize: 10, fill: '#9ca3af' },
    axisLine: false,
    tickLine: false,
  };

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/60">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {symbol}
              <span className={`text-sm font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {formatChangePercent(changePct)}
              </span>
            </h2>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(last.close)}</p>
          </div>
          <div className="flex gap-1">
            {CHART_TYPES.map(ct => (
              <button
                key={ct.key}
                onClick={() => setChartType(ct.key)}
                title={ct.label}
                aria-label={ct.label}
                className={`p-2 rounded-lg text-sm transition ${chartType === ct.key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {ct.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${range === r.value ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40' : 'bg-gray-700/70 text-gray-300 hover:bg-gray-600'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="priceArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" strokeOpacity={0.35} />
              <XAxis dataKey="date" {...axisProps} />
              <YAxis domain={[minPrice, maxPrice]} {...axisProps} width={52} tickFormatter={(v) => '$' + v.toFixed(0)} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4b5563', strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="close" stroke={accent} strokeWidth={2} fill="url(#priceArea)" dot={false} />
            </ComposedChart>
          ) : chartType === 'bar' ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" strokeOpacity={0.35} />
              <XAxis dataKey="date" {...axisProps} />
              <YAxis yAxisId="price" domain={[minPrice, maxPrice]} {...axisProps} width={52} tickFormatter={(v) => '$' + v.toFixed(0)} />
              <YAxis yAxisId="vol" orientation="right" hide />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4b5563', strokeDasharray: '3 3' }} />
              <Bar yAxisId="vol" dataKey="volume" fill={isUp ? '#166534' : '#7f1d1d'} opacity={0.25} />
              <Line yAxisId="price" type="monotone" dataKey="close" stroke={accent} strokeWidth={2} dot={false} />
            </ComposedChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" strokeOpacity={0.35} />
              <XAxis dataKey="date" {...axisProps} />
              <YAxis yAxisId="price" domain={[minPrice, maxPrice]} {...axisProps} width={52} tickFormatter={(v) => '$' + v.toFixed(0)} />
              <YAxis yAxisId="vol" orientation="right" hide />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4b5563', strokeDasharray: '3 3' }} />
              <Bar yAxisId="vol" dataKey="volume" fill="#1e3a5f" opacity={0.25} />
              <Line yAxisId="price" type="monotone" dataKey="close" stroke={accent} strokeWidth={1.5} dot={false} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {chartType === 'candle' && (
        <div className="flex gap-4 justify-center pb-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 inline-block" /> Bullish</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 inline-block" /> Bearish</span>
        </div>
      )}
    </div>
  );
}
