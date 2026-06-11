import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Award, Shield, Flame, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface RankingUser {
  id: number;
  nome: string;
  pontos: number;
  nivel: string;
  tarefas_completas: number;
  posicao: number;
  isFriend?: boolean;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: RankingUser | null;
  currentUserId: number;
}

export function UserProfileModal({ isOpen, onClose, user, currentUserId }: UserProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFriendState, setIsFriendState] = useState<boolean | undefined>(undefined);

  // Sync friend state when user changes
  useEffect(() => {
    if (user) {
      setIsFriendState(user.isFriend);
    }
  }, [user]);

  if (!user) return null;

  const isCurrentUser = user.id === currentUserId;
  const isAlreadyFriend = isFriendState === true;

  const handleAddFriend = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, alvo: user.id }),
      });
      const data = await res.json();
      if (res.ok && data.sucesso) {
        toast.success(data.mensagem || 'Convite enviado! 🚀');
        // Pre-emptively update modal UI state if API indicates success/already sent
        setIsFriendState(false); // Can be kept as request pending
      } else {
        toast.error(data.erro || 'Erro ao enviar convite');
      }
    } catch (error) {
      console.error('Erro ao adicionar amigo:', error);
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine avatar icon based on level
  const getAvatar = (nivel: string) => {
    const avatarMap: { [key: string]: string } = {
      'Eco Master': '🌟',
      'Defensor Verde': '🌱',
      'Guardião Verde': '🌲',
      'Eco Iniciante': '🌿'
    };
    return avatarMap[nivel] || '🍃';
  };

  // Mock accomplishments badges based on user stats
  const getBadges = () => {
    const badges = [];
    if (user.pontos >= 100) {
      badges.push({ name: 'Eco Iniciado', desc: 'Conseguiu mais de 100 pontos', icon: '🌱', color: '#10b981' });
    }
    if (user.tarefas_completas >= 5) {
      badges.push({ name: 'Executor Verde', desc: 'Completou 5+ tarefas', icon: '✅', color: '#3b82f6' });
    }
    if (user.pontos >= 500) {
      badges.push({ name: 'Protetor da Terra', desc: 'Conseguiu mais de 500 pontos', icon: '🌍', color: '#f59e0b' });
    }
    if (badges.length === 0) {
      badges.push({ name: 'Recém Chegado', desc: 'Começando a jornada ecológica', icon: '🍃', color: '#6b7280' });
    }
    return badges;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
            fontFamily: '"Inter", sans-serif',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              color: '#0d1f14',
              borderRadius: '24px',
              padding: '32px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              border: '1px solid rgba(16, 185, 129, 0.1)',
            }}
            className="dark:bg-[#060e08] dark:text-[#ffffff] dark:border-gray-800"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                opacity: 0.6,
                padding: '4px',
                borderRadius: '50%',
              }}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>

            {/* User Info Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
                }}
              >
                {getAvatar(user.nivel)}
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                {user.nome}
              </h2>
              <span style={{ fontSize: '14px', opacity: 0.6 }}>Posição no Ranking: #{user.posicao}</span>
            </div>

            {/* Quick Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  textAlign: 'center',
                }}
              >
                <Flame style={{ color: '#10b981', margin: '0 auto 6px' }} size={20} />
                <span style={{ display: 'block', fontSize: '18px', fontWeight: 800 }}>{user.pontos}</span>
                <span style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pontos
                </span>
              </div>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.06)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  textAlign: 'center',
                }}
              >
                <CheckCircle2 style={{ color: '#3b82f6', margin: '0 auto 6px' }} size={20} />
                <span style={{ display: 'block', fontSize: '18px', fontWeight: 800 }}>{user.tarefas_completas}</span>
                <span style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Desafios
                </span>
              </div>
            </div>

            {/* Achievements Section */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, opacity: 0.8, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={16} /> Conquistas
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getBadges().map((badge) => (
                  <div
                    key={badge.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      backgroundColor: '#fbfdfc',
                    }}
                    className="dark:bg-gray-800/40 dark:border-gray-800"
                  >
                    <span style={{ fontSize: '20px' }}>{badge.icon}</span>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>{badge.name}</p>
                      <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {isCurrentUser ? (
                <button
                  disabled
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.06)',
                    color: 'inherit',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    cursor: 'not-allowed',
                    opacity: 0.5,
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  📌 Este é o seu perfil
                </button>
              ) : isAlreadyFriend ? (
                <button
                  disabled
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    cursor: 'not-allowed',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  ✓ Já são amigos
                </button>
              ) : (
                <button
                  onClick={handleAddFriend}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => !isLoading && (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => !isLoading && (e.currentTarget.style.opacity = '1')}
                >
                  {isLoading ? 'Enviando...' : '+ Adicionar Amigo'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
