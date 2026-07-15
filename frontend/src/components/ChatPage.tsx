import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { FeedSection } from './FeedSection';
import { RankingSection } from './RankingSection';
import { TasksSection } from './TasksSection';
import { FriendsSection } from './FriendsSection';
import { ProfileSection } from './ProfileSection';
import { PrivateChatSection } from './PrivateChatSection';
import { AdminSection } from './AdminSection';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { theme } from '../theme';
import { TutorialProvider, useTutorial } from '../tutorial/TutorialProvider';
import { TutorialOverlay } from '../tutorial/TutorialOverlay';

interface ChatPageProps {
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  userId: number;
  isAdmin: boolean;
  initialTutorialCompleted: boolean;
}

type Section = 'feed' | 'ranking' | 'tasks' | 'friends' | 'profile' | 'private' | 'admin';

function TutorialLauncher({ initialTutorialCompleted }: { initialTutorialCompleted: boolean }) {
  const { startTutorial, state } = useTutorial();
  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    if (hasAutoStartedRef.current) return;
    if (initialTutorialCompleted !== false) return;
    if (state.status !== 'idle') return;

    hasAutoStartedRef.current = true;
    startTutorial('feed', false);
  }, [initialTutorialCompleted, startTutorial, state.status]);

  return null;
}

export function ChatPage({ onLogout, isDarkMode, toggleTheme, userId, isAdmin, initialTutorialCompleted }: ChatPageProps) {
  const [activeSection, setActiveSection] = useState<Section>(() => {
    return (localStorage.getItem('ecochat_active_section') as Section) || 'feed';
  });
  const [tutorialCompleted, setTutorialCompleted] = useState(initialTutorialCompleted);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [privateChatFriendId, setPrivateChatFriendId] = useState<number | null>(null);
  const [privateChatFriendName, setPrivateChatFriendName] = useState<string>('');
  const T = theme(isDarkMode);

  useEffect(() => {
    localStorage.setItem('ecochat_active_section', activeSection);
  }, [activeSection]);

  useEffect(() => {
    const name = localStorage.getItem('user_name') || localStorage.getItem('user_email') || '';
    setUserName(name);

    const handleOpenMenu = () => setIsMobileMenuOpen(true);
    window.addEventListener('open-mobile-menu', handleOpenMenu);
    return () => window.removeEventListener('open-mobile-menu', handleOpenMenu);
  }, []);

  const handleOpenChat = (friendId: number, friendName: string) => {
    setPrivateChatFriendId(friendId);
    setPrivateChatFriendName(friendName);
    setActiveSection('private');
    setIsMobileMenuOpen(false);
  };

  const handleSetSection = (s: Section) => {
    setActiveSection(s);
    setIsMobileMenuOpen(false);
    if (s === 'private' && s !== activeSection) {
      setPrivateChatFriendId(null);
      setPrivateChatFriendName('');
    }
  };

  const renderSection = () => {
    const commonProps = { isDarkMode, toggleTheme };
    switch (activeSection) {
      case 'feed':
        return <FeedSection userId={userId} {...commonProps} />;
      case 'ranking':
        return <RankingSection userId={userId} />;
      case 'tasks':
        return <TasksSection userId={userId} isDarkMode={isDarkMode} />;
      case 'friends':
        return <FriendsSection userId={userId} onOpenChat={handleOpenChat} />;
      case 'profile':
        return (
          <ProfileSection
            onLogout={onLogout}
            userId={userId}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        );
      case 'private':
        return (
          <PrivateChatSection
            userId={userId}
            isDarkMode={isDarkMode}
            initialFriendId={privateChatFriendId}
            initialFriendName={privateChatFriendName}
            onGoToFriends={() => handleSetSection('friends')}
          />
        );
      case 'admin':
        return isAdmin ? <AdminSection isDarkMode={isDarkMode} currentUserId={userId} /> : <FeedSection userId={userId} {...commonProps} />;
      default:
        return <FeedSection userId={userId} {...commonProps} />;
    }
  };

  const isMobile = window.innerWidth < 1024;

  return (
    <TutorialProvider
      isAdmin={isAdmin}
      isMobile={isMobile}
      onChangeSection={handleSetSection}
      onTutorialCompleted={() => setTutorialCompleted(true)}
    >
      <TutorialLauncher initialTutorialCompleted={tutorialCompleted} />
      <TutorialOverlay isDarkMode={isDarkMode} />

      <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, transition: 'background 0.3s', fontFamily: '"Inter","Segoe UI",system-ui,sans-serif' }}>
        <div className="hidden lg:block" style={{ flexShrink: 0, width: 260 }}>
          <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 20 }}>
            <Sidebar
              activeSection={activeSection}
              setActiveSection={handleSetSection}
              onLogout={onLogout}
              userName={userName}
              isDarkMode={isDarkMode}
              toggleTheme={toggleTheme}
              isAdmin={isAdmin}
            />
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40, backdropFilter: 'blur(4px)' }}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 24, stiffness: 200 }}
                style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50 }}
                className="lg:hidden"
              >
                <Sidebar
                  activeSection={activeSection}
                  setActiveSection={handleSetSection}
                  onLogout={onLogout}
                  userName={userName}
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                  isAdmin={isAdmin}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div
          className={activeSection === 'private' ? '' : 'pt-[28px] px-6 pb-10'}
          style={{
            flex: 1,
            minHeight: '100vh',
            overflowX: 'hidden',
            transition: 'all 0.3s',
            padding: activeSection === 'private' ? '0' : undefined,
          }}
        >
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ height: activeSection === 'private' ? '100vh' : 'auto' }}
          >
            {renderSection()}
          </motion.div>
        </div>
      </div>
    </TutorialProvider>
  );
}
