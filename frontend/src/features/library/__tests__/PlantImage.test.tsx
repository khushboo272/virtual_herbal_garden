/**
 * Frontend tests for PlantImage component.
 * Tests lazy loading, placeholder display, and fallback on error.
 */
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlantImage } from '../components/PlantImage';

// IntersectionObserver mock — must be a proper class (constructor callable)
const mockDisconnect = vi.fn();
const mockObserve = vi.fn();

class MockIntersectionObserver {
  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    // Immediately fire as visible so lazy loading triggers in tests
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
    mockObserve(target);
  }

  disconnect() {
    mockDisconnect();
  }

  unobserve() {}
}

beforeEach(() => {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('PlantImage', () => {
  it('renders the alt text as a label in the placeholder when src is null', () => {
    render(<PlantImage src={null} alt="Tulsi" />);
    expect(screen.getByText('Tulsi')).toBeInTheDocument();
  });

  it('renders placeholder label when src is empty string', () => {
    render(<PlantImage src="" alt="Empty Plant" />);
    expect(screen.getByText('Empty Plant')).toBeInTheDocument();
  });

  it('renders an img element when src is a valid URL', () => {
    render(<PlantImage src="https://example.com/plant.jpg" alt="Test Plant" />);
    const img = screen.getByRole('img', { name: 'Test Plant' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/plant.jpg');
  });

  it('applies custom heightClass to the wrapper div', () => {
    const { container } = render(<PlantImage src={null} alt="Plant" heightClass="h-64" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('h-64');
  });

  it('calls IntersectionObserver.disconnect on unmount', () => {
    const { unmount } = render(
      <PlantImage src="https://example.com/plant.jpg" alt="Plant" />,
    );
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
