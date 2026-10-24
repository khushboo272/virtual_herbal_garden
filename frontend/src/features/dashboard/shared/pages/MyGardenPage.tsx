import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  Sparkles,
  Calendar,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Loader2,
  Cuboid,
  Sprout,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../../../../app/components/ui/card';
import { Button } from '../../../../app/components/ui/button';
import { Badge } from '../../../../app/components/ui/badge';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle';
import {
  getGarden,
  updateGardenPlant,
  removeGardenPlant,
} from '../api/sharedDashboardApi';
import type { IGarden, IGardenPlant } from '../types';

const GROWTH_STAGES: { value: IGardenPlant['growthStage']; label: string; color: string }[] = [
  { value: 'SEED', label: 'Seed', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'SPROUT', label: 'Sprout', color: 'bg-lime-100 text-lime-800 border-lime-300' },
  { value: 'YOUNG', label: 'Young', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'MATURE', label: 'Mature', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'FLOWERING', label: 'Flowering', color: 'bg-purple-100 text-purple-800 border-purple-300' },
];

export function MyGardenPage() {
  useDocumentTitle('My Virtual Garden | Virtual Herbal Garden');

  const [garden, setGarden] = useState<IGarden | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing state for inline notes
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  // Delete confirmation modal state
  const [plantToDelete, setPlantToDelete] = useState<IGardenPlant | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGarden = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGarden();
      setGarden(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load your garden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGarden();
  }, []);

  const handleStageChange = async (plantEntryId: string, stage: IGardenPlant['growthStage']) => {
    try {
      const updatedGarden = await updateGardenPlant(plantEntryId, { growthStage: stage });
      setGarden(updatedGarden);
      toast.success('Growth stage updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update growth stage');
    }
  };

  const handleSaveNotes = async (plantEntryId: string) => {
    try {
      const updatedGarden = await updateGardenPlant(plantEntryId, { notes: noteDraft });
      setGarden(updatedGarden);
      setEditingNoteId(null);
      toast.success('Notes updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update notes');
    }
  };

  const handleConfirmDelete = async () => {
    if (!plantToDelete) return;
    try {
      setDeleting(true);
      const updatedGarden = await removeGardenPlant(plantToDelete._id);
      setGarden(updatedGarden);
      toast.success('Plant removed from garden');
      setPlantToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove plant');
    } finally {
      setDeleting(false);
    }
  };

  const plants = garden?.plants || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Sprout className="w-6 h-6 text-green-700" />
            My Garden
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cultivate and track your personal collection of medicinal flora in 2D and 3D.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
            <Link to="/library">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Plants
            </Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 text-white shadow-sm">
            <Link to="/garden">
              <Cuboid className="w-4 h-4 mr-1.5" />
              Open 3D Garden
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-2" />
          <p className="text-sm">Loading your garden sanctuary...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      ) : plants.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-white">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-100">
              <Leaf className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Your garden is empty</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              Browse our medicinal plant library and click &ldquo;Add to My Garden&rdquo; to begin cultivating your herbal plot.
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild className="bg-green-700 hover:bg-green-800 text-white">
                <Link to="/library">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Explore Plants to Add
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plants.map((entry) => {
            const plant = entry.plant;
            const primaryImage =
              plant.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80';
            const isEditingNotes = editingNoteId === entry._id;
            const stageConfig =
              GROWTH_STAGES.find((s) => s.value === entry.growthStage) || GROWTH_STAGES[0];

            return (
              <Card
                key={entry._id}
                className="overflow-hidden border border-green-100 hover:border-green-300 hover:shadow-md transition-all group bg-white flex flex-col"
              >
                {/* Image and delete button */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={primaryImage}
                    alt={plant.commonName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold backdrop-blur-md bg-white/90 ${stageConfig.color}`}
                    >
                      {stageConfig.label}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlantToDelete(entry)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 text-gray-500 hover:text-red-600 hover:bg-white shadow-xs transition-colors"
                    title="Remove plant from garden"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-green-800 transition-colors text-base">
                          {plant.commonName}
                        </h3>
                        {plant.scientificName && (
                          <p className="text-xs italic text-gray-500 mt-0.5">{plant.scientificName}</p>
                        )}
                      </div>
                      <Link
                        to={`/plant/${plant.slug || plant._id}`}
                        className="text-gray-400 hover:text-green-700 p-1"
                        title="View Plant Library Entry"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Growth stage selector */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Growth Stage</span>
                      <select
                        value={entry.growthStage}
                        onChange={(e) =>
                          handleStageChange(entry._id, e.target.value as IGardenPlant['growthStage'])
                        }
                        className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-gray-700 font-medium focus:outline-none focus:border-green-500"
                      >
                        {GROWTH_STAGES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Inline notes */}
                    <div className="mt-3">
                      {isEditingNotes ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="Add cultivation or observation notes..."
                            rows={2}
                            className="w-full text-xs p-2 border border-green-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingNoteId(null)}
                              className="h-7 text-xs text-gray-500"
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveNotes(entry._id)}
                              className="h-7 text-xs bg-green-700 hover:bg-green-800 text-white"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {entry.notes ? (
                              <span>&ldquo;{entry.notes}&rdquo;</span>
                            ) : (
                              <span className="italic text-gray-400">No notes yet.</span>
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(entry._id);
                              setNoteDraft(entry.notes || '');
                            }}
                            className="text-gray-400 hover:text-green-700 p-0.5 shrink-0"
                            title="Edit notes"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Planted {new Date(entry.plantedAt).toLocaleDateString()}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      pos: [{entry.position.x}, {entry.position.z}]
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {plantToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Remove from Garden?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to remove &ldquo;{plantToDelete.plant.commonName}&rdquo; from your garden plot? Your cultivation notes will be deleted.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setPlantToDelete(null)}
                className="flex-1 border-gray-300"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={deleting}
              >
                {deleting ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
