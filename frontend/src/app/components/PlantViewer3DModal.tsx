import React, { lazy, Suspense } from 'react';
import type { LibraryPlant } from '../../features/library/types/library.types';

const PlantViewerModal = lazy(() =>
  import('../../modules/plant-viewer').then((m) => ({ default: m.PlantViewerModal }))
);

export interface PlantViewer3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantName?: string;
  botanicalName?: string;
  plant?: LibraryPlant | null;
  plantSlug?: string;
}

/**
 * PlantViewer3DModal — Legacy bridge wrapper forwarding to the real, data-driven
 * 3D plant viewer module (`modules/plant-viewer`).
 */
export function PlantViewer3DModal({
  isOpen,
  onClose,
  plantName,
  botanicalName,
  plant,
  plantSlug,
}: PlantViewer3DModalProps) {
  if (!isOpen) return null;

  return (
    <Suspense fallback={null}>
      <PlantViewerModal
        isOpen={isOpen}
        onClose={onClose}
        plant={plant}
        plantSlug={plantSlug}
        plantName={plantName}
        botanicalName={botanicalName}
      />
    </Suspense>
  );
}

export default PlantViewer3DModal;
