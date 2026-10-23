import { useEffect, useRef } from 'react';

/**
 * Sets document.title and restores previous document.title upon unmount.
 * Prevents title leaks across page transitions (BUG-015).
 */
export function useDocumentTitle(title: string | undefined, defaultTitle = 'Virtual Herbal Garden'): void {
  const previousTitleRef = useRef<string>(document.title);

  useEffect(() => {
    // Capture document.title on initial mount
    const previous = previousTitleRef.current;
    if (title && title.trim()) {
      document.title = title.trim();
    } else {
      document.title = defaultTitle;
    }

    return () => {
      document.title = previous || defaultTitle;
    };
  }, [title, defaultTitle]);
}
