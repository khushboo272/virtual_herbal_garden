import { HomePage } from "../components/slides/HomePage";
import { useFeaturedPlants } from "../../hooks/usePlants";
import { LoadingState, ErrorState } from "../../components/DataStates";

export function HomePageWrapper() {
  const { plants, isLoading, error } = useFeaturedPlants();

  if (isLoading) return <LoadingState message="Loading featured plants..." />;
  if (error) return <ErrorState message={error} />;

  // Map backend Plant model to what HomePage expects
  const featuredPlants = plants.map((p) => ({
    id: p._id,
    name: p.commonName,
    botanicalName: p.scientificName,
    image: p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "",
    category: p.tags?.[0] || "Medicinal",
  }));

  const heroImage =
    "https://images.unsplash.com/photo-1609486961058-cbfe79e35cbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

  return <HomePage heroImage={heroImage} featuredPlants={featuredPlants} />;
}
