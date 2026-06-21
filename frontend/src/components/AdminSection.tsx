import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Crown, Dice5, FileText, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { theme } from '../theme';

interface AdminSectionProps {
  isDarkMode: boolean;
  currentUserId: number;
}

interface Overview {
  users: number;
  admins: number;
  posts: number;
  missions: number;
  points: number;
}

interface AdminUser {
  id: number;
  nome: string;
  email: string;
  is_admin: boolean;
  pontos: number;
}

interface RandomMission {
  id: number;
  titulo: string;
  descricao: string;
  pontos: number;
  categoria: string;
}

export function AdminSection({ isDarkMode, currentUserId }: AdminSectionProps) {
  const T = theme(isDarkMode);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [mission, setMission] = useState<RandomMission | null>(null);

  const load = useCallback(async () => {
    const [overviewRes, usersRes] = await Promise.all([
      fetch('/api/admin/overview', { credentials: 'include' }),
      fetch('/api/admin/users', { credentials: 'include' }),
    ]);
    if (!overviewRes.ok || !usersRes.ok) throw new Error();
    setOverview(await overviewRes.json());
    setUsers(await usersRes.json());
  }, []);

  useEffect(() => {
    load().catch(() => toast.error('Não foi possível carregar o painel administrativo'));
  }, [load]);

  const toggleRole = async (user: AdminUser) => {
    if (user.id === currentUserId) {
      toast.info('Não podes remover a tua própria permissão nesta sessão.');
      return;
    }
    const res = await fetch(`/api/admin/users/${user.id}/role`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_admin: !user.is_admin }),
    });
    if (!res.ok) return toast.error('Não foi possível alterar a permissão');
    setUsers(current => current.map(item =>
      item.id === user.id ? { ...item, is_admin: !item.is_admin } : item
    ));
    setOverview(current => current ? {
      ...current,
      admins: current.admins + (user.is_admin ? -1 : 1),
    } : current);
  };

  const chooseRandomMission = async () => {
    const res = await fetch('/api/admin/random-mission', { credentials: 'include' });
    if (!res.ok) return toast.error('Não foi possível escolher uma missão');
    setMission(await res.json());
  };

  const stats = overview ? [
    { label: 'Utilizadores', value: overview.users, icon: Users, color: '#10b981' },
    { label: 'Administradores', value: overview.admins, icon: ShieldCheck, color: '#06b6d4' },
    { label: 'Publicações', value: overview.posts, icon: FileText, color: '#8b5cf6' },
    { label: 'Missões', value: overview.missions, icon: BarChart3, color: '#f59e0b' },
  ] : [];

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', color: T.text }}>
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color: T.accent, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
          Administração
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: '5px 0 6px' }}>Painel EcoChat</h1>
        <p style={{ color: T.textSub }}>Acompanha a comunidade e gere as permissões num único lugar.</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, margin: '26px 0' }}>
        {stats.map(({ label, value, icon: Icon, color }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            whileHover={{ y: -5, scale: 1.015 }}
            style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18, padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
          >
            <Icon size={21} color={color} />
            <p style={{ fontSize: 30, fontWeight: 900, marginTop: 14 }}>{value}</p>
            <p style={{ color: T.textMuted, fontSize: 13 }}>{label}</p>
          </motion.div>
        ))}
      </div>

      <motion.section
        whileHover={{ y: -3 }}
        style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22, marginBottom: 18 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Dice5 size={20} color={T.accent} /> Missão aleatória
            </h2>
            <p style={{ color: T.textSub, fontSize: 13, marginTop: 4 }}>Seleciona uma missão existente para destacar ou demonstrar.</p>
          </div>
          <motion.button
            onClick={chooseRandomMission}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{ border: 0, borderRadius: 12, padding: '11px 18px', background: T.accent, color: '#fff', cursor: 'pointer', fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center' }}
          >
            <Sparkles size={17} /> Sortear missão
          </motion.button>
        </div>
        {mission && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            style={{ marginTop: 18, padding: 18, borderRadius: 14, background: T.accentSub, border: `1px solid ${T.accentBorder}` }}>
            <strong>{mission.titulo}</strong>
            <p style={{ color: T.textSub, fontSize: 13, marginTop: 5 }}>{mission.descricao}</p>
            <span style={{ display: 'inline-block', marginTop: 9, color: T.accent, fontWeight: 800 }}>+{mission.pontos} pontos</span>
          </motion.div>
        )}
      </motion.section>

      <motion.section
        whileHover={{ y: -3 }}
        style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22 }}
      >
        <h2 style={{ fontSize: 19, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Crown size={20} color="#f59e0b" /> Utilizadores e permissões
        </h2>
        <div style={{ display: 'grid', gap: 9 }}>
          {users.map(user => (
            <motion.div key={user.id} whileHover={{ x: 3 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 13, border: `1px solid ${T.border}`, background: T.bgSurface }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: T.accentSub, color: T.accent, display: 'grid', placeItems: 'center', fontWeight: 900 }}>
                {user.nome?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 750 }}>{user.nome}</p>
                <p style={{ color: T.textMuted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email} · {user.pontos} pts</p>
              </div>
              <button onClick={() => toggleRole(user)}
                style={{ borderRadius: 10, padding: '8px 12px', cursor: 'pointer', border: `1px solid ${user.is_admin ? 'rgba(245,158,11,.35)' : T.border}`, background: user.is_admin ? 'rgba(245,158,11,.12)' : 'transparent', color: user.is_admin ? '#f59e0b' : T.textSub, fontWeight: 700, fontSize: 12 }}>
                {user.is_admin ? 'Administrador' : 'Utilizador'}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
