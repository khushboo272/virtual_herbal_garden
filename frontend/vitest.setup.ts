import '@testing-library/jest-dom';

// ── Browser API stubs for JSDOM ────────────────────────────────────────────────
// JSDOM does not implement these APIs; stub them so components that use
// IntersectionObserver / ResizeObserver / matchMedia don't crash in tests.

class IntersectionObserverStub implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

if (typeof window !== 'undefined') {
  (window as Window & typeof globalThis).IntersectionObserver = IntersectionObserverStub;
}

class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined') {
  (window as Window & typeof globalThis).ResizeObserver = ResizeObserverStub;
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
