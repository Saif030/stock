import { useStock } from '../context/StockContext';
import { IoCheckmarkCircle, IoInformationCircle, IoAlertCircle, IoClose } from 'react-icons/io5';

const ICONS = {
  success: <IoCheckmarkCircle className="text-green-400 shrink-0" size={18} />,
  info: <IoInformationCircle className="text-blue-400 shrink-0" size={18} />,
  error: <IoAlertCircle className="text-red-400 shrink-0" size={18} />,
  warning: <IoAlertCircle className="text-orange-400 shrink-0" size={18} />,
};

const STYLES = {
  success: 'border-green-500/40',
  info: 'border-blue-500/40',
  error: 'border-red-500/40',
  warning: 'border-orange-500/40',
};

export default function Toasts() {
  const { toasts, dismissToast } = useStock();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 bg-gray-800/95 border ${STYLES[t.type] ?? STYLES.info} rounded-xl p-3 shadow-2xl shadow-black/40 backdrop-blur animate-[toast-in_0.2s_ease-out]`}
          role="status"
        >
          {ICONS[t.type] ?? ICONS.info}
          <span className="text-sm text-gray-100 flex-1 leading-snug">{t.message}</span>
          <button onClick={() => dismissToast(t.id)} className="text-gray-400 hover:text-gray-200 p-0.5" aria-label="Dismiss">
            <IoClose size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
