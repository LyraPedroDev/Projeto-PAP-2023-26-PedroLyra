import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Trophy, CheckSquare, Users, User, Newspaper, LogOut, Sun, Moon, MessageSquareDot } from 'lucide-react';
import { BrandLogo } from './ui/BrandLogo';
import { theme } from '../theme';

// Incluir 'private' no tipo Section
type Section = 'feed' | 'ranking' | 'tasks' | 'friends' | 'profile' | 'private' | 'admin';

interface SidebarProps {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  onLogout?: () => void;
  userName?: string;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isAdmin?: boolean;
}

const MENU = [
  { id: 'feed' as Section,    icon: Newspaper,        label: 'Feed'      },
  { id: 'private' as Section, icon: MessageSquareDot, label: 'Mensagens' },
  { id: 'ranking' as Section, icon: Trophy,           label: 'Ranking'   },
  { id: 'tasks' as Section,   icon: CheckSquare,      label: 'Missões'   },
  { id: 'friends' as Section, icon: Users,            label: 'Amigos'    },
  { id: 'profile' as Section, icon: User,             label: 'Perfil'    },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -15 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export function Sidebar({ activeSection, setActiveSection, onLogout, userName, isDarkMode, toggleTheme, isAdmin = false }: SidebarProps) {
  const T = theme(isDarkMode);
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'EC';

  const userId = localStorage.getItem('user_id');
  const [avatar, setAvatar] = useState(
    userId ? localStorage.getItem(`user_avatar_${userId}`) || '🌱' : '🌱'
  );

  useEffect(() => {
    const handleStorageChange = () => {
      if (userId) {
        setAvatar(localStorage.getItem(`user_avatar_${userId}`) || '🌱');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userId]);

  return (
    <div style={{ width: 260, background: T.sidebarBg, borderRight: `1px solid ${T.sidebarBorder}`, display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: '"Inter","Segoe UI",system-ui,sans-serif', transition: 'background 0.3s' }}>

      {/* Logo */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.5 }}
        onClick={() => setActiveSection('feed')}
        style={{ 
          padding: '22px 20px 18px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          borderBottom: `1px solid ${T.sidebarBorder}`,
          cursor: 'pointer',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <div style={{ 
          background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#ffffff', 
          borderRadius: 10, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: 32, 
          height: 32, 
          minWidth: 32, 
          flexShrink: 0, 
          boxShadow: isDarkMode ? '0 0 16px rgba(16,185,129,0.25)' : '0 4px 12px rgba(5,150,105,0.12)' 
        }}>
          <BrandLogo size={29} />
        </div>
        <span style={{ fontWeight: 900, fontSize: 18, color: T.sidebarText, letterSpacing: '-0.03em' }}>EcoChat</span>
      </motion.div>

      {/* Nav */}
      <motion.nav 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        <motion.p variants={itemVariants} style={{ fontSize: 10, color: T.sidebarTextMuted, textTransform: 'uppercase', letterSpacing: '0.2em', padding: '6px 12px 4px', fontWeight: 600 }}>Navegação</motion.p>
        {[...MENU, ...(isAdmin ? [{ id: 'admin' as Section, icon: ShieldCheck, label: 'Admin' }] : [])].map(item => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <motion.button key={item.id} onClick={() => setActiveSection(item.id)}
              variants={itemVariants}
              whileHover={{ x: active ? 0 : 4, scale: 1.02 }} whileTap={{ scale: 0.95 }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${active ? T.sidebarItemActiveBorder : 'transparent'}`, background: active ? T.sidebarItemActive : 'transparent', transition: 'background 0.2s, border 0.2s' }}>
              <div style={{ color: active ? T.accent : T.sidebarTextMuted, display: 'flex', transition: 'color 0.2s' }}>
                <Icon size={19} />
              </div>
              <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? T.sidebarText : T.sidebarTextMuted, transition: 'all 0.2s' }}>
                {item.label}
              </span>
              {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: T.accent, boxShadow: isDarkMode ? `0 0 8px ${T.accent}` : 'none' }} />}
            </motion.button>
          );
        })}
      </motion.nav>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{ padding: '12px 12px 20px', borderTop: `1px solid ${T.sidebarBorder}` }}
      >
        {/* Mini profile */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {avatar}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName || 'Utilizador'}</p>
              <p style={{ fontSize: 11, color: T.textMuted }}>Guardião Verde 🌿</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ v: '🔥 5', l: 'sequência' }, { v: '⭐ 120', l: 'pts' }].map(s => (
              <div key={s.l} style={{ flex: 1, background: T.accentSub, border: `1px solid ${T.accentBorder}`, borderRadius: 8, padding: '5px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{s.v}</p>
                <p style={{ fontSize: 9, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Theme toggle */}
        <motion.button onClick={toggleTheme} whileTap={{ scale: 0.97 }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgCard, cursor: 'pointer', color: T.textSub, marginBottom: 6, transition: 'all 0.2s' }}>
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          <span style={{ fontSize: 13, fontWeight: 500 }}>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
        </motion.button>

        {/* Logout */}
        {onLogout && (
          <motion.button onClick={onLogout} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', cursor: 'pointer', color: '#ef4444', transition: 'all 0.2s' }}>
            <LogOut size={15} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Terminar Sessão</span>
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
