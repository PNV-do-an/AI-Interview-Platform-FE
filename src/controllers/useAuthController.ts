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

// Bean validation của BE (GlobalExceptionHandler) trả 400 + message "Validation failed", còn
// thông báo từng field nằm trong map `detail`. Nếu chỉ đọc `message`, người dùng thấy nhãn
// chung "Validation failed" và không biết mình thiếu/sai chỗ nào.
// `detail` phía BE là HashMap nên thứ tự key không ổn định -> sắp lại theo thứ tự field trên form.
const FIELD_ORDER = ['fullName', 'email', 'password'];
// lockedUntil là dữ liệu kỹ thuật (đã có nhánh 423 riêng), không phải thông báo hiển thị.
const DETAIL_TECHNICAL_KEYS = ['lockedUntil'];

const readFieldMessages = (detail: unknown): string[] => {
  if (!detail || typeof detail !== 'object') return [];
  const map = detail as Record<string, unknown>;
  return Object.keys(map)
    .filter((key) => DETAIL_TECHNICAL_KEYS.indexOf(key) === -1)
    .filter((key) => typeof map[key] === 'string' && (map[key] as string).trim())
    .sort((a, b) => {
      const ia = FIELD_ORDER.indexOf(a);
      const ib = FIELD_ORDER.indexOf(b);
      return (ia < 0 ? FIELD_ORDER.length : ia) - (ib < 0 ? FIELD_ORDER.length : ib);
    })
    .map((key) => (map[key] as string).trim());
};

const readErrorMessage = (err: any, fallback: string): string => {
  const data = err.response?.data;
  const message: string = data?.message || data?.errorMessage || '';
  const fieldMessages = readFieldMessages(data?.detail).join('; ');
  if (message === 'Validation failed') return fieldMessages || fallback;
  return message || fieldMessages || fallback;
};

export const useAuthController = () => {
  const [state, setState] = useState<AuthState>(initialState);
  const [error, setError] = useState<string>('');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
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
      setErrorStatus(null);
      setLoading(true);
      try {
        const res = await AuthService.login(data);
        const { accessToken, refreshToken, user } = res.data.data!;
        persistSession(accessToken, refreshToken, user as User, rememberMe);

        const role = user?.role;
        if (role === 'ROLE_ADMIN') {
          navigate('/admin/users');
        } else if (role === 'ROLE_STAFF' || role === 'ROLE_INTERVIEWER') {
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      } catch (err: any) {
        const status = err.response?.status;
        setErrorStatus(typeof status === 'number' ? status : null);
        const msg = readErrorMessage(err, 'Sign in failed. Please try again.');
        // ErrorModel của BE tên field là `detail`, không phải `extra` -> đọc sai thì mất giờ mở khoá.
        const lockedUntil = err.response?.data?.detail?.lockedUntil;
        if (status === 423 && lockedUntil) {
          setError(msg + ` Unlocks at: ${new Date(lockedUntil).toLocaleString('vi-VN')}`);
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [navigate, persistSession]
  );

  const loginWithGoogle = useCallback(
    async (idToken: string, rememberMe: boolean) => {
      setError('');
      setErrorStatus(null);
      setLoading(true);
      try {
        const res = await AuthService.googleLogin(idToken);
        const { accessToken, refreshToken, user } = res.data.data!;
        persistSession(accessToken, refreshToken, user as User, rememberMe);
        navigate(user?.role === 'ROLE_ADMIN' ? '/admin/users' : '/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Google sign in failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [navigate, persistSession]
  );

  const loginWithGithub = useCallback(
    async (code: string, redirectUri: string, rememberMe: boolean) => {
      setError('');
      setErrorStatus(null);
      setLoading(true);
      try {
        const res = await AuthService.githubLogin(code, redirectUri);
        const { accessToken, refreshToken, user } = res.data.data!;
        persistSession(accessToken, refreshToken, user as User, rememberMe);
        navigate(user?.role === 'ROLE_ADMIN' ? '/admin/users' : '/dashboard', { replace: true });
      } catch (err: any) {
        setError(err.response?.data?.message || 'GitHub sign-in failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [navigate, persistSession]
  );

  const loginWithSso = useCallback(
    async (code: string, redirectUri: string, nonce: string, rememberMe: boolean) => {
      setError('');
      setErrorStatus(null);
      setLoading(true);
      try {
        const res = await AuthService.ssoLogin(code, redirectUri, nonce);
        const { accessToken, refreshToken, user } = res.data.data!;
        persistSession(accessToken, refreshToken, user as User, rememberMe);
        navigate(user?.role === 'ROLE_ADMIN' ? '/admin/users' : '/dashboard', { replace: true });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Enterprise SSO sign-in failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [navigate, persistSession]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setError('');
      setErrorStatus(null);
      setLoading(true);
      try {
        await AuthService.register(data);
        navigate('/login?registered=true');
      } catch (err: any) {
        const status = err.response?.status;
        setErrorStatus(typeof status === 'number' ? status : null);
        setError(readErrorMessage(err, 'Registration failed. Please try again.'));
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

  return {
    ...state,
    error,
    errorStatus,
    loading,
    login,
    loginWithGoogle,
    loginWithGithub,
    loginWithSso,
    register,
    logout,
  };
};
