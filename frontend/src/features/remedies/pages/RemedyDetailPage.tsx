import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Heart,
  Share2,
  Printer,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useRemedy } from '../hooks/useRemedy';
import { useRemedyFavorite, useShare } from '../hooks/useRemedyFavorite';
import { RemedyCard } from '../components/RemedyCard';
import { PlantImage } from '../../library';

export function RemedyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { remedy, relatedRemedies, isLoading, error, reload } = useRemedy(slug || '');

  useDocumentTitle(remedy?.title ? `${remedy.title} | Traditional Herbal Remedy` : 'Traditional Herbal Remedy');

  const { isFavorite, toggle, isAuthenticated } = useRemedyFavorite(remedy?._id || '');
  const { share, copied } = useShare();

  // Local state for preparation step completion checklist
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Reset steps when remedy changes
  useEffect(() => {
    setCompletedSteps({});
  }, [slug]);

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    toggle();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50/30 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-24 mb-6" />
          <div className="h-10 bg-gray-200 rounded w-3/4" />
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-44 bg-gray-200 rounded-2xl w-full mt-6" />
          <div className="h-64 bg-gray-200 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  if (error || !remedy) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md mx-auto bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Remedy Not Found</h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            The traditional remedy you are looking for may have been updated, moved, or is not yet cataloged.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/remedies"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-medium text-sm transition-colors w-full sm:w-auto justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Remedies</span>
            </Link>
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors w-full sm:w-auto justify-center"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const diff = remedy.difficulty || remedy.difficultyLevel || 'EASY';
  const prepTime = remedy.prepTimeMinutes || remedy.preparationTime || 15;
  const usage = remedy.usage || 'INTERNAL';

  const diffColor =
    diff === 'HARD' || diff === 'ADVANCED'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : diff === 'MEDIUM'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const totalSteps = remedy.preparationSteps?.length || 0;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  // Resolve matching plants: combines plants populated array and resolvedPlants
  const allPlants = [...(remedy.plants || []), ...(remedy.resolvedPlants || [])];
  const uniquePlants = Array.from(
    new Map(
      allPlants
        .filter((p) => p && (p.slug || p._id || p.id))
        .map((p) => [p.slug || p._id || p.id, p]),
    ).values(),
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/30 via-white to-green-50/20 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-4xl mx-auto">
        {/* Back navigation & Actions (hidden in print) */}
        <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
          <Link
            to="/remedies"
            className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>All Remedies</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-xs"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-rose-500 stroke-rose-500 text-rose-500' : 'text-gray-500'
                }`}
              />
              <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={() => share(remedy.title, remedy.description)}
              aria-label="Share remedy"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4 text-gray-500" />
              <span>{copied ? 'Copied Link!' : 'Share'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              aria-label="Print remedy"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* ── Remedy Header ────────────────────────────────────────────── */}
        <header className="bg-white rounded-3xl border border-green-100 p-6 md:p-8 shadow-xs mb-8 print:border-none print:shadow-none print:p-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${diffColor}`}>
              {diff}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-green-700" />
              {prepTime} minutes
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-800 uppercase tracking-wider text-[11px]">
              {usage}
            </span>
            {remedy.traditionalSource && (
              <span className="px-3 py-1 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-800 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                Source: {remedy.traditionalSource}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-green-950 tracking-tight mb-3">
            {remedy.title}
          </h1>

          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-3xl">
            {remedy.description}
          </p>

          {remedy.dosage && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs sm:text-sm text-green-900 flex items-center gap-2 font-medium">
              <span className="font-semibold text-gray-500">Traditional Dosage:</span>
              <span>{remedy.dosage}</span>
            </div>
          )}
        </header>

        {/* ── Safety Section (Highlighted near top per PRD/Medical Safety) ── */}
        <section className="bg-amber-50/90 border-2 border-amber-300/80 rounded-3xl p-6 md:p-7 shadow-xs mb-8">
          <div className="flex items-center gap-2.5 text-amber-950 font-bold text-base md:text-lg mb-3">
            <ShieldAlert className="w-6 h-6 text-amber-700" />
            <h2>Important Safety & Precautions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4 text-xs sm:text-sm">
            {/* Precautions */}
            <div>
              <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-amber-700" />
                Precautions:
              </h3>
              {remedy.precautions && remedy.precautions.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 pl-1">
                  {remedy.precautions.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-amber-900/80 italic">Use standard hygienic culinary preparation practices.</p>
              )}
            </div>

            {/* Contraindications */}
            <div>
              <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-700" />
                Contraindications:
              </h3>
              {remedy.contraindications && remedy.contraindications.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 pl-1">
                  {remedy.contraindications.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-amber-900/80 italic">
                  Not recommended during pregnancy without prior medical advice. Consult a doctor if taking prescription medicine.
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-amber-200/80 text-[11px] sm:text-xs text-amber-900/80 leading-relaxed">
            <strong>Medical Disclaimer:</strong> This traditional herbal preparation is documented for cultural and educational purposes only. It is not intended to diagnose, treat, cure, or prevent any illness. Always seek the advice of a qualified healthcare provider.
          </div>
        </section>

        {/* ── Main Content Grid: Ingredients & Preparation ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Ingredients Column */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-green-100 p-6 shadow-xs sticky top-6">
              <h2 className="text-lg font-bold text-green-950 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span>Ingredients</span>
                <span className="text-xs font-normal text-gray-500">
                  {remedy.ingredients?.length || 0} items
                </span>
              </h2>

              <ul className="space-y-3.5">
                {(remedy.ingredients || []).map((ing, idx) => {
                  const ingName = ing.name || ing.notes || `Ingredient ${idx + 1}`;
                  // Match to a plant if one of the uniquePlants matches
                  const matchedPlant = uniquePlants.find((p) => {
                    const cName = p.commonName.toLowerCase();
                    const sName = (p.scientificName || '').toLowerCase();
                    const iName = ingName.toLowerCase();
                    return iName.includes(cName) || cName.includes(iName) || (sName && iName.includes(sName));
                  });

                  return (
                    <li
                      key={idx}
                      className="p-3 rounded-2xl bg-green-50/40 border border-green-100/60 flex items-center justify-between gap-3 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {matchedPlant ? (
                          <Link
                            to={`/plant/${matchedPlant.slug}`}
                            className="flex-shrink-0"
                            title={`View plant details for ${matchedPlant.commonName}`}
                          >
                            <PlantImage
                              src={matchedPlant.image || matchedPlant.images?.[0]?.url}
                              alt={matchedPlant.commonName}
                              heightClass="h-10"
                              className="w-10 rounded-xl object-cover"
                            />
                          </Link>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-green-100/60 flex items-center justify-center text-green-700 flex-shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0">
                          {matchedPlant ? (
                            <Link
                              to={`/plant/${matchedPlant.slug}`}
                              className="font-semibold text-green-900 hover:text-green-700 hover:underline flex items-center gap-1 truncate"
                            >
                              <span>{ingName}</span>
                              <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            </Link>
                          ) : (
                            <span className="font-semibold text-gray-900 truncate block">
                              {ingName}
                            </span>
                          )}
                          {ing.notes && ing.notes !== ingName && (
                            <span className="text-[11px] text-gray-500 block truncate">
                              {ing.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-green-800 text-xs sm:text-sm">
                          {ing.quantity} {ing.unit || ''}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Preparation Steps Column */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-green-100 p-6 md:p-7 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-6 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-green-950">Preparation Steps</h2>
                  <p className="text-xs text-gray-500">Check off steps as you proceed</p>
                </div>

                {totalSteps > 0 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-green-800">
                    <span>{progressPercent}% done</span>
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {(remedy.preparationSteps || []).map((stepObj) => {
                  const isDone = Boolean(completedSteps[stepObj.step]);
                  return (
                    <div
                      key={stepObj.step}
                      onClick={() => toggleStep(stepObj.step)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        isDone
                          ? 'bg-green-50/50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStep(stepObj.step);
                        }}
                        aria-label={`Mark step ${stepObj.step} complete`}
                        className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isDone
                            ? 'bg-green-600 text-white'
                            : 'border-2 border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isDone ? 'text-green-700' : 'text-gray-400'
                            }`}
                          >
                            Step {stepObj.step}
                          </span>
                          {stepObj.durationMinutes && (
                            <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" />
                              {stepObj.durationMinutes} min
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs sm:text-sm leading-relaxed ${
                            isDone ? 'line-through text-gray-400' : 'text-gray-800'
                          }`}
                        >
                          {stepObj.instruction}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Plants Used Cards ────────────────────────────────────────── */}
        {uniquePlants.length > 0 && (
          <section className="bg-white rounded-3xl border border-green-100 p-6 md:p-8 shadow-xs mb-10 print:hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-green-950">Plants Used in This Remedy</h2>
                <p className="text-xs text-gray-500">Explore full botanical monographs and 3D models in our Library</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {uniquePlants.map((plant) => (
                <Link
                  key={plant.slug || plant._id || plant.id}
                  to={`/plant/${plant.slug}`}
                  className="p-3.5 rounded-2xl border border-green-100 hover:border-green-400 hover:shadow-md transition-all flex items-center gap-3 group bg-green-50/20"
                >
                  <PlantImage
                    src={plant.image || plant.images?.[0]?.url}
                    alt={plant.commonName}
                    heightClass="h-14"
                    className="w-14 rounded-xl flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-green-900 group-hover:text-green-700 truncate text-sm">
                      {plant.commonName}
                    </h3>
                    {plant.scientificName && (
                      <p className="text-xs italic text-green-600 truncate">
                        {plant.scientificName}
                      </p>
                    )}
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-1">
                      View Botanical Profile &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Related Remedies (3) ────────────────────────────────────── */}
        {relatedRemedies.length > 0 && (
          <section className="mb-12 print:hidden">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-green-950">Related Traditional Remedies</h2>
                <p className="text-xs text-gray-500">Other botanical preparations sharing ingredients or wellness applications</p>
              </div>
              <Link
                to="/remedies"
                className="text-xs font-semibold text-green-700 hover:text-green-900"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedRemedies.slice(0, 3).map((r) => (
                <RemedyCard key={r._id || r.id || r.slug} remedy={r} compact />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
