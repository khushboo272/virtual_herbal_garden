// ──────────────────────────────────────────────────────────
// Stub pages for admin dashboard routes
// Each page is a properly-titled, self-contained component
// ──────────────────────────────────────────────────────────

import { Sparkles, Users, Star, Map, BarChart3, BookmarkIcon, Leaf, Settings, HelpCircle, Wrench, Shield, ScrollText, Cpu, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { useAuth } from '../../../../contexts/AuthContext';
import { useAdminDashboard } from '../../../../hooks/useDashboard';

// ── AI Scanner Stats — /dashboard/analytics/scanner ──────
export function AIScannerStatsPage() {
  const { data: dashData } = useAdminDashboard();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">AI Scanner Statistics</h1>
        <p className="text-green-600 mt-1">Monitor AI plant identification usage</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-2 border-purple-200 bg-white">
          <CardContent className="pt-6">
            <Sparkles className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-3xl font-bold text-purple-900">{dashData?.stats?.aiScansToday ?? 0}</p>
            <p className="text-sm text-purple-600">Scans Today</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-purple-200 bg-white">
          <CardContent className="pt-6">
            <Sparkles className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-3xl font-bold text-purple-900">89%</p>
            <p className="text-sm text-purple-600">Accuracy Rate</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-purple-200 bg-white">
          <CardContent className="pt-6">
            <Sparkles className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-3xl font-bold text-purple-900">1.2s</p>
            <p className="text-sm text-purple-600">Avg Response Time</p>
          </CardContent>
        </Card>
      </div>
      <Card className="border-2 border-green-200 bg-white">
        <CardHeader><CardTitle className="text-green-900">Recent Scans</CardTitle></CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">Scan history will be displayed here once the AI scanner module is fully integrated.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── User Growth — /dashboard/analytics/users ─────────────
export function UserGrowthPage() {
  const { data: dashData } = useAdminDashboard();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">User Growth</h1>
        <p className="text-green-600 mt-1">User registration and activity trends</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-2 border-blue-200 bg-white">
          <CardContent className="pt-6">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-blue-900">{dashData?.stats?.totalUsers ?? 0}</p>
            <p className="text-sm text-blue-600">Total Users</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-white">
          <CardContent className="pt-6">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-blue-900">{dashData?.deltas?.newUsersThisWeek ?? 0}</p>
            <p className="text-sm text-blue-600">New This Week</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-white">
          <CardContent className="pt-6">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-blue-900">{dashData?.stats?.activeToday ?? 0}</p>
            <p className="text-sm text-blue-600">Active Today</p>
          </CardContent>
        </Card>
      </div>
      <Card className="border-2 border-green-200 bg-white">
        <CardHeader><CardTitle className="text-green-900">Growth Chart</CardTitle></CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">User growth chart visualization will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Featured Content — /dashboard/featured ────────────────
export function FeaturedContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Featured Content</h1>
        <p className="text-green-600 mt-1">Manage featured plants, remedies, and tours on the homepage</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {['Featured Plants', 'Featured Remedies', 'Featured Tours'].map((section) => (
          <Card key={section} className="border-2 border-green-200 bg-white">
            <CardHeader>
              <CardTitle className="text-green-900 text-lg">{section}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm mb-4">Drag and drop items to set the featured order.</p>
              <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                <Star className="w-4 h-4 mr-2" />
                Manage {section}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Create Tour — /dashboard/tours/manage/new ────────────
export function CreateTourPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Create New Tour</h1>
        <p className="text-green-600 mt-1">Design a new guided virtual tour through the garden</p>
      </div>
      <Card className="border-2 border-green-200 bg-white">
        <CardHeader><CardTitle className="text-green-900">Tour Builder</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-500">The tour builder interface will allow you to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Set a tour name and description</li>
            <li>Add stops at specific plants in the garden</li>
            <li>Write narration text for each stop</li>
            <li>Set camera angles and transitions</li>
            <li>Preview the tour before publishing</li>
          </ul>
          <Button className="bg-green-600 hover:bg-green-700 mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Start Building
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tour Analytics — /dashboard/tours/analytics ──────────
export function TourAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Tour Analytics</h1>
        <p className="text-green-600 mt-1">View engagement metrics for guided tours</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-2 border-teal-200 bg-white">
          <CardContent className="pt-6">
            <Map className="w-8 h-8 text-teal-600 mb-2" />
            <p className="text-3xl font-bold text-teal-900">3</p>
            <p className="text-sm text-teal-600">Published Tours</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-teal-200 bg-white">
          <CardContent className="pt-6">
            <BarChart3 className="w-8 h-8 text-teal-600 mb-2" />
            <p className="text-3xl font-bold text-teal-900">557</p>
            <p className="text-sm text-teal-600">Total Views</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-teal-200 bg-white">
          <CardContent className="pt-6">
            <Map className="w-8 h-8 text-teal-600 mb-2" />
            <p className="text-3xl font-bold text-teal-900">72%</p>
            <p className="text-sm text-teal-600">Completion Rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Bookmarks — /dashboard/bookmarks ─────────────────────
export function BookmarksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Bookmarks</h1>
        <p className="text-green-600 mt-1">Your saved plants and remedies</p>
      </div>
      <Card className="border-2 border-green-200 bg-white">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BookmarkIcon className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-green-700 font-medium">No bookmarks yet</p>
            <p className="text-sm text-gray-500 mt-1">Browse plants in the library to start bookmarking.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── My Garden — /dashboard/garden ────────────────────────
export function MyGardenPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">My Garden</h1>
        <p className="text-green-600 mt-1">Manage your personalized herb collection</p>
      </div>
      <Card className="border-2 border-green-200 bg-white">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Leaf className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-green-700 font-medium">Your Garden</p>
            <p className="text-sm text-gray-500 mt-1">Visit the 3D Garden to plant and manage your herbs.</p>
            <Button className="bg-green-600 hover:bg-green-700 mt-4" asChild>
              <a href="/garden-3d">Open 3D Garden</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── AI Scanner — /dashboard/scanner ──────────────────────
export function AIScannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">AI Plant Scanner</h1>
        <p className="text-green-600 mt-1">Identify plants using AI-powered image recognition</p>
      </div>
      <Card className="border-2 border-purple-200 bg-white">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-3" />
            <p className="text-purple-700 font-medium">AI Scanner</p>
            <p className="text-sm text-gray-500 mt-1">Upload a photo or use your camera to identify medicinal plants.</p>
            <Button className="bg-purple-600 hover:bg-purple-700 mt-4" asChild>
              <a href="/ai-detect">Open Scanner</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Profile & Settings — /dashboard/profile ──────────────
export function ProfileSettingsPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Settings & Profile</h1>
        <p className="text-green-600 mt-1">Manage your account settings</p>
      </div>
      <Card className="border-2 border-green-200 bg-white">
        <CardHeader><CardTitle className="text-green-900">Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Display Name</p>
              <p className="text-green-900 font-medium">{user?.displayName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-green-900 font-medium">{user?.email || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <Badge className="bg-green-100 text-green-700">{user?.role || 'USER'}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="text-green-900 font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Help & Support — /dashboard/help ─────────────────────
export function HelpSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Help & Support</h1>
        <p className="text-green-600 mt-1">Get help with the Virtual Herbal Garden platform</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-2 border-green-200 bg-white">
          <CardHeader><CardTitle className="text-green-900">FAQ</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                'How do I add plants to my garden?',
                'How does the AI scanner work?',
                'How do I take a guided tour?',
                'How do I bookmark plants?',
              ].map((q) => (
                <li key={q} className="p-3 bg-green-50 rounded-lg text-sm text-green-800 hover:bg-green-100 cursor-pointer transition-colors">
                  {q}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-white">
          <CardHeader><CardTitle className="text-green-900">Contact</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm">Need more help? Reach out to our support team.</p>
            <Button className="bg-green-600 hover:bg-green-700 mt-4">
              <HelpCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Guided Tours (User) — /dashboard/tours ───────────────
export function GuidedToursPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Guided Tours</h1>
        <p className="text-green-600 mt-1">Explore curated virtual tours through the garden</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { name: 'Ayurvedic Essentials', desc: 'Explore the core herbs of Ayurveda', stops: 8 },
          { name: 'Kitchen Garden Herbs', desc: 'Common herbs you can grow at home', stops: 6 },
          { name: 'Immunity Boosters', desc: 'Plants known for immune system support', stops: 5 },
        ].map((tour) => (
          <Card key={tour.name} className="border-2 border-green-200 bg-white hover:border-green-400 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <Map className="w-8 h-8 text-teal-600 mb-3" />
              <h3 className="font-semibold text-green-900">{tour.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{tour.desc}</p>
              <Badge className="mt-3 bg-teal-100 text-teal-700">{tour.stops} stops</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
