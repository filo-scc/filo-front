import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "@/services/authService";

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

        setUser(userData);
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
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
