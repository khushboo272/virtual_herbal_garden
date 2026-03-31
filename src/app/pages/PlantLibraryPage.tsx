import { PlantLibrary } from "../components/slides/PlantLibrary";
import { mockPlants } from "../data";

export function PlantLibraryPage() {
  return <PlantLibrary plants={mockPlants} />;
}
