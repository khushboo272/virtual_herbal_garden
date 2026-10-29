import React from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, Home, BookOpen, LayoutDashboard, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../../contexts/AuthContext';

export interface FeatureDisabledScreenProps {
  featureName?: string;
  reason?: string;
}

export const FeatureDisabledScreen: React.FC<FeatureDisabledScreenProps> = ({
  featureName = 'This Feature',
  reason,
}) => {
  let role = 'GUEST';
  try {
    const auth = useAuth();
    if (auth?.role) role = auth.role;
  } catch {
    // Outside AuthProvider (e.g. isolated test or guest preview)
  }
  const isSuperAdmin = role === 'SUPER_ADMIN';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-stone-50/80 via-white to-emerald-50/30">
      <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200/80 shadow-xl shadow-stone-200/50 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <SlidersHorizontal className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/70 text-amber-800 border border-amber-200/50 mb-3">
          Runtime Feature Flag
        </span>

        <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">
          {featureName} is Temporarily Offline
        </h1>

        <p className="text-sm text-stone-600 leading-relaxed mb-6">
          {reason ||
            `${featureName} has been temporarily disabled by platform administrators. Upgrades, model recalibration, or maintenance may be in progress. Please check back shortly.`}
        </p>

        {isSuperAdmin && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-xs text-emerald-800 flex items-start gap-2.5">
            <Settings className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900">Super Admin Notice</p>
              <p className="mt-0.5">
                You can toggle this flag anytime in the{' '}
                <Link
                  to="/dashboard/system/feature-flags"
                  className="font-semibold underline hover:text-emerald-950"
                >
                  Feature Flags Panel
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Button asChild variant="outline" className="border-stone-200 text-stone-700 hover:bg-stone-50">
            <Link to="/">
              <Home className="w-4 h-4 mr-1.5" />
              Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <Link to="/library">
              <BookOpen className="w-4 h-4 mr-1.5" />
              Herbal Library
            </Link>
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Link to="/dashboard">
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
