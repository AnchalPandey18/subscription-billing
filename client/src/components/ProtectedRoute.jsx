import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import Layout from "./Layout";

function ProtectedRoute() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Layout />;
}

export default ProtectedRoute;
