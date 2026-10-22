import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search, Leaf, Sparkles, Shield, Heart, Wind, Zap, Moon, Flower2,
  Activity, Thermometer, RefreshCw, AlertCircle, Scan, TreePine,
  ChevronRight, BookOpen, Beaker, ArrowRight, Clock, Star,
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Badge } from '../../../app/components/ui/badge';
import { Card, CardContent } from '../../../app/components/ui/card';
import { useAuth } from '../../../contexts/AuthContext';
import { PlantImage } from '../../library/components/PlantImage';
import { getAutocomplete } from '../../library/api/libraryApi';
import { getHistory } from '../../ai-scanner/api/scannerApi';
import { getBookmarks } from '../../library/api/libraryApi';
import type { AutocompleteResult } from '../../library/types/library.types';
import { useHome } from '../hooks/useHome';
import type { HomePlant, HomeCategory, FeaturedRemedy, FeaturedTour, PopularSearch } from '../types/home.types';

// ── Icon lookup ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield, Leaf, Sparkles, Heart, Wind, Zap, Moon, Flower2, Activity, Thermometer,
};

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Leaf;
  return <Icon className={className} />;
}

// ── Section skeleton ──────────────────────────────────────────────────────────

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-48 bg-green-100 rounded-2xl" />
      ))}
    </div>
  );
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      <Button variant="outline" size="sm" onClick={onRetry} className="border-red-300 text-red-700 hover:bg-red-50">
        <RefreshCw className="w-3 h-3 mr-1" />
        Retry
      </Button>
    </div>
  );
}

// ── Hero search bar ───────────────────────────────────────────────────────────

