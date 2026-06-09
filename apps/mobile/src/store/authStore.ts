import { create } from 'zustand';

interface AuthState {
  userId: string | null;
  gymId: string | null;
  token: string | null;
  studentName: string | null;
  isAuthenticated: boolean;
  login: (params: {
    userId: string;
    gymId: string;
    token: string;
    studentName: string;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  gymId: null,
  token: null,
  studentName: null,
  isAuthenticated: false,

  login: ({ userId, gymId, token, studentName }) =>
    set({
      userId,
      gymId,
      token,
      studentName,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      userId: null,
      gymId: null,
      token: null,
      studentName: null,
      isAuthenticated: false,
    }),
}));
