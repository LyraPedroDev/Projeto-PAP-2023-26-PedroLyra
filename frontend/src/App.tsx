import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { ChatPage } from './components/ChatPage';
import { LandingPage } from './components/LandingPage';
import { Toaster } from './components/ui/sonner';
import { socket } from './services/socket';
import { AIFloatingButton } from './components/AIFloatingButton';
import { AIModal } from './components/AIModal';

type Page = 'landing' | 'login' | 'app';

const THEME_KEY = 'ecochat_theme';

export default function App() {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [startAsRegister, setStartAsRegister] = useState<boolean>(() => {
    return window.history.state?.startAsRegister ?? false;
  });

  const [page, setPage] = useState<Page>(() => {
    const path = window.location.pathname;
    const loggedIn = localStorage.getItem('user_id') !== null;
    
    if (path === '/app' && loggedIn) return 'app';
    if (path === '/login') return 'login';
    return 'landing';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [userId, setUserId] = useState<number | null>(() => {
    const saved = localStorage.getItem('user_id');
    return saved ? Number(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Sincronizar history na inicialização (F5)
  useEffect(() => {
    const path = window.location.pathname;
    const loggedIn = localStorage.getItem('user_id') !== null;
    
    if (path === '/app') {
      if (loggedIn) {
        window.history.replaceState({ page: 'app', startAsRegister: false }, '', '/app');
        if (!socket.connected) {
          console.log('[App] Reconectando socket na inicialização...');
          socket.connect();
        }
      } else {
        setPage('landing');
        window.history.replaceState({ page: 'landing', startAsRegister: false }, '', '/');
      }
    } else if (path === '/login') {
      const isReg = window.history.state?.startAsRegister ?? false;
      window.history.replaceState({ page: 'login', startAsRegister: isReg }, '', '/login');
    } else {
      window.history.replaceState({ page: 'landing', startAsRegister: false }, '', '/');
    }
  }, []);

  // Listener do botão voltar/avançar (popstate)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const statePage = event.state?.page ?? 'landing';
      const isReg = event.state?.startAsRegister ?? false;
      const loggedIn = localStorage.getItem('user_id') !== null;
      
      if (statePage === 'app' && !loggedIn) {
        setPage('landing');
        window.history.replaceState({ page: 'landing', startAsRegister: false }, '', '/');
      } else {
        setPage(statePage);
        setStartAsRegister(isReg);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleTheme = () => setIsDarkMode(d => !d);

  const handleGoToSignup = () => {
    setStartAsRegister(true);
    setPage('login');
    window.history.pushState({ page: 'login', startAsRegister: true }, '', '/login');
  };

  const handleGoToLogin = () => {
    setStartAsRegister(false);
    setPage('login');
    window.history.pushState({ page: 'login', startAsRegister: false }, '', '/login');
  };

  const handleToggleLoginMode = (isLoginNow: boolean) => {
    setStartAsRegister(!isLoginNow);
    window.history.replaceState({ page: 'login', startAsRegister: !isLoginNow }, '', '/login');
  };

  const handleLogin = (userData: { user_id: number; email: string }) => {
    setUserId(userData.user_id);
    setPage('app');
    window.history.pushState({ page: 'app', startAsRegister: false }, '', '/app');

    // Ligar o socket DEPOIS do login
    setTimeout(() => {
      if (!socket.connected) {
        console.log('[App] A ligar socket após login...');
        socket.connect();
      }
    }, 200);
  };

  const handleLogout = () => {
    if (socket.connected) {
      socket.disconnect();
      console.log('[App] Socket desligado no logout');
    }
    setPage('landing');
    setUserId(null);
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    window.history.pushState({ page: 'landing', startAsRegister: false }, '', '/');
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {page === 'landing' && (
        <LandingPage
          onLogin={handleGoToLogin}
          onSignup={handleGoToSignup}
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
      {page === 'app' && (
        <ChatPage
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          userId={userId!}
        />
      )}
      <Toaster />

      {/* Botão Flutuante e Modal da IA */}
      <AIFloatingButton onClick={() => setIsAIModalOpen(true)} />
      <AIModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} isDarkMode={isDarkMode} />
    </div>
  );
}