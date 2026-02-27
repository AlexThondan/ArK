import { createContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi";

const AuthContext = createContext(null);

const USER_KEY = "hrms_user";
const TOKEN_KEY = "hrms_token";
const PROFILE_KEY = "hrms_profile";

export const AuthProvider = ({ children }) => {
  const cachedUser = (() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  })();
  const cachedProfile = (() => {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  })();

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(cachedUser);
  const [profile, setProfile] = useState(cachedProfile);
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY) && !cachedUser));

  const clearAuth = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const isAuthError = (error) => {
    const text = String(error?.message || "").toLowerCase();
    return (
      error?.status === 401 ||
      error?.status === 403 ||
      text.includes("invalid token") ||
      text.includes("authorization token") ||
      text.includes("jwt")
    );
  };

  const verifySession = async ({ blocking = false } = {}) => {
    if (!token) {
      if (blocking) setIsLoading(false);
      return;
    }

    if (blocking) setIsLoading(true);
    try {
      const response = await authApi.me({ timeout: 7000 });
      setUser(response.user);
      setProfile(response.profile || null);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      localStorage.setItem(PROFILE_KEY, JSON.stringify(response.profile || null));
    } catch (error) {
      if (isAuthError(error) || !user) {
        clearAuth();
      }
    } finally {
      if (blocking) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (user) {
      setIsLoading(false);
      verifySession({ blocking: false });
      return;
    }

    verifySession({ blocking: true });
  }, [token]);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    setToken(response.token);
    setUser(response.user);
    setProfile(null);
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    localStorage.removeItem(PROFILE_KEY);
    verifySession({ blocking: false });
    toast.success("Logged in successfully");
    return response.user;
  };

  const logout = () => {
    clearAuth();
  };

  const refreshMe = async () => {
    const response = await authApi.me({ timeout: 7000 });
    setUser(response.user);
    setProfile(response.profile || null);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(response.profile || null));
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
