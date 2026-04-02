import { UserDashboard } from "../components/slides/UserDashboard";
import { useAuth } from "../../contexts/AuthContext";
import { useBookmarks } from "../../hooks/useUser";
import { LoadingState } from "../../components/DataStates";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function UserDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) return <LoadingState message="Loading your dashboard..." />;
  if (!isAuthenticated || !user) return null;

  return <UserDashboard user={user} />;
}
