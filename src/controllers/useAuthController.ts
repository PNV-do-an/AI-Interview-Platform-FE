import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { User, AuthState } from '../models/User.model';
import { LoginRequest, RegisterRequest } from '../models/Api.model';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  REMEMBER_ME: 'rememberMe',
};

const getStorage = () => {
  return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true'
    ? localStorage
    : sessionStorage;
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

  useEffect(() => {
    const storage = getStorage();
    const storedUser = storage.getItem(STORAGE_KEYS.USER);
    const accessToken = storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

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

  const persistSession = useCallback(
    (accessToken: string, refreshToken: string, user: User, rememberMe: boolean) => {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      }
      setState({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
    },
    []
  );

  const login = useCallback(
    async (data: LoginRequest, rememberMe = false) => {
      setError('');
      setLoading(true);
      try {
        const res = await AuthService.login(data);
        const { accessToken, refreshToken, user } = res.data.data!;
        persistSession(accessToken, refreshToken, user as User, rememberMe);

        const role = user?.role;
        if (role === 'ROLE_ADMIN') {
          navigate('/admin/dashboard');
        } else if (role === 'ROLE_MENTOR') {
          navigate('/mentor/dashboard');
        } else {
          navigate('/dashboard');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [navigate, persistSession]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setError('');
      setLoading(true);
      try {
        await AuthService.register(data);
        navigate('/login?registered=true');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    [localStorage, sessionStorage].forEach((s) => {
      s.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      s.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      s.removeItem(STORAGE_KEYS.USER);
    });
    setState({ ...initialState, isLoading: false });
    navigate('/login');
  }, [navigate]);

  return { ...state, error, loading, login, register, logout };
};
