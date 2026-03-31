import { useNavigate } from "react-router-dom";
import { AIPlantDetection } from "../components/slides/AIPlantDetection";

export function AIPlantDetectionPage() {
  const navigate = useNavigate();
  return (
    <AIPlantDetection
      onViewDetails={(plantName: string) => {
        // Navigate to plant detail - find by name or default to first
        navigate(`/plant/1`);
      }}
    />
  );
}
