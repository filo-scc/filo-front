import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "@/services/authService";
import { AUTH_USER_UPDATED_EVENT } from "@/services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ============================
    // CARREGAR USUÁRIO AO INICIAR
    // ============================
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const userData = await authService.getMe();

                localStorage.setItem("user", JSON.stringify(userData));
                setUser(userData);
                // eslint-disable-next-line no-unused-vars
            } catch (error) {
                localStorage.removeItem("user");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    useEffect(() => {
        const checkStoredSession = () => {
            if (!localStorage.getItem("accessToken")) {
                setUser(null);
            }
        };

        const handleUserUpdated = (event) => {
            setUser(event.detail);
        };

        window.addEventListener("storage", checkStoredSession);
        window.addEventListener("focus", checkStoredSession);
        window.addEventListener(AUTH_USER_UPDATED_EVENT, handleUserUpdated);
        const sessionCheckInterval = window.setInterval(checkStoredSession, 500);

        return () => {
            window.removeEventListener("storage", checkStoredSession);
            window.removeEventListener("focus", checkStoredSession);
            window.removeEventListener(AUTH_USER_UPDATED_EVENT, handleUserUpdated);
            window.clearInterval(sessionCheckInterval);
        };
    }, []);

    // ============================
    // LOGIN
    // ============================
    const handleLogin = async (data) => {
        const login = await authService.login(data);

        setUser(login.user);
    };

    // ============================
    // LOGOUT
    // ============================
    const handleLogout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                loading,
                login: handleLogin,
                logout: handleLogout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Hook pra usar fácil
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}
