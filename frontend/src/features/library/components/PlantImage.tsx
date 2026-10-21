import { useState, useRef, useEffect } from 'react';
import { Leaf } from 'lucide-react';

interface PlantImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Aspect ratio wrapper height class e.g. "h-48" or "h-64" */
  heightClass?: string;
  objectFit?: 'cover' | 'contain';
}

/**
 * Lazy-loading plant image with a green leaf placeholder.
 * - Uses IntersectionObserver for true lazy loading
 * - Shows the placeholder when src is empty, null, or fails to load
 * - Smooth fade-in once the image loads
 */
export function PlantImage({
  src,
  alt,
  className = '',
  heightClass = 'h-48',
  objectFit = 'cover',
}: PlantImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // IntersectionObserver — only load image when it scrolls into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const showPlaceholder = !src || errored || !loaded;

  return (
    <div ref={ref} className={`relative overflow-hidden bg-green-50 ${heightClass} ${className}`}>
      {/* Leaf placeholder — always rendered behind the real image */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-300 ${
          showPlaceholder ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Leaf className="w-8 h-8 text-green-400" />
        </div>
        <span className="text-xs text-green-400 text-center px-2">{alt}</span>
      </div>

      {/* Real image — only rendered once in viewport */}
      {visible && src && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`absolute inset-0 w-full h-full object-${objectFit} transition-opacity duration-500 ${
            loaded && !errored ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />
      )}
    </div>
  );
}
