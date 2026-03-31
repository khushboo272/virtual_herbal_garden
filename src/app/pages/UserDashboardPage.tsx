import { UserDashboard } from "../components/slides/UserDashboard";
import { mockPlants } from "../data";

export function UserDashboardPage() {
  const savedPlants = mockPlants.map((p) => ({
    ...p,
    savedDate: "2 days ago",
  }));
  return <UserDashboard savedPlants={savedPlants} />;
}
