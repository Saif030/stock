import { IoAlertCircle, IoReload } from 'react-icons/io5';

export default function ErrorState({ message = 'Something went wrong', onRetry, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-10'} px-4 border border-dashed border-red-900/60 rounded-xl bg-red-950/20`}>
      <IoAlertCircle className="text-red-400 mb-2" size={compact ? 20 : 28} />
      <p className="text-sm text-red-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-700/50 hover:bg-red-600/30 transition"
        >
          <IoReload /> Retry
        </button>
      )}
    </div>
  );
}
