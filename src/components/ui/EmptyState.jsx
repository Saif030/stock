export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4 border border-dashed border-gray-700 rounded-xl">
      {icon && <span className="text-3xl mb-2" aria-hidden="true">{icon}</span>}
      {title && <p className="mt-1 text-sm font-medium text-gray-200">{title}</p>}
      {description && <p className="mt-1 text-xs text-gray-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
