import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default PrivateRoute;
