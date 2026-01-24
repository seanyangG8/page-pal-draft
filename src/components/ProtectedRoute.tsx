import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Checking session...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}
