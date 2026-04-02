import { VirtualTour } from "../components/slides/VirtualTour";
import { useTours } from "../../hooks/useTours";
import { LoadingState, ErrorState, EmptyState } from "../../components/DataStates";

export function VirtualTourPage() {
  const { tours, isLoading, error } = useTours({ page: 1, limit: 10 });

  if (isLoading) return <LoadingState message="Loading virtual tour..." />;
  if (error) return <ErrorState message={error} />;
  if (!tours || tours.length === 0) return <EmptyState title="No Tours Available" message="Check back later." />;

  // Select the first tour for now
  const tour = tours[0];

  return <VirtualTour tourId={tour._id} title={tour.title} description={tour.description} stops={tour.stops || []} />;
}
