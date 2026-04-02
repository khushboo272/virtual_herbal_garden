import { useParams } from "react-router-dom";
import { PlantDetail } from "../components/slides/PlantDetail";
import { usePlant } from "../../hooks/usePlants";
import { LoadingState, ErrorState } from "../../components/DataStates";

export function PlantDetailPage() {
  const { id } = useParams();
  const { plant, isLoading, error } = usePlant(id || "");

  if (isLoading) return <LoadingState message="Loading plant details..." />;
  if (error || !plant) return <ErrorState message={error || "Plant not found"} />;

  // Map backend Plant model to what PlantDetail expects
  const mappedPlant = {
    name: plant.commonName,
    botanicalName: plant.scientificName,
    image: plant.images?.find((img) => img.isPrimary)?.url || plant.images?.[0]?.url || "",
    category: plant.tags?.[0] || "Medicinal",
    region: plant.regionNative?.[0] || "Unknown",
    description: plant.description,
    medicinalUses: plant.medicinalUses || [],
    cultivation: plant.growingConditions
      ? `Soil: ${plant.growingConditions.soil || "N/A"}. Water: ${plant.growingConditions.water || "N/A"}. Sunlight: ${plant.growingConditions.sunlight || "N/A"}. Climate: ${plant.growingConditions.climate || "N/A"}.`
      : "Cultivation information not available.",
    partsUsed: plant.partsUsed || [],
    precautions: plant.toxicityLevel !== "NONE"
      ? [`Toxicity level: ${plant.toxicityLevel}`, "Consult healthcare provider before medicinal use"]
      : ["Consult healthcare provider before medicinal use"],
  };

  return <PlantDetail plant={mappedPlant} />;
}
