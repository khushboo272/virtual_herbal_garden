import { HomePage } from "../components/slides/HomePage";
import { mockPlants, heroImage } from "../data";

export function HomePageWrapper() {
  return <HomePage heroImage={heroImage} featuredPlants={mockPlants} />;
}
