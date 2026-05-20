import React, { createContext, useContext } from 'react';
import { useAuthController } from '../controllers/useAuthController';
import { User } from '../models/User.model';
import { LoginRequest, RegisterRequest } from '../models/Api.model';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider wraps the app and exposes auth state + actions.
 * The controller (useAuthController) holds all business logic.
 * Views consume this context — they never call services directly.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const controller = useAuthController();

  return (
    <AuthContext.Provider value={controller}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
