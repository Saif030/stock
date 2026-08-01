import { useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { formatCurrency } from '../hooks/useStock';

function sma(data, period) {
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((s, v) => s + v, 0) / period;
    result.push({ date: data[i].date, value: avg });
  }
  return result;
}

function rsi(data, period = 14) {
  if (data.length < period + 1) return [];
  const gains = [], losses = [];
  for (let i = 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  let avgGain = gains.slice(0, period).reduce((s, v) => s + v, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((s, v) => s + v, 0) / period;
  const rsiValues = [];
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    if (avgLoss === 0) { rsiValues.push({ date: data[i + 1].date, value: 100 }); continue; }
    const rs = avgGain / avgLoss;
    rsiValues.push({ date: data[i + 1].date, value: 100 - 100 / (1 + rs) });
  }
  return rsiValues;
}

function macd(data) {
  const ema12 = emaCalc(data, 12);
  const ema26 = emaCalc(data, 26);
  const macdLine = [];
  for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
    macdLine.push({ date: ema12[i].date, value: ema12[i].value - ema26[i].value });
  }
  const signal = emaCalc(macdLine, 9);
  return { macdLine, signal };
}

function emaCalc(data, period) {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((s, v) => s + v.close, 0) / period;
  const result = [{ date: data[period - 1].date, value: ema }];
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * k + ema;
    result.push({ date: data[i].date, value: ema });
  }
  return result;
}

const tooltipStyle = { background: '#0f172a', border: '1px solid #374151', borderRadius: 8, fontSize: 12 };

export default function TechnicalIndicators({ data, symbol }) {
  const [indicator, setIndicator] = useState('sma');
  if (!data || data.length < 20) return null;

  const closes = data.map(d => d.close);
  const chartData = data.map(d => ({
    ...d,
    date: new Date(d.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const rsiData = rsi(data);
  const macdData = macd(data);
  const currentPrice = closes[closes.length - 1];
  const lastRsi = rsiData[rsiData.length - 1]?.value;

  const indicators = [
    { key: 'sma', label: 'SMA' },
    { key: 'rsi', label: 'RSI' },
    { key: 'macd', label: 'MACD' },
  ];

  return (
    <section className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-sm font-bold text-gray-200">Technical Indicators</h2>
        <div className="flex gap-1">
          {indicators.map(ind => (
            <button
              key={ind.key}
              onClick={() => setIndicator(ind.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${indicator === ind.key ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mb-2">
        <span className="text-gray-200 font-semibold">{symbol} · {formatCurrency(currentPrice)}</span>
        {indicator === 'sma' && (
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block" /> SMA20 <b className="text-amber-400 tabular-nums">${sma20[sma20.length - 1]?.value?.toFixed(2) ?? '—'}</b></span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block" /> SMA50 <b className="text-red-400 tabular-nums">${sma50[sma50.length - 1]?.value?.toFixed(2) ?? '—'}</b></span>
          </span>
        )}
        {indicator === 'rsi' && (
          <span className={`font-semibold tabular-nums ${lastRsi == null ? '' : lastRsi >= 70 ? 'text-red-400' : lastRsi <= 30 ? 'text-green-400' : 'text-gray-200'}`}>
            RSI(14): {lastRsi?.toFixed(1) ?? '—'} {lastRsi != null && (lastRsi >= 70 ? '(overbought)' : lastRsi <= 30 ? '(oversold)' : '(neutral)')}
          </span>
        )}
        {indicator === 'macd' && macdData.macdLine.length > 0 && (
          <span>MACD: <b className="text-blue-400 tabular-nums">{macdData.macdLine[macdData.macdLine.length - 1]?.value?.toFixed(2) ?? '—'}</b></span>
        )}
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          {indicator === 'sma' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v.toFixed(0)} width={52} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Price" />
              <Line data={sma20} type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={1} dot={false} name="SMA 20" />
              <Line data={sma50} type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={1} dot={false} name="SMA 50" />
            </LineChart>
          ) : indicator === 'rsi' ? (
            <LineChart data={rsiData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine y={70} stroke="#f87171" strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReferenceLine y={30} stroke="#4ade80" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={1.5} dot={false} name="RSI" />
            </LineChart>
          ) : (
            <LineChart data={macdData.macdLine.slice(-30)} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine y={0} stroke="#4b5563" />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="MACD" />
              <Line data={macdData.signal.slice(-30)} type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={1} dot={false} name="Signal" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
