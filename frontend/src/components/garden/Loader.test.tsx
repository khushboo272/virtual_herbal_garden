import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Loader } from './Loader';
import * as drei from '@react-three/drei';

vi.mock('@react-three/drei', () => ({
  useProgress: vi.fn()
}));

describe('Loader', () => {
  it('returns null when not active', () => {
    vi.mocked(drei.useProgress).mockReturnValue({
      active: false,
      progress: 0,
      loaded: 0,
      total: 0,
      errors: [],
      item: ''
    });

    const { container } = render(<Loader />);
    expect(container.firstChild).toBeNull();
  });

  it('renders progress and loaded items when active', () => {
    vi.mocked(drei.useProgress).mockReturnValue({
      active: true,
      progress: 50.5,
      loaded: 5,
      total: 10,
      errors: [],
      item: 'models/tree.glb'
    });

    const { getByText } = render(<Loader />);
    
    // Check if the title is there
    expect(getByText('Loading Garden...')).toBeInTheDocument();
    
    // Check if progress is rounded
    expect(getByText('51% (5/10)')).toBeInTheDocument();
    
    // Check if item is shown
    expect(getByText('models/tree.glb')).toBeInTheDocument();
  });
});
