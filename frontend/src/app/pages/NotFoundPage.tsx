import { Link } from 'react-router-dom';
import { Home, BookOpen, Sparkles, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-green-50/40 via-white to-green-50/20">
      <div className="text-center max-w-lg mx-auto bg-white rounded-3xl border border-green-100 p-8 md:p-10 shadow-sm">
        {/* Botanical 404 Emblem */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700 shadow-xs">
          <Sparkles className="w-10 h-10 animate-pulse text-green-600" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
          Error 404 — Page Not Found
        </span>

        <h1 className="text-3xl md:text-4xl font-extrabold text-green-950 mt-4 mb-3 tracking-tight">
          Lost in the Garden?
        </h1>

        <p className="text-sm md:text-base text-gray-600 mb-8 leading-relaxed">
          The pathway or botanical page you are looking for does not exist, has been transplanted, or is currently unavailable.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm transition-all shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>

          <Link
            to="/library"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-green-200 bg-green-50/60 hover:bg-green-100/70 text-green-900 font-semibold text-sm transition-all"
          >
            <BookOpen className="w-4 h-4 text-green-700" />
            <span>Plant Library</span>
          </Link>
        </div>

        <Link
          to="/remedies"
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Explore Traditional Herbal Remedies</span>
        </Link>
      </div>
    </div>
  );
}
