import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppLoadingScreen from "@/components/geral/AppLoadingScreen";

function PrivateRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <AppLoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return children;
}

export default PrivateRoute;
