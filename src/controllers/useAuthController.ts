import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { User, AuthState } from '../models/User.model';
import { LoginRequest, RegisterRequest } from '../models/Api.model';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
};

export const useAuthController = () => {
  const [state, setState] = useState<AuthState>(initialState);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (storedUser && accessToken) {
      setState({
        user: JSON.parse(storedUser) as User,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const persistSession = useCallback((accessToken: string, refreshToken: string, user: User) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    setState({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setError('');
    setLoading(true);
    try {
      const res = await AuthService.login(data);
      const { accessToken, refreshToken, user } = res.data.data!;
      persistSession(accessToken, refreshToken, user as User);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate, persistSession]);

  const register = useCallback(async (data: RegisterRequest) => {
    setError('');
    setLoading(true);
    try {
      const res = await AuthService.register(data);
      const { accessToken, refreshToken, user } = res.data.data!;
      persistSession(accessToken, refreshToken, user as User);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate, persistSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setState({ ...initialState, isLoading: false });
    navigate('/login');
  }, [navigate]);

  return { ...state, error, loading, login, register, logout };
};
