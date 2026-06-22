import { useEffect, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { ChatPage } from './components/ChatPage';
import { Toaster } from './components/ui/sonner';
import { socket } from './services/socket';
import { AIFloatingButton } from './components/AIFloatingButton';
import { AIModal } from './components/AIModal';

type Page = 'landing' | 'login' | 'app';
type AuthUser = { user_id: number; email: string; nome?: string; is_admin?: boolean };
type HistoryState = { page?: Page; registerMode?: boolean };

const THEME_KEY = 'ecochat_theme';

export default function App() {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [startAsRegister, setStartAsRegister] = useState(false);
  const [page, setPage] = useState<Page>('landing');
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [userId, setUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const navigateTo = (nextPage: Page, options?: { replace?: boolean; registerMode?: boolean }) => {
    const state: HistoryState = { page: nextPage };
    if (nextPage === 'login') {
      state.registerMode = Boolean(options?.registerMode);
      setStartAsRegister(Boolean(options?.registerMode));
    }

    setPage(nextPage);

    const url = nextPage === 'landing' ? '/' : `/${nextPage}`;
    if (options?.replace) {
      window.history.replaceState(state, '', url);
      return;
    }

    window.history.pushState(state, '', url);
  };

  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const restoreSession = async () => {
      let res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.status === 401) {
        const refresh = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (refresh.ok) res = refresh;
      }

      if (res.ok) {
        const data = await res.json();
        const user = data.user;
        setUserId(user.id);
        setIsAdmin(Boolean(user.is_admin));
        localStorage.setItem('user_id', String(user.id));
        localStorage.setItem('user_email', user.email);
        localStorage.setItem('user_name', user.nome);
        if (!socket.connected) socket.connect();
      } else {
        localStorage.removeItem('user_id');
      }
      navigateTo('landing', { replace: true });
      setIsSessionLoading(false);
    };

    restoreSession().catch(() => setIsSessionLoading(false));
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = (event.state ?? {}) as HistoryState;
      const pathname = window.location.pathname;

      if (state.page === 'login' || pathname === '/login') {
        setStartAsRegister(Boolean(state.registerMode));
        setPage('login');
        return;
      }

      if (state.page === 'app' || pathname === '/app') {
        if (userId !== null) {
          setPage('app');
          if (!socket.connected) socket.connect();
        } else {
          navigateTo('landing', { replace: true });
        }
        return;
      }

      setPage('landing');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [userId]);

  useEffect(() => {
    if (isSessionLoading) return;
    if (page !== 'app') return;
    if (userId !== null) return;

    navigateTo('landing', { replace: true });
  }, [isSessionLoading, page, userId]);

  useEffect(() => {
    if (page !== 'app') return;
    const timer = window.setInterval(async () => {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) void handleLogout();
    }, 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [page]);

  const toggleTheme = () => setIsDarkMode(dark => !dark);

  const handleToggleLoginMode = (isLoginNow: boolean) => {
    setStartAsRegister(!isLoginNow);
  };

  const openLoginFlow = () => {
    if (userId !== null) {
      navigateTo('app');
      if (!socket.connected) socket.connect();
      return;
    }

    navigateTo('login', { registerMode: false });
  };

  const openSignupFlow = () => {
    if (userId !== null) {
      navigateTo('app');
      if (!socket.connected) socket.connect();
      return;
    }

    navigateTo('login', { registerMode: true });
  };

  const handleLogin = (userData: AuthUser) => {
    setUserId(userData.user_id);
    setIsAdmin(Boolean(userData.is_admin));
    localStorage.setItem('user_id', String(userData.user_id));
    localStorage.setItem('user_email', userData.email);
    if (userData.nome) localStorage.setItem('user_name', userData.nome);
    navigateTo('app');

    window.setTimeout(() => {
      if (!socket.connected) socket.connect();
    }, 200);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    if (socket.connected) socket.disconnect();
    setPage('login');
    setUserId(null);
    setIsAdmin(false);
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    navigateTo('landing');
  };

  if (isSessionLoading) {
    return <div style={{ minHeight: '100vh', background: '#040f07' }} />;
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {page === 'landing' && (
        <LandingPage
          onLogin={openLoginFlow}
          onSignup={openSignupFlow}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      )}
      {page === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          initialIsLogin={!startAsRegister}
          onToggleMode={handleToggleLoginMode}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      )}
      {page === 'app' && userId !== null && (
        <ChatPage
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          userId={userId}
          isAdmin={isAdmin}
        />
      )}
      <Toaster />

      {page === 'app' && (
        <AIFloatingButton onClick={() => setIsAIModalOpen(true)} />
      )}
      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
