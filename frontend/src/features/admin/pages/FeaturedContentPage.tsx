import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Leaf,
  FileText,
  Compass,
  Search,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Plus,
  Eye,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Badge } from '../../../app/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../app/components/ui/card';
import { Input } from '../../../app/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../app/components/ui/tabs';
import { getContentList, toggleFeatureContent } from '../api/adminApi';
import { getAdminToursList, updateTour } from '../../tours/api/toursApi';
import type { ContentItem } from '../types/admin.types';
import type { TourAdminListItem } from '../../tours/types/tour.types';
import { toast } from 'sonner';

export function FeaturedContentPage() {
  const [activeTab, setActiveTab] = useState<'plants' | 'remedies' | 'tours'>('plants');

  // Plants state
  const [featuredPlants, setFeaturedPlants] = useState<ContentItem[]>([]);
  const [candidatePlants, setCandidatePlants] = useState<ContentItem[]>([]);
  const [plantSearch, setPlantSearch] = useState('');
  const [loadingPlants, setLoadingPlants] = useState(false);

  // Remedies state
  const [featuredRemedies, setFeaturedRemedies] = useState<ContentItem[]>([]);
  const [candidateRemedies, setCandidateRemedies] = useState<ContentItem[]>([]);
  const [remedySearch, setRemedySearch] = useState('');
  const [loadingRemedies, setLoadingRemedies] = useState(false);

  // Tours state
  const [allTours, setAllTours] = useState<TourAdminListItem[]>([]);
  const [tourSearch, setTourSearch] = useState('');
  const [loadingTours, setLoadingTours] = useState(false);

  // Overall processing state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Load plants
  const loadPlants = async () => {
    try {
      setLoadingPlants(true);
      // Fetch featured plants
      const featRes = await getContentList('plants', { featured: true, limit: 50 });
      setFeaturedPlants(featRes.items);

      // Fetch published candidates for search/picker
      const candRes = await getContentList('plants', {
        status: 'PUBLISHED',
        q: plantSearch.trim(),
        limit: 20,
      });
      // Filter out those already featured
      const featIds = new Set(featRes.items.map((i) => i._id));
      setCandidatePlants(candRes.items.filter((i) => !featIds.has(i._id)));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load plants.');
    } finally {
      setLoadingPlants(false);
    }
  };

  // Load remedies
  const loadRemedies = async () => {
    try {
      setLoadingRemedies(true);
      // Fetch featured remedies
      const featRes = await getContentList('remedies', { featured: true, limit: 50 });
      setFeaturedRemedies(featRes.items);

      // Fetch published candidates for search/picker
      const candRes = await getContentList('remedies', {
        status: 'PUBLISHED',
        q: remedySearch.trim(),
        limit: 20,
      });
      const featIds = new Set(featRes.items.map((i) => i._id));
      setCandidateRemedies(candRes.items.filter((i) => !featIds.has(i._id)));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load remedies.');
    } finally {
      setLoadingRemedies(false);
    }
  };

  // Load tours
  const loadTours = async () => {
    try {
      setLoadingTours(true);
      const list = await getAdminToursList();
      setAllTours(list);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load tours.');
    } finally {
      setLoadingTours(false);
    }
  };

  const loadAll = () => {
    loadPlants();
    loadRemedies();
    loadTours();
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Reload candidates on search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPlants();
    }, 300);
    return () => clearTimeout(timer);
  }, [plantSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRemedies();
    }, 300);
    return () => clearTimeout(timer);
  }, [remedySearch]);

  // Toggle Plant Feature
  const handleTogglePlant = async (plant: ContentItem) => {
    setActionLoadingId(plant._id);
    try {
      await toggleFeatureContent('plants', plant._id);
      toast.success(
        plant.isFeatured
          ? `Removed "${plant.title}" from Featured Plants`
          : `Featured "${plant.title}" on Homepage!`,
      );
      await loadPlants();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update featured plant.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle Remedy Feature
  const handleToggleRemedy = async (remedy: ContentItem) => {
    setActionLoadingId(remedy._id);
    try {
      await toggleFeatureContent('remedies', remedy._id);
      toast.success(
        remedy.isFeatured
          ? `Removed "${remedy.title}" from Featured Remedies`
          : `Featured "${remedy.title}" on Homepage!`,
      );
      await loadRemedies();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update featured remedy.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle Tour Feature
  const handleToggleTour = async (tour: TourAdminListItem) => {
    setActionLoadingId(tour.id);
    try {
      const willFeature = !tour.isFeatured;
      await updateTour(tour.id, { isFeatured: willFeature });
      toast.success(
        willFeature
          ? `Featured tour "${tour.title}" on Homepage!`
          : `Removed "${tour.title}" from Featured Tours`,
      );
      await loadTours();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update featured tour.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter tours
  const featuredTours = allTours.filter((t) => t.isFeatured);
  const candidateTours = allTours.filter(
    (t) =>
      !t.isFeatured &&
      t.isPublished &&
      (!tourSearch.trim() ||
        t.title.toLowerCase().includes(tourSearch.toLowerCase()) ||
        t.slug.toLowerCase().includes(tourSearch.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-amber-500" />
            Featured Content Manager
          </h1>
          <p className="text-slate-600 mt-1">
            Curate and manage highlighted plants, remedies, and guided tours displayed on the homepage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/" target="_blank" rel="noreferrer">
              <Eye className="w-4 h-4 mr-1.5" />
              Preview Homepage
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={loadAll}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          onClick={() => setActiveTab('plants')}
          className={`cursor-pointer transition-all border-2 ${
            activeTab === 'plants' ? 'border-emerald-500 bg-emerald-50/20 shadow-sm' : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Featured Plants</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{featuredPlants.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active on homepage</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Leaf className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('remedies')}
          className={`cursor-pointer transition-all border-2 ${
            activeTab === 'remedies' ? 'border-purple-500 bg-purple-50/20 shadow-sm' : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Featured Remedies</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{featuredRemedies.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active on homepage</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('tours')}
          className={`cursor-pointer transition-all border-2 ${
            activeTab === 'tours' ? 'border-blue-500 bg-blue-50/20 shadow-sm' : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Featured Tours</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{featuredTours.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active on homepage</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
              <Compass className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="plants" className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-emerald-800">
            <Leaf className="w-4 h-4 mr-2" />
            Featured Plants ({featuredPlants.length})
          </TabsTrigger>
          <TabsTrigger value="remedies" className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-purple-800">
            <FileText className="w-4 h-4 mr-2" />
            Featured Remedies ({featuredRemedies.length})
          </TabsTrigger>
          <TabsTrigger value="tours" className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-800">
            <Compass className="w-4 h-4 mr-2" />
            Featured Tours ({featuredTours.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── PLANTS TAB ─── */}
        <TabsContent value="plants" className="space-y-6">
          {/* Active Featured Plants */}
          <Card className="border border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Currently Featured Plants ({featuredPlants.length})
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">These plants appear prominently on the home page showcase.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {loadingPlants && featuredPlants.length === 0 ? (
                <div className="py-8 text-center text-slate-400">Loading featured plants...</div>
              ) : featuredPlants.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Leaf className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-medium text-slate-700">No plants featured yet</p>
                  <p className="text-xs text-slate-500">Pick from the published plants below to feature them on the homepage.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredPlants.map((plant) => (
                    <div
                      key={plant._id}
                      className="border border-emerald-200 rounded-xl p-3 bg-white shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-lg bg-emerald-50 border border-emerald-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {plant.coverImage ? (
                            <img src={plant.coverImage} alt={plant.title} className="w-full h-full object-cover" />
                          ) : (
                            <Leaf className="w-8 h-8 text-emerald-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0 border-amber-200">
                              ★ Featured
                            </Badge>
                            {plant.isPublished && (
                              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0">Published</Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-slate-900 text-sm mt-1 truncate">{plant.title}</h4>
                          {plant.subtitle && (
                            <p className="text-xs italic text-slate-500 truncate">{plant.subtitle}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                        <Link
                          to={`/plant/${plant.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePlant(plant)}
                          disabled={actionLoadingId === plant._id}
                          className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs h-7 px-2.5"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add to Featured Picker */}
          <Card className="border border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Add Plants to Featured</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Search all published plants and click to feature them on the homepage</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                  <Input
                    placeholder="Search plants..."
                    value={plantSearch}
                    onChange={(e) => setPlantSearch(e.target.value)}
                    className="pl-8 text-xs h-9 bg-white"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {candidatePlants.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  {plantSearch ? `No published plants matching "${plantSearch}"` : 'All published plants are already featured or none available.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {candidatePlants.map((plant) => (
                    <div
                      key={plant._id}
                      className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 text-xs truncate">{plant.title}</p>
                        {plant.subtitle && <p className="text-[11px] text-slate-400 italic truncate">{plant.subtitle}</p>}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleTogglePlant(plant)}
                        disabled={actionLoadingId === plant._id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Feature
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── REMEDIES TAB ─── */}
        <TabsContent value="remedies" className="space-y-6">
          {/* Active Featured Remedies */}
          <Card className="border border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Currently Featured Remedies ({featuredRemedies.length})
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">These remedies appear prominently on the home page showcase.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {loadingRemedies && featuredRemedies.length === 0 ? (
                <div className="py-8 text-center text-slate-400">Loading featured remedies...</div>
              ) : featuredRemedies.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-medium text-slate-700">No remedies featured yet</p>
                  <p className="text-xs text-slate-500">Pick from the published remedies below to feature them on the homepage.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredRemedies.map((remedy) => (
                    <div
                      key={remedy._id}
                      className="border border-purple-200 rounded-xl p-3 bg-white shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-lg bg-purple-50 border border-purple-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {remedy.coverImage ? (
                            <img src={remedy.coverImage} alt={remedy.title} className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-8 h-8 text-purple-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0 border-amber-200">
                              ★ Featured
                            </Badge>
                            {remedy.isPublished && (
                              <Badge className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0">Published</Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-slate-900 text-sm mt-1 truncate">{remedy.title}</h4>
                          {remedy.subtitle && (
                            <p className="text-xs text-slate-500 truncate">{remedy.subtitle}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                        <Link
                          to={`/remedies/${remedy.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleRemedy(remedy)}
                          disabled={actionLoadingId === remedy._id}
                          className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs h-7 px-2.5"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add to Featured Picker */}
          <Card className="border border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Add Remedies to Featured</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Search all published remedies and click to feature them on the homepage</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                  <Input
                    placeholder="Search remedies..."
                    value={remedySearch}
                    onChange={(e) => setRemedySearch(e.target.value)}
                    className="pl-8 text-xs h-9 bg-white"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {candidateRemedies.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  {remedySearch ? `No published remedies matching "${remedySearch}"` : 'All published remedies are already featured or none available.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {candidateRemedies.map((remedy) => (
                    <div
                      key={remedy._id}
                      className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 text-xs truncate">{remedy.title}</p>
                        {remedy.subtitle && <p className="text-[11px] text-slate-400 truncate">{remedy.subtitle}</p>}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleToggleRemedy(remedy)}
                        disabled={actionLoadingId === remedy._id}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-2.5 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Feature
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TOURS TAB ─── */}
        <TabsContent value="tours" className="space-y-6">
          {/* Active Featured Tours */}
          <Card className="border border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Currently Featured Tours ({featuredTours.length})
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">These virtual tours appear prominently on the home page showcase.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {loadingTours && featuredTours.length === 0 ? (
                <div className="py-8 text-center text-slate-400">Loading featured tours...</div>
              ) : featuredTours.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Compass className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-medium text-slate-700">No tours featured yet</p>
                  <p className="text-xs text-slate-500">Pick from the published tours below to feature them on the homepage.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredTours.map((tour) => (
                    <div
                      key={tour.id}
                      className="border border-blue-200 rounded-xl p-3 bg-white shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-lg bg-blue-50 border border-blue-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {(tour as any).coverImage || (tour as any).coverImageUrl ? (
                            <img
                              src={(tour as any).coverImage || (tour as any).coverImageUrl}
                              alt={tour.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Compass className="w-8 h-8 text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0 border-amber-200">
                              ★ Featured
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0">
                              {tour.checkpointCount ?? 0} Checkpoints
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-slate-900 text-sm mt-1 truncate">{tour.title}</h4>
                          <p className="text-xs text-slate-500 truncate">/{tour.slug}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                        <Link
                          to={`/virtual-tour/${tour.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleTour(tour)}
                          disabled={actionLoadingId === tour.id}
                          className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs h-7 px-2.5"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add to Featured Picker */}
          <Card className="border border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Add Tours to Featured</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Search published guided tours and click to feature them on the homepage</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                  <Input
                    placeholder="Search tours..."
                    value={tourSearch}
                    onChange={(e) => setTourSearch(e.target.value)}
                    className="pl-8 text-xs h-9 bg-white"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {candidateTours.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  {tourSearch ? `No published tours matching "${tourSearch}"` : 'All published tours are already featured or none available.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {candidateTours.map((tour) => (
                    <div
                      key={tour.id}
                      className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 text-xs truncate">{tour.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">/{tour.slug}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleToggleTour(tour)}
                        disabled={actionLoadingId === tour.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-2.5 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Feature
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
