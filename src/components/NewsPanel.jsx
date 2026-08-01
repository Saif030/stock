import { useState, useEffect, useCallback } from 'react';
import { useStock } from '../context/StockContext';
import { fetchNews } from '../api/yahoo';
import { SkeletonText } from './ui/Skeleton';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';
import { IoNewspaper } from 'react-icons/io5';

export default function NewsPanel() {
  const { news, setNews } = useStock();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchNews(8)
      .then(setNews)
      .catch(() => setError('Could not load market news.'))
      .finally(() => setLoading(false));
  }, [setNews]);

  useEffect(() => {
    if (news.length > 0) return;
    load();
  }, [news.length, load]);

  return (
    <section className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
      <h2 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
        <IoNewspaper className="text-purple-400" /> Market News
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 bg-gray-700/30 rounded-lg">
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} compact />
      ) : news.length === 0 ? (
        <EmptyState icon="📰" title="No news available" description="Check back later for the latest market headlines." />
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
          {news.slice(0, 8).map((item, i) => (
            <a
              key={item.id ?? i}
              href={item.link ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-gray-700/30 border border-gray-700/30 rounded-lg hover:bg-gray-700/50 hover:border-gray-600 transition group"
            >
              <p className="text-sm font-medium text-gray-100 line-clamp-2 group-hover:text-white">{item.title}</p>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                {item.publisher && <span className="text-purple-400 font-medium">{item.publisher}</span>}
                {item.pubDate && <span>· {new Date(item.pubDate * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
              </p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
