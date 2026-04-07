import { useAuth } from '@/hooks/useAuth';
import CustomerDashboard from '@/pages/CustomerDashboard';
import { Navigate } from 'react-router-dom';

/**
 * Smart home route: redirects vendors/admins to their dashboards,
 * shows CustomerDashboard for regular customers.
 */
const HomeRedirect = () => {
  const { roles, rolesLoaded } = useAuth();

  if (!rolesLoaded) {
    // Roles still loading — show nothing briefly (auth is already confirmed by AuthGuard)
    return null;
  }

  if (roles.includes('admin')) {
    return <Navigate to="/admin" replace />;
  }

  if (roles.includes('vendor')) {
    return <Navigate to="/vendor-dashboard" replace />;
  }

  return <CustomerDashboard />;
};

export default HomeRedirect;
