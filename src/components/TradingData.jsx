import { formatCurrency, formatLargeNumber } from '../hooks/useStock';
import { SkeletonText } from './ui/Skeleton';

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-lg bg-gray-900/40 border border-gray-700/40 p-3">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-semibold tabular-nums mt-1">{value}</p>
      {sub && <p className="text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export default function TradingData({ data, symbol }) {
  if (!data) {
    return (
      <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
        <SkeletonText lines={3} />
      </div>
    );
  }

  const open = data.prices?.[0]?.open ?? data.price;
  const dayRangePct = data.previousClose ? ((data.price - data.previousClose) / data.previousClose) * 100 : 0;

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-200">Trading Data</h3>
        <span className="text-[11px] text-gray-500">{symbol}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Stat label="Open" value={formatCurrency(open)} />
        <Stat
          label="Previous Close"
          value={formatCurrency(data.previousClose)}
          sub={<span className={dayRangePct >= 0 ? 'text-green-400' : 'text-red-400'}>{dayRangePct >= 0 ? '+' : ''}{dayRangePct.toFixed(2)}%</span>}
        />
        <Stat label="Day Range" value={<span>{formatCurrency(data.low)} – {formatCurrency(data.high)}</span>} />
        <Stat label="Day High" value={formatCurrency(data.high)} />
        <Stat label="Day Low" value={formatCurrency(data.low)} />
        <Stat label="Volume" value={formatLargeNumber(data.volume)} />
      </div>
    </div>
  );
}
