import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStatus } from '@/hooks/auth';
import { PrivateAppLayout } from '@/layout';
import { ROUTE_AUTH } from '@/providers/RoutesProvider.tsx';

const PrivateRoute = () => {
  const authStatus = useAuthStatus(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    authStatus.refetch();
  }, [location.pathname]);

  useEffect(() => {
    if (!authStatus.isFetching && !authStatus.isAuthenticated) {
      navigate(ROUTE_AUTH);
    }
  }, [authStatus.isFetching, authStatus.isAuthenticated, navigate]);

  return <>{authStatus.isSuccess ? <PrivateAppLayout /> : null}</>;
};

export default PrivateRoute;
