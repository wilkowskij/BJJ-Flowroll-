import React, { createContext, useContext } from 'react';

export interface ThemeContextValue {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}

export const ThemeContext = createContext<ThemeContextValue>({
  primaryColor: '#1B4FD8',
  secondaryColor: '#F59E0B',
  logoUrl: null,
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  value: ThemeContextValue;
  children: React.ReactNode;
}

export function ThemeProvider({ value, children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
