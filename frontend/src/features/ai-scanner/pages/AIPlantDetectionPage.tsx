import { useNavigate } from "react-router-dom";
import { AIPlantDetection } from "../components/AIPlantDetection";
import { useAuth } from "../../../contexts/AuthContext";

export function AIPlantDetectionPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <AIPlantDetection
      isAuthenticated={isAuthenticated}
      onViewDetails={(plantName: string) => {
        navigate(`/library?q=${encodeURIComponent(plantName)}&open=1`);
      }}
    />
  );
}
