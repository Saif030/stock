export default function Panel({ title, icon, action, children, className = '' }) {
  return (
    <section className={`bg-gray-800/60 rounded-xl border border-gray-700/50 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-4 pt-4 pb-1">
          {title && (
            <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              {icon && <span className="shrink-0">{icon}</span>}
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
