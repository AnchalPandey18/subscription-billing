import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(
        !!localStorage.getItem("token")
    );

    if (!isLoggedIn) {
        return (
            <Routes>
                <Route
                    path="/login"
                    element={
                        <Login
                            onCreateAccount={() =>
                                window.location.href = "/register"
                            }
                            onLogin={() => setIsLoggedIn(true)}
                        />
                    }
                />

                <Route
                    path="/register"
                    element={
                        <Register
                            onBackToLogin={() =>
                                window.location.href = "/login"
                            }
                        />
                    }
                />

                <Route
                    path="*"
                    element={<Navigate to="/login" />}
                />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route
                path="*"
                element={<Navigate to="/dashboard" />}
            />
        </Routes>
    );
}

function AppWithRouter() {
    return (
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );
}

export default AppWithRouter;