function HeroSearch({ popularSearches }: { popularSearches: PopularSearch[] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = 'hero-search-listbox';

  // Debounce autocomplete fetches manually with a timer ref
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      getAutocomplete(trimmed, controller.signal)
        .then((results) => {
          setSuggestions(results);
          setOpen(results.length > 0);
          setActiveIndex(-1);
        })
        .catch(() => { /* silently ignore aborts */ });
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function handleSubmit() {
    const q = query.trim();
    if (!q) { navigate('/library'); return; }
    setOpen(false);
    navigate(`/library?q=${encodeURIComponent(q)}&open=1`);
  }

  function selectSuggestion(s: AutocompleteResult) {
    setQuery(s.commonName);
    setOpen(false);
    navigate(`/plant/${s.slug}`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'Enter') handleSubmit();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) { selectSuggestion(suggestions[activeIndex]); }
      else { handleSubmit(); }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="space-y-3">
      {/* ARIA combobox wrapper */}
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-owns={listId}
        className="relative"
      >
        <div className="flex gap-2 p-2 bg-white rounded-xl shadow-lg border border-green-200 focus-within:border-green-400 transition-colors">
          <Search className="w-5 h-5 text-green-600 ml-2 mt-2.5 flex-shrink-0" aria-hidden />
          <input
            ref={inputRef}
            id="hero-search-input"
            type="text"
            role="searchbox"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-activedescendant={activeIndex >= 0 ? `hero-suggestion-${activeIndex}` : undefined}
            placeholder="Search for medicinal plants..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            className="flex-1 bg-transparent border-0 outline-none text-base text-green-900 placeholder:text-green-400"
          />
          <Button
            id="hero-search-btn"
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-5"
          >
            Search
          </Button>
        </div>

        {/* Suggestions dropdown */}
        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-label="Plant suggestions"
            className="absolute z-50 w-full mt-1 bg-white border border-green-200 rounded-xl shadow-xl overflow-hidden"
          >
            {suggestions.map((s, i) => (
              <li
                key={s.slug}
                id={`hero-suggestion-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => selectSuggestion(s)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  i === activeIndex ? 'bg-green-50' : 'hover:bg-green-50'
                }`}
              >
                <Leaf className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">{s.commonName}</p>
                  {s.scientificName && (
                    <p className="text-xs italic text-green-500">{s.scientificName}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Popular search chips */}
      {popularSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-green-600 font-medium">Popular:</span>
          {popularSearches.map((ps) => (
            <button
              key={ps.query}
              onClick={() => navigate(`/library?q=${encodeURIComponent(ps.query)}`)}
              className="text-xs px-3 py-1 bg-white/70 border border-green-200 rounded-full text-green-700 hover:bg-green-100 hover:border-green-400 transition-colors"
            >
              {ps.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Plant card for home sections ──────────────────────────────────────────────

function HomePlantCard({ plant }: { plant: HomePlant }) {
  return (
    <Link to={`/plant/${plant.slug}`} className="no-underline group">
      <Card className="overflow-hidden border-2 border-green-100 hover:border-green-300 hover:shadow-xl transition-all h-full">
        <PlantImage src={plant.image || null} alt={plant.commonName} heightClass="h-44" />
        <CardContent className="p-4">
          <h3 className="font-semibold text-green-900 mb-0.5 group-hover:text-green-700 transition-colors line-clamp-1">
            {plant.commonName}
          </h3>
          <p className="text-xs italic text-green-500 mb-3 line-clamp-1">{plant.scientificName}</p>
          {plant.tags.length > 0 && (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              {plant.tags[0]}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Category card ─────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  immunity: 'bg-emerald-100 text-emerald-700',
  digestion: 'bg-green-100 text-green-700',
  'skin-care': 'bg-teal-100 text-teal-700',
  respiratory: 'bg-sky-100 text-sky-700',
  'pain-relief': 'bg-orange-100 text-orange-700',
  'stress-sleep': 'bg-purple-100 text-purple-700',
  'heart-health': 'bg-rose-100 text-rose-700',
  'womens-health': 'bg-pink-100 text-pink-700',
  'blood-sugar': 'bg-amber-100 text-amber-700',
  fever: 'bg-red-100 text-red-700',
};

function CategoryCard({ cat }: { cat: HomeCategory }) {
  const colorClass = CAT_COLORS[cat.slug] ?? 'bg-green-100 text-green-700';
  return (
    <Link to={`/library?health=${cat.slug}`} className="no-underline group">
      <Card className="group hover:shadow-xl transition-all cursor-pointer border-2 border-green-100 hover:border-green-300 bg-white h-full">
        <CardContent className="p-6">
          <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <CategoryIcon name={cat.icon} className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-1">{cat.label}</h3>
          <p className="text-sm text-green-600">
            {cat.plantCount} {cat.plantCount === 1 ? 'plant' : 'plants'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Remedy mini card ──────────────────────────────────────────────────────────

function RemedyCard({ remedy }: { remedy: FeaturedRemedy }) {
  return (
    <Link to={remedy.slug ? `/remedies/${remedy.slug}` : '/remedies'} className="no-underline group">
      <Card className="border-2 border-green-100 hover:border-green-300 hover:shadow-lg transition-all">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Beaker className="w-4 h-4 text-green-600" />
            {remedy.difficultyLevel && (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                {remedy.difficultyLevel}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-green-900 mb-1 line-clamp-2 group-hover:text-green-700 transition-colors">
            {remedy.title}
          </h3>
          {remedy.description && (
            <p className="text-xs text-green-600 line-clamp-2">{remedy.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Tour mini card ────────────────────────────────────────────────────────────

function TourCard({ tour }: { tour: FeaturedTour }) {
  return (
    <Link to={tour.slug ? `/virtual-tour/${tour.slug}` : '/virtual-tour'} className="no-underline group">
      <Card className="border-2 border-green-100 hover:border-green-300 hover:shadow-lg transition-all">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <TreePine className="w-4 h-4 text-green-600" />
            {tour.estimatedDuration && (
              <span className="text-xs text-green-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {tour.estimatedDuration} min
              </span>
            )}
          </div>
          <h3 className="font-semibold text-green-900 mb-1 line-clamp-2 group-hover:text-green-700 transition-colors">
            {tour.title}
          </h3>
          {tour.description && (
            <p className="text-xs text-green-600 line-clamp-2">{tour.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// ── "For You" section ─────────────────────────────────────────────────────────

function ForYouSection() {
  const { isAuthenticated, hasMinRole, user } = useAuth();
  const navigate = useNavigate();
  const [recentScans, setRecentScans] = useState<{ id: string; name: string; imageUrl?: string }[]>([]);
  const [recentFavorites, setRecentFavorites] = useState<{ _id: string; entityId: string }[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getHistory().then((history) => {
      const complete = history
        .filter((h) => (h as { status?: string }).status === 'COMPLETE' || h.topMatch)
        .slice(0, 3)
        .map((h) => ({ id: h.id, name: h.topMatch?.commonName ?? 'Unknown', imageUrl: h.imageUrl }));
      setRecentScans(complete);
    }).catch(() => {});
    getBookmarks().then((bm) => setRecentFavorites(bm.slice(0, 3))).catch(() => {});
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-10">
        <Card className="bg-gradient-to-r from-green-600 to-emerald-700 border-0 text-white overflow-hidden">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Join the community</h2>
              <p className="text-green-100">
                Create an account to save favorites, track your scans, and explore your personal garden.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Button
                id="home-login-btn"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-green-700"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button
                id="home-register-btn"
                className="bg-white text-green-700 hover:bg-green-50"
                onClick={() => navigate('/register')}
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-bold text-green-900 mb-6">
        Welcome back, {user?.displayName ?? 'there'} 👋
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Scans */}
        <Card className="border-2 border-green-100">
          <CardContent className="p-5">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Scan className="w-4 h-4 text-green-600" />
              Recent Scans
            </h3>
            {recentScans.length === 0 ? (
              <p className="text-sm text-green-500 mb-3">Scan your first plant to see it here.</p>
            ) : (
              <ul className="space-y-2 mb-3">
                {recentScans.map((s) => (
                  <li key={s.id} className="text-sm text-green-800 flex items-center gap-2">
                    <Leaf className="w-3 h-3 text-green-400 flex-shrink-0" />
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
            <Link to="/ai-detect" className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-1">
              Go to Scanner <ChevronRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Favorites */}
        <Card className="border-2 border-green-100">
          <CardContent className="p-5">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Saved Plants
            </h3>
            {recentFavorites.length === 0 ? (
              <p className="text-sm text-green-500 mb-3">Browse the library and save plants you love.</p>
            ) : (
              <ul className="space-y-2 mb-3">
                {recentFavorites.map((fav) => (
                  <li key={fav._id} className="text-sm text-green-800 flex items-center gap-2">
                    <Leaf className="w-3 h-3 text-green-400 flex-shrink-0" />
                    {fav.entityId}
                  </li>
                ))}
              </ul>
            )}
            <Link to="/library" className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-1">
              Browse Library <ChevronRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Role-aware quick actions */}
        <Card className="border-2 border-green-100">
          <CardContent className="p-5">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Quick Actions
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/users/me/garden" className="text-sm text-green-700 hover:text-green-900 flex items-center gap-2 group">
                  <TreePine className="w-4 h-4 text-green-500" />
                  My Garden
                  <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              {hasMinRole('BOTANIST') && (
                <li>
                  <Link to="/dashboard/contributions" className="text-sm text-green-700 hover:text-green-900 flex items-center gap-2 group">
                    <Leaf className="w-4 h-4 text-green-500" />
                    Contribute a Plant
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              )}
              {hasMinRole('ADMIN') && (
                <li>
                  <Link to="/dashboard/moderation" className="text-sm text-green-700 hover:text-green-900 flex items-center gap-2 group">
                    <BookOpen className="w-4 h-4 text-green-500" />
                    Moderation Queue
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              )}
              {hasMinRole('SUPER_ADMIN') && (
                <li>
                  <Link to="/dashboard/system" className="text-sm text-green-700 hover:text-green-900 flex items-center gap-2 group">
                    <Activity className="w-4 h-4 text-green-500" />
                    System
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// ── Main HomePage ─────────────────────────────────────────────────────────────

export function HomePage() {
  const { data, isLoading, error, reload } = useHome();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Sections that failed independently show inline errors, not blanking the page
  const stats = data?.stats;
  const categories = data?.categories ?? [];
  const featuredPlants = data?.featuredPlants ?? [];
  const recentPlants = data?.recentPlants ?? [];
  const plantOfTheDay = data?.plantOfTheDay ?? null;
  const featuredRemedies = data?.featuredRemedies ?? [];
  const featuredTours = data?.featuredTours ?? [];
  const popularSearches = data?.popularSearches ?? [];

  // Handle the /ai-detect navigation: guests get redirected to login
  const handleScanClick = useCallback(() => {
    if (isAuthenticated) {
      navigate('/ai-detect');
    } else {
      navigate('/login?next=/ai-detect');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-emerald-50/30">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-300 text-sm px-4 py-1">
                {isLoading ? 'Loading...' : `Explore ${stats?.plants ?? '?'} Medicinal Plants`}
              </Badge>
              <h1 className="text-5xl font-bold text-green-900 leading-tight">
                Discover the Healing Power of Nature
              </h1>
              <p className="text-lg text-green-700">
                Learn about medicinal plants through interactive 3D models, virtual tours,
                and comprehensive botanical information.
              </p>

              {/* Search */}
              <HeroSearch popularSearches={popularSearches} />

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  id="hero-explore-library-btn"
                  asChild
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Link to="/library">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Explore Library
                  </Link>
                </Button>
                <Button
                  id="hero-scan-plant-btn"
                  variant="outline"
                  onClick={handleScanClick}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Scan a Plant
                </Button>
                <Button
                  id="hero-3d-garden-btn"
                  variant="outline"
                  asChild
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Link to="/garden-3d">
                    <TreePine className="w-4 h-4 mr-2" />
                    3D Garden
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Plant of the day image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <PlantImage
                  src={plantOfTheDay?.image ?? null}
                  alt={plantOfTheDay?.commonName ?? 'Plant of the day'}
                  heightClass="h-[400px]"
                />
                {plantOfTheDay && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-900/80 to-transparent p-6">
                    <Link
                      to={`/plant/${plantOfTheDay.slug}`}
                      className="text-white hover:underline"
                    >
                      <p className="text-green-200 text-xs mb-1">Plant of the day</p>
                      <p className="text-white font-semibold text-lg leading-tight">
                        {plantOfTheDay.commonName}
                      </p>
                      <p className="text-green-200 text-xs italic">{plantOfTheDay.scientificName}</p>
                    </Link>
                  </div>
                )}
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-200 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-emerald-200 rounded-full blur-3xl opacity-50" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      {stats && (
        <section className="bg-white border-y border-green-100">
          <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Plants', value: stats.plants, icon: Leaf },
              { label: 'Remedies', value: stats.remedies, icon: Beaker },
              { label: 'Tours', value: stats.tours, icon: TreePine },
              { label: 'Categories', value: stats.categories, icon: Sparkles },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-900">{value}</span>
                <span className="text-sm text-green-600">{label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Browse by Category ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-green-900 mb-2">Browse by Category</h2>
            <p className="text-green-600">Explore plants based on their medicinal properties</p>
          </div>
          <Link to="/library" className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 font-medium">
            View all in library <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <SectionSkeleton rows={4} />
        ) : error ? (
          <SectionError message="Could not load categories." onRetry={reload} />
        ) : categories.length === 0 ? null : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.slice(0, 8).map((cat) => (
              <CategoryCard key={cat.slug} cat={cat} />
            ))}
          </div>
        )}
      </section>

      {/* ── Featured Plants ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-green-900 mb-2">Featured Medicinal Plants</h2>
            <p className="text-green-600">Popular and widely studied herbal remedies</p>
          </div>
          <Link to="/library" className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 font-medium">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <SectionSkeleton rows={3} />
        ) : error ? (
          <SectionError message="Could not load featured plants." onRetry={reload} />
        ) : featuredPlants.length === 0 ? null : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPlants.slice(0, 6).map((plant) => (
              <HomePlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}
      </section>

      {/* ── Recently Added ────────────────────────────────────────────────── */}
      {recentPlants.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-green-900 mb-2">Recently Added</h2>
              <p className="text-green-600">New additions to our growing collection</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentPlants.map((plant) => (
              <HomePlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        </section>
      )}

      {/* ── AI Scanner Banner ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-green-700 to-emerald-800 p-10 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-green-300" />
                <span className="text-green-200 text-sm font-medium">AI-Powered</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Identify a Plant with AI</h2>
              <p className="text-green-100 max-w-md">
                Upload a photo of any plant and our AI will identify it with medicinal information in seconds.
              </p>
              <p className="text-green-300 text-xs mt-2">
                ⚠ AI results can be wrong. Always confirm with an expert before using any plant medicinally.
              </p>
            </div>
            <Button
              id="banner-scan-btn"
              onClick={handleScanClick}
              className="bg-white text-green-700 hover:bg-green-50 flex-shrink-0 text-base px-8 py-6"
            >
              <Scan className="w-5 h-5 mr-2" />
              Scan a Plant
            </Button>
          </div>
        </div>
      </section>

      {/* ── Featured Remedies ─────────────────────────────────────────────── */}
      {featuredRemedies.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-green-900 mb-2">Featured Remedies</h2>
              <p className="text-green-600">Traditional herbal preparations</p>
            </div>
            <Link to="/remedies" className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 font-medium">
              All Remedies <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredRemedies.map((r, i) => (
              <RemedyCard key={r._id ?? i} remedy={r} />
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Tours ────────────────────────────────────────────────── */}
      {featuredTours.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-green-900 mb-2">Virtual Tours</h2>
              <p className="text-green-600">Guided journeys through botanical collections</p>
            </div>
            <Link to="/virtual-tour" className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 font-medium">
              All Tours <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTours.map((t, i) => (
              <TourCard key={t._id ?? i} tour={t} />
            ))}
          </div>
        </section>
      )}

      {/* ── For You ───────────────────────────────────────────────────────── */}
      <ForYouSection />

      {/* ── Footer disclaimer ─────────────────────────────────────────────── */}
      <footer className="border-t border-green-100 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-sm text-green-500">
            Content on this site is educational and not medical advice.
            Always consult a qualified healthcare professional before using any plant medicinally.
          </p>
        </div>
      </footer>
    </div>
  );
}
