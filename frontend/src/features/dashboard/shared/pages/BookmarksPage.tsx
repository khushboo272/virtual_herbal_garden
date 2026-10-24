import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Leaf,
  Sparkles,
  Compass,
  Trash2,
  ExternalLink,
  Loader2,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../../../../app/components/ui/card';
import { Button } from '../../../../app/components/ui/button';
import { Badge } from '../../../../app/components/ui/badge';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle';
import {
  getBookmarks,
  removeBookmark,
  addBookmark,
} from '../api/sharedDashboardApi';
import type { IBookmark } from '../types';

type FilterType = 'ALL' | 'PLANT' | 'REMEDY' | 'TOUR';

export function BookmarksPage() {
  useDocumentTitle('My Bookmarks | Virtual Herbal Garden');

  const [filter, setFilter] = useState<FilterType>('ALL');
  const [bookmarks, setBookmarks] = useState<IBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = async (type: FilterType) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getBookmarks(type === 'ALL' ? undefined : type);
      setBookmarks(res.bookmarks || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(filter);
  }, [filter]);

  const handleRemove = async (bm: IBookmark) => {
    const originalList = [...bookmarks];
    // Optimistic removal
    setBookmarks((prev) => prev.filter((b) => b._id !== bm._id));

    try {
      await removeBookmark(bm._id);
      toast.success('Bookmark removed', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              const restored = await addBookmark(bm.entityType, bm.entityId);
              setBookmarks((prev) => [
                { ...bm, _id: restored._id || bm._id },
                ...prev,
              ]);
              toast.success('Bookmark restored');
            } catch {
              toast.error('Failed to restore bookmark');
              setBookmarks(originalList);
            }
          },
        },
      });
    } catch (err: any) {
      setBookmarks(originalList);
      toast.error(err?.message || 'Failed to remove bookmark');
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PLANT':
        return <Leaf className="w-3.5 h-3.5 text-emerald-600" />;
      case 'REMEDY':
        return <Sparkles className="w-3.5 h-3.5 text-purple-600" />;
      case 'TOUR':
        return <Compass className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Bookmark className="w-3.5 h-3.5 text-gray-600" />;
    }
  };

  const getEntityBadgeStyle = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PLANT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REMEDY':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'TOUR':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDetailUrl = (bm: IBookmark) => {
    const slugOrId = bm.item?.slug || bm.entityId;
    switch (bm.entityType.toUpperCase()) {
      case 'PLANT':
        return `/plant/${slugOrId}`;
      case 'REMEDY':
        return `/remedies/${slugOrId}`;
      case 'TOUR':
        return `/virtual-tour/${slugOrId}`;
      default:
        return '#';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-green-700" />
            My Bookmarks
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Access your saved medicinal plants, traditional remedies, and guided tours.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-green-200 rounded-xl shadow-xs self-start sm:self-auto">
          {(['ALL', 'PLANT', 'REMEDY', 'TOUR'] as FilterType[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === tab
                  ? 'bg-green-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase() + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-2" />
          <p className="text-sm">Loading bookmarks...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      ) : bookmarks.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-white">
          <CardContent className="py-16 text-center">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              No bookmarks in {filter === 'ALL' ? 'your list' : filter.toLowerCase() + 's'}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
              Explore the library or remedy collections and click the bookmark icon to save items here.
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                <Link to="/library">Explore Plants</Link>
              </Button>
              <Button asChild className="bg-green-700 hover:bg-green-800 text-white">
                <Link to="/remedies">Explore Remedies</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {bookmarks.map((bm) => {
            const detailUrl = getDetailUrl(bm);
            const title = bm.item?.title || 'Saved Item';
            const subtitle = bm.item?.subtitle;
            const image =
              bm.item?.image ||
              'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80';

            return (
              <Card
                key={bm._id}
                className="overflow-hidden border border-green-100 hover:border-green-300 hover:shadow-md transition-all group bg-white flex flex-col"
              >
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium flex items-center gap-1 backdrop-blur-md bg-white/90 ${getEntityBadgeStyle(
                        bm.entityType,
                      )}`}
                    >
                      {getEntityIcon(bm.entityType)}
                      {bm.entityType}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(bm)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 text-gray-500 hover:text-red-600 hover:bg-white shadow-xs transition-colors"
                    title="Remove bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-800 transition-colors line-clamp-1 text-base">
                      {title}
                    </h3>
                    {subtitle && (
                      <p className="text-xs text-gray-500 italic mt-0.5 line-clamp-1">{subtitle}</p>
                    )}
                    {bm.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md mt-2 line-clamp-2">
                        &ldquo;{bm.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      Saved {new Date(bm.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      to={detailUrl}
                      className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800 group-hover:translate-x-0.5 transition-transform"
                    >
                      View Details
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
