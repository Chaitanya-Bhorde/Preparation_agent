import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as loginApi, register as registerApi, logout as logoutApi } from '../api';
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadUser();
  }, []);
  const loadUser = async () => {
    try {
      const { data } = await getMe();
      setUser(data.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  const login = async (email, password) => {
    const { data } = await loginApi({ email, password });
    setUser(data.user);
    return data;
  };
  const register = async (name, email, password) => {
    const { data } = await registerApi({ name, email, password });
    setUser(data.user);
    return data;
  };
  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };
  const refreshUser = async () => {
    await loadUser();
    window.dispatchEvent(new Event('profile-updated'));
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loadUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
