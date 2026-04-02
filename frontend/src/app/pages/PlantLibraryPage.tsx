import { useState } from "react";
import { PlantLibrary } from "../components/slides/PlantLibrary";
import { usePlants } from "../../hooks/usePlants";
import { LoadingState, ErrorState, EmptyState } from "../../components/DataStates";

export function PlantLibraryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { plants, total, totalPages, isLoading, error, refetch } = usePlants({
    page,
    limit: 12,
    search: search || undefined,
  });

  if (isLoading && plants.length === 0) return <LoadingState message="Loading plant library..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  // Map backend Plant model to what PlantLibrary expects
  const mappedPlants = plants.map((p) => ({
    id: p._id,
    name: p.commonName,
    botanicalName: p.scientificName,
    image: p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "",
    category: p.tags?.[0] || "Medicinal",
    region: p.regionNative?.[0] || "Unknown",
    uses: p.medicinalUses?.slice(0, 3) || [],
  }));

  if (mappedPlants.length === 0 && !isLoading) {
    return <EmptyState title="No plants found" message="Try adjusting your search or filters" />;
  }

  return <PlantLibrary plants={mappedPlants} />;
}
