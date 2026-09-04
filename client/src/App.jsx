import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import useAuth from "./context/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Subscriptions from "./pages/Subscriptions";
import Invoices from "./pages/Invoices";
import CreditNotes from "./pages/CreditNotes";
import Collaborators from "./pages/Collaborators";
import OverdueAlerts from "./pages/OverdueAlerts";

function PublicOnlyRoute({ children }) {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public Auth Routes */}
            <Route
                path="/login"
                element={
                    <PublicOnlyRoute>
                        <Login />
                    </PublicOnlyRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <PublicOnlyRoute>
                        <Register />
                    </PublicOnlyRoute>
                }
            />

            {/* Protected Workspace Routes (wrapped with Layout shell) */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/credit-notes" element={<CreditNotes />} />
                <Route path="/collaborators" element={<Collaborators />} />
                <Route path="/overdue-alerts" element={<OverdueAlerts />} />
            </Route>

            {/* Default Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;