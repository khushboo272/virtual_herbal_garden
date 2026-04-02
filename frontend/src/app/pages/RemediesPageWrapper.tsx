import { RemediesPage } from "../components/slides/RemediesPage";
import { useRemedies } from "../../hooks/useRemedies";
import { LoadingState, ErrorState } from "../../components/DataStates";

export function RemediesPageWrapper() {
  const { remedies, isLoading, error, refetch } = useRemedies();

  if (isLoading) return <LoadingState message="Loading remedies..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  // Pass remedies data to the component.
  // The RemediesPage currently uses hardcoded data internally,
  // so we pass the API data via a prop for future refactoring.
  return <RemediesPage apiRemedies={remedies} />;
}
