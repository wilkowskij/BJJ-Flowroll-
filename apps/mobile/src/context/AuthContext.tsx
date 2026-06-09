import React, { createContext, useContext } from 'react';

export interface AuthContextValue {
  userId: string | null;
  gymId: string | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  userId: null,
  gymId: null,
  token: null,
  isAuthenticated: false,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  value: AuthContextValue;
  children: React.ReactNode;
}

export function AuthProvider({ value, children }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
