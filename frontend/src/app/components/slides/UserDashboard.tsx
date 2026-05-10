// ──────────────────────────────────────────────────────────
// USER Dashboard — PRD §4.2.2
// ──────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom';
import { BookmarkIcon, Leaf, Sparkles, Flame, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { StatCard } from "../dashboard/StatCard";
import { SkeletonDashboard } from "../dashboard/SkeletonCard";
import { DashboardEmptyState } from "../dashboard/DashboardEmptyState";
import { useUserDashboard } from "../../../hooks/useDashboard";

// ── Curated botanical quotes (PRD §4.2.2 Section 1) ──────
const QUOTES = [
  "The earth laughs in flowers. — Ralph Waldo Emerson",
  "In every walk with nature, one receives far more than one seeks. — John Muir",
  "Study nature, love nature, stay close to nature. It will never fail you. — Frank Lloyd Wright",
  "Nature does not hurry, yet everything is accomplished. — Lao Tzu",
  "The garden suggests there might be a place where we can meet nature halfway. — Michael Pollan",
  "To plant a garden is to believe in tomorrow. — Audrey Hepburn",
  "The best time to plant a tree was 20 years ago. The second best time is now. — Chinese Proverb",
];

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDailyQuote(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

interface UserDashboardProps {
  user: {
    _id: string;
    displayName: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
}

export function UserDashboard({ user }: UserDashboardProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useUserDashboard();
  const firstName = (user.displayName || 'User').split(" ")[0];

  if (isLoading) return <SkeletonDashboard />;

  const stats = data?.stats ?? { bookmarks: 0, gardenPlants: 0, aiScans: 0, streak: 0 };

  return (
    <div className="space-y-8">
      {/* Section 1 — Welcome Header (PRD §4.2.2 Section 1) */}
      <div>
        <h1 className="text-2xl font-bold text-green-900 mb-1">
          {getTimeOfDayGreeting()}, {firstName} 🌿
        </h1>
        <p className="text-green-600 text-sm italic">"{getDailyQuote()}"</p>
      </div>

      {/* Section 2 — Stat Cards Row (PRD §4.2.2 Section 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My Bookmarks"
          value={stats.bookmarks}
          icon={BookmarkIcon}
          color="bg-amber-100 text-amber-700"
          delta={stats.bookmarks > 0 ? `${stats.bookmarks} total` : undefined}
          onClick={() => navigate('/dashboard/bookmarks')}
        />
        <StatCard
          label="Garden Plants"
          value={stats.gardenPlants}
          icon={Leaf}
          color="bg-green-100 text-green-700"
          onClick={() => navigate('/dashboard/garden')}
        />
        <StatCard
          label="AI Scans"
          value={stats.aiScans}
          icon={Sparkles}
          color="bg-purple-100 text-purple-700"
          onClick={() => navigate('/dashboard/scanner')}
        />
        <StatCard
          label="Streak"
          value={stats.streak}
          icon={Flame}
          color="bg-orange-100 text-orange-700"
        />
      </div>

      {/* Section 3 — Two-column layout (PRD §4.2.2 Section 3) */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left column (60%) — My Garden Preview */}
        <Card className="lg:col-span-3 border-2 border-green-200/60 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Leaf className="w-5 h-5 text-green-600" />
              My Garden Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.gardenPlants > 0 ? (
              <div>
                <div className="rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 h-40 flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Leaf className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">{stats.gardenPlants} plants growing</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => navigate('/dashboard/garden')}>
                    Open Full Garden
                  </Button>
                  <Button variant="outline" className="border-green-300 text-green-700 flex-1" onClick={() => navigate('/library')}>
                    Add a Plant
                  </Button>
                </div>
              </div>
            ) : (
              <DashboardEmptyState
                icon={Leaf}
                title="Your garden is empty"
                description="Start building your virtual herbal garden by adding your first plant."
                actionLabel="Plant your first herb →"
                onAction={() => navigate('/library')}
              />
            )}
          </CardContent>
        </Card>

        {/* Right column (40%) — Recent Activity Feed */}
        <Card className="lg:col-span-2 border-2 border-green-200/60 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Clock className="w-5 h-5 text-green-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivity.slice(0, 8).map((activity) => (
                  <div key={activity._id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <ActivityIcon type={activity.activityType} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{formatActivityLabel(activity.activityType)}</p>
                      <p className="text-xs text-gray-400">{formatRelativeTime(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                icon={Clock}
                title="No activity yet"
                description="Your recent actions will appear here as you explore."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 4 — My Bookmarks Carousel (PRD §4.2.2 Section 4) */}
      <Card className="border-2 border-green-200/60 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <BookmarkIcon className="w-5 h-5 text-green-600" />
              My Bookmarks
              <Badge className="bg-green-100 text-green-700 border-green-300 ml-2">{stats.bookmarks}</Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => navigate('/dashboard/bookmarks')}>
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data?.recentBookmarks && data.recentBookmarks.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {data.recentBookmarks.slice(0, 10).map((bk: any) => (
                <div key={bk._id} className="flex-shrink-0 w-36 border-2 border-green-100 rounded-xl p-3 hover:border-green-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="w-full h-20 rounded-lg bg-green-50 mb-2 flex items-center justify-center overflow-hidden">
                    {bk.entityId?.images?.[0]?.url ? (
                      <img src={bk.entityId.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Leaf className="w-6 h-6 text-green-300" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-800 truncate">{bk.entityId?.commonName || 'Plant'}</p>
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              icon={BookmarkIcon}
              title="No bookmarks yet"
              description="Save plants you love for easy access later."
              actionLabel="Explore Plants →"
              onAction={() => navigate('/library')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'BOOKMARK': return <BookmarkIcon className="w-4 h-4 text-amber-600" />;
    case 'DETECTION': return <Sparkles className="w-4 h-4 text-purple-600" />;
    case 'VIEW_PLANT': return <Leaf className="w-4 h-4 text-green-600" />;
    case 'GARDEN_UPDATE': return <Leaf className="w-4 h-4 text-emerald-600" />;
    default: return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

function formatActivityLabel(type: string): string {
  switch (type) {
    case 'BOOKMARK': return 'Bookmarked a plant';
    case 'DETECTION': return 'Used AI Scanner';
    case 'VIEW_PLANT': return 'Viewed a plant';
    case 'GARDEN_UPDATE': return 'Updated garden';
    case 'REVIEW': return 'Left a review';
    default: return 'Activity';
  }
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
