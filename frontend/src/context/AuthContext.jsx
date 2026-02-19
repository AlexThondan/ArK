import { createContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi";

const AuthContext = createContext(null);

const USER_KEY = "hrms_user";
const TOKEN_KEY = "hrms_token";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      try {
        const response = await authApi.me();
        setUser(response.user);
        setProfile(response.profile);
      } catch {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [token]);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    toast.success("Logged in successfully");
    return response.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const refreshMe = async () => {
    const response = await authApi.me();
    setUser(response.user);
    setProfile(response.profile);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    return response;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      profile,
      isLoading,
      login,
      logout,
      refreshMe,
      isAuthenticated: Boolean(token && user)
    }),
    [token, user, profile, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
