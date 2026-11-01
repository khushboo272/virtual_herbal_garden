import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlantViewerModal } from '../components/PlantViewerModal';

export const Plant3DPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 overflow-hidden">
      <PlantViewerModal
        isOpen={true}
        onClose={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate(`/plant/${slug || ''}`);
          }
        }}
        plantSlug={slug}
      />
    </div>
  );
};

export default Plant3DPage;

