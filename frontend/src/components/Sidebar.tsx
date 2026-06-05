import { motion } from 'motion/react';
import { MessageCircle, Trophy, CheckSquare, Users, User, Newspaper, LogOut, Sun, Moon, MessageSquareDot } from 'lucide-react';
import { LeafLogo } from './ui/LeafLogo';
import { theme } from '../theme';

// Incluir 'private' no tipo Section
type Section = 'feed' | 'ranking' | 'tasks' | 'friends' | 'profile' | 'private';

interface SidebarProps {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  onLogout?: () => void;
  userName?: string;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const MENU = [
  { id: 'feed' as Section,    icon: Newspaper,        label: 'Feed'      },
  { id: 'private' as Section, icon: MessageSquareDot, label: 'Mensagens' },
  { id: 'ranking' as Section, icon: Trophy,           label: 'Ranking'   },
  { id: 'tasks' as Section,   icon: CheckSquare,      label: 'Missões'   },
  { id: 'friends' as Section, icon: Users,            label: 'Amigos'    },
  { id: 'profile' as Section, icon: User,             label: 'Perfil'    },
];

export function Sidebar({ activeSection, setActiveSection, onLogout, userName, isDarkMode, toggleTheme }: SidebarProps) {
  const T = theme(isDarkMode);
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'EC';

  return (
    <div style={{ width: 260, background: T.sidebarBg, borderRight: `1px solid ${T.sidebarBorder}`, display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: '"Inter","Segoe UI",system-ui,sans-serif', transition: 'background 0.3s' }}>

      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${T.sidebarBorder}` }}>
        <div style={{ 
          background: 'linear-gradient(135deg,#10b981,#059669)', 
          borderRadius: 10, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: 32, 
          height: 32, 
          minWidth: 32, 
          flexShrink: 0, 
          boxShadow: isDarkMode ? '0 0 16px rgba(16,185,129,0.4)' : 'none' 
        }}>
          <LeafLogo size={17} color="white" />
        </div>
        <span style={{ fontWeight: 900, fontSize: 18, color: T.sidebarText, letterSpacing: '-0.03em' }}>EcoChat</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <p style={{ fontSize: 10, color: T.sidebarTextMuted, textTransform: 'uppercase', letterSpacing: '0.2em', padding: '6px 12px 4px', fontWeight: 600 }}>Navegação</p>
        {MENU.map(item => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <motion.button key={item.id} onClick={() => setActiveSection(item.id)}
              whileHover={{ x: active ? 0 : 3 }} whileTap={{ scale: 0.98 }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${active ? T.sidebarItemActiveBorder : 'transparent'}`, background: active ? T.sidebarItemActive : 'transparent', transition: 'all 0.2s' }}>
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
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 12px 20px', borderTop: `1px solid ${T.sidebarBorder}` }}>
        {/* Mini profile */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName || 'Utilizador'}</p>
              <p style={{ fontSize: 11, color: T.textMuted }}>Guardião Verde 🌿</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ v: '🔥 5', l: 'streak' }, { v: '⭐ 120', l: 'pts' }].map(s => (
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
      </div>
    </div>
  );
}
