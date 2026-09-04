import { useState, useEffect, useCallback } from "react";
import AuthContext from "./authContextInstance";
import { getOverdueAlerts } from "../services/api";

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token") || null);
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem("user");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [overdueCount, setOverdueCount] = useState(0);

    const isBillingAdmin = user?.role === "Billing Admin";
    const isAccountManager = user?.role === "Account Manager";
    const isAuthenticated = !!token;

    // Login handler
    const login = (authToken, authUser) => {
        setToken(authToken);
        setUser(authUser);
        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(authUser));
    };

    // Logout handler
    const logout = () => {
        setToken(null);
        setUser(null);
        setOverdueCount(0);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    // Refresh overdue alert badge count
    const refreshOverdueCount = useCallback(async () => {
        const currentToken = localStorage.getItem("token");
        if (!currentToken) return;
        try {
            const data = await getOverdueAlerts();
            setOverdueCount(data.count || 0);
        } catch {
            // Silently ignore if not authorized yet
        }
    }, []);

    useEffect(() => {
        let interval;
        if (isAuthenticated) {
            const timer = setTimeout(() => {
                refreshOverdueCount();
            }, 0);

            // Check overdue alerts periodically (every 60 seconds)
            interval = setInterval(refreshOverdueCount, 60000);
            return () => {
                clearTimeout(timer);
                clearInterval(interval);
            };
        }
    }, [isAuthenticated, refreshOverdueCount]);

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isAuthenticated,
                isBillingAdmin,
                isAccountManager,
                overdueCount,
                refreshOverdueCount,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
