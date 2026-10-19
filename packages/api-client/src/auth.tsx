import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { UserSession, Role, civicPulseApi, MOCK_USERS } from "@civicpulse/api-client";

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  login: (phone: string, otp: string, role?: Role) => Promise<UserSession>;
  switchMockRole: (role: "citizen" | "inspector" | "admin") => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "civicpulse_session";

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  defaultRole?: "citizen" | "inspector" | "admin";
}> = ({ children, defaultRole = "citizen" }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserSession;
        setUser(parsed);
        civicPulseApi.setToken(parsed.token);
      } else {
        // Auto seed default role session for smooth development testing
        const initial = MOCK_USERS[defaultRole];
        setUser(initial);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(initial));
        civicPulseApi.setToken(initial.token);
      }
    } catch {
      setUser(MOCK_USERS[defaultRole]);
    } finally {
      setIsLoading(false);
    }
  }, [defaultRole]);

  const login = async (phone: string, otp: string, role: Role = "CITIZEN"): Promise<UserSession> => {
    const session = await civicPulseApi.verifyOtp(phone, otp, role);
    setUser(session);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    civicPulseApi.setToken(session.token);
    return session;
  };

  const switchMockRole = (roleKey: "citizen" | "inspector" | "admin") => {
    const session = MOCK_USERS[roleKey];
    setUser(session);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    civicPulseApi.setToken(session.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    civicPulseApi.setToken("");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, switchMockRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
