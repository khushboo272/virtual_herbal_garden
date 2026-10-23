import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Utensils,
  Moon,
  Sparkles,
  Wind,
  Activity,
  Heart,
  Leaf,
} from 'lucide-react';

export interface ThemedImageProps {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  category?: string;
  title?: string;
  className?: string;
  heightClass?: string;
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  objectFit?: 'cover' | 'contain';
}

interface CategoryTheme {
  gradient: string;
  border: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
  badgeBg: string;
  Icon: typeof Leaf;
  label: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  immunity: {
    gradient: 'from-emerald-900/90 via-teal-900/80 to-amber-950/80',
    border: 'border-emerald-300/30',
    iconBg: 'bg-emerald-500/20 text-emerald-300',
    iconColor: 'text-emerald-300',
    textColor: 'text-emerald-100',
    badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
    Icon: ShieldCheck,
    label: 'Immunity',
  },
  digestion: {
    gradient: 'from-amber-900/90 via-orange-900/80 to-yellow-950/80',
    border: 'border-amber-300/30',
    iconBg: 'bg-amber-500/20 text-amber-300',
    iconColor: 'text-amber-300',
    textColor: 'text-amber-100',
    badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
    Icon: Utensils,
    label: 'Digestion',
  },
  stress: {
    gradient: 'from-indigo-950/90 via-purple-900/80 to-slate-900/90',
    border: 'border-indigo-300/30',
    iconBg: 'bg-indigo-500/20 text-indigo-300',
    iconColor: 'text-indigo-300',
    textColor: 'text-indigo-100',
    badgeBg: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
    Icon: Moon,
    label: 'Stress & Sleep',
  },
  'skin-care': {
    gradient: 'from-rose-950/90 via-pink-900/80 to-amber-950/80',
    border: 'border-rose-300/30',
    iconBg: 'bg-rose-500/20 text-rose-300',
    iconColor: 'text-rose-300',
    textColor: 'text-rose-100',
    badgeBg: 'bg-rose-500/20 text-rose-200 border-rose-400/30',
    Icon: Sparkles,
    label: 'Skin Care',
  },
  respiratory: {
    gradient: 'from-sky-950/90 via-teal-900/80 to-slate-900/90',
    border: 'border-sky-300/30',
    iconBg: 'bg-sky-500/20 text-sky-300',
    iconColor: 'text-sky-300',
    textColor: 'text-sky-100',
    badgeBg: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
    Icon: Wind,
    label: 'Respiratory',
  },
  'pain-relief': {
    gradient: 'from-red-950/90 via-orange-950/80 to-amber-950/90',
    border: 'border-red-300/30',
    iconBg: 'bg-red-500/20 text-red-300',
    iconColor: 'text-red-300',
    textColor: 'text-red-100',
    badgeBg: 'bg-red-500/20 text-red-200 border-red-400/30',
    Icon: Activity,
    label: 'Pain & Inflammation',
  },
  'heart-health': {
    gradient: 'from-rose-950/90 via-red-900/80 to-stone-900/90',
    border: 'border-rose-300/30',
    iconBg: 'bg-rose-500/20 text-rose-300',
    iconColor: 'text-rose-300',
    textColor: 'text-rose-100',
    badgeBg: 'bg-rose-500/20 text-rose-200 border-rose-400/30',
    Icon: Heart,
    label: 'Heart & Circulation',
  },
  'womens-health': {
    gradient: 'from-fuchsia-950/90 via-pink-900/80 to-purple-950/90',
    border: 'border-fuchsia-300/30',
    iconBg: 'bg-fuchsia-500/20 text-fuchsia-300',
    iconColor: 'text-fuchsia-300',
    textColor: 'text-fuchsia-100',
    badgeBg: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/30',
    Icon: Sparkles,
    label: "Women's Health",
  },
};

const DEFAULT_THEME: CategoryTheme = {
  gradient: 'from-emerald-950/90 via-green-900/80 to-teal-950/90',
  border: 'border-emerald-300/30',
  iconBg: 'bg-emerald-500/20 text-emerald-300',
  iconColor: 'text-emerald-300',
  textColor: 'text-emerald-100',
  badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  Icon: Leaf,
  label: 'Herbal Botanical',
};

export function ThemedImage({
  src,
  fallbackSrc,
  alt,
  category,
  title,
  className = '',
  heightClass = '',
  aspectRatio = 'auto',
  objectFit = 'cover',
}: ThemedImageProps) {
  // Track image load attempts: 0 = primary src, 1 = fallbackSrc, 2 = show themed placeholder
  const [loadStage, setLoadStage] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const cleanCategory = (category || '').toLowerCase().trim();
  const theme = CATEGORY_THEMES[cleanCategory] || DEFAULT_THEME;
  const IconComponent = theme.Icon;

  // Determine current active URL to attempt
  let activeUrl: string | null = null;
  if (loadStage === 0 && src) {
    activeUrl = src;
  } else if (loadStage <= 1 && fallbackSrc && fallbackSrc !== src) {
    activeUrl = fallbackSrc;
  }

  // Reset stage when src or fallbackSrc changes
  useEffect(() => {
    setLoadStage(0);
    setIsLoaded(false);
  }, [src, fallbackSrc]);

  const handleImageError = () => {
    if (loadStage === 0 && fallbackSrc && fallbackSrc !== src) {
      setLoadStage(1);
    } else {
      setLoadStage(2);
    }
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'wide'
      ? 'aspect-[21/9]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : '';

  // If no URL to load or reached stage 2, render themed placeholder
  if (!activeUrl || loadStage >= 2) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} flex flex-col items-center justify-center p-6 text-center select-none ${aspectClass} ${heightClass} ${className}`}
        aria-label={alt}
      >
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/20 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center gap-3 max-w-sm">
          <div
            className={`w-14 h-14 rounded-2xl ${theme.iconBg} backdrop-blur-md flex items-center justify-center shadow-lg border ${theme.border} transition-transform group-hover:scale-105`}
          >
            <IconComponent className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.badgeBg}`}
            >
              {theme.label}
            </span>
            <p className={`text-sm sm:text-base font-bold ${theme.textColor} line-clamp-2 px-2 drop-shadow-xs`}>
              {title || alt}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gray-900 ${aspectClass} ${heightClass} ${className}`}>
      {/* Background themed placeholder while loading */}
      {!isLoaded && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} animate-pulse flex items-center justify-center`}
        >
          <IconComponent className={`w-8 h-8 ${theme.iconColor} opacity-40`} />
        </div>
      )}

      <img
        src={activeUrl}
        alt={alt}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full object-${objectFit} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
