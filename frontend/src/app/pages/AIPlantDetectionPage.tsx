import { useNavigate } from "react-router-dom";
import { AIPlantDetection } from "../components/slides/AIPlantDetection";
import { useAuth } from "../../contexts/AuthContext";

export function AIPlantDetectionPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <AIPlantDetection
      isAuthenticated={isAuthenticated}
      onViewDetails={(plantName: string) => {
        // Navigate to plant detail by searching for the plant name
        navigate(`/plant/${encodeURIComponent(plantName)}`);
      }}
    />
  );
}
