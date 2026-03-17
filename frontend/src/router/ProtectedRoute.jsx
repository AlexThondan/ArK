import { Navigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../components/common/LoadingSpinner";
import useAuth from "../hooks/useAuth";

const resolveHomePath = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "hr") return "/admin/hr-dashboard";
  if (role === "manager") return "/manager/dashboard";
  return "/employee/dashboard";
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner label="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={resolveHomePath(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
