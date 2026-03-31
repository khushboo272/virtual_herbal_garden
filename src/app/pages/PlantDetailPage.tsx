import { useParams } from "react-router-dom";
import { PlantDetail } from "../components/slides/PlantDetail";
import { mockPlants } from "../data";

export function PlantDetailPage() {
  const { id } = useParams();
  const plant = mockPlants.find((p) => p.id === Number(id)) || mockPlants[0];
  return <PlantDetail plant={plant} />;
}
