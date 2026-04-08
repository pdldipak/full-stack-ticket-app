import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@src/context/AuthContext.jsx';

export default function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const scannerOnly =
      Array.isArray(allowedRoles) && allowedRoles.length === 1 && allowedRoles[0] === 'scanner';
    const loginPath = scannerOnly ? '/scanner-login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length && !allowedRoles.includes(role)) {
    if (role === 'scanner') {
      return <Navigate to="/scanner" replace />;
    }
    return <Navigate to="/tickets" replace />;
  }

  return children;
}
