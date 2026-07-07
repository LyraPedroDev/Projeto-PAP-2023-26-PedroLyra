import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Crown, Dice5, FileText, Plus, ShieldCheck, Sparkles, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { theme } from '../theme';
import { apiFetch as requestApi } from '../services/api';

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

interface AdminPost {
  id: number;
  user_id: number;
  autor_nome: string;
  autor_email: string | null;
  descricao: string;
  categoria: string;
  imagem: string | null;
  criada_em: string | null;
}

interface AdminMission {
  id: number;
  titulo: string;
  descricao: string;
  pontos: number;
  categoria: string;
  icone: string;
}

interface RandomMission extends AdminMission {}

type AdminTab = 'users' | 'posts' | 'missions';

const MISSION_CATEGORIES = ['daily', 'weekly', 'monthly'];
const MISSION_ICONS = ['Leaf', 'Recycle', 'Droplet', 'Zap'];
const CATEGORY_LABELS: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  geral: 'Geral',
};
const ICON_LABELS: Record<string, string> = {
  Leaf: 'Folha',
  Recycle: 'Reciclagem',
  Droplet: 'Gota',
  Zap: 'Energia',
};

export function AdminSection({ isDarkMode, currentUserId }: AdminSectionProps) {
  const T = theme(isDarkMode);
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [missions, setMissions] = useState<AdminMission[]>([]);
  const [mission, setMission] = useState<RandomMission | null>(null);
  const [postFilterUserId, setPostFilterUserId] = useState('todos');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingMissionId, setEditingMissionId] = useState<number | null>(null);

  const [userForm, setUserForm] = useState({ nome: '', email: '', senha: '', is_admin: false });
  const [postForm, setPostForm] = useState({ user_id: '', descricao: '', categoria: 'geral', imagem: '' });
  const [missionForm, setMissionForm] = useState({ titulo: '', descricao: '', pontos: '10', categoria: 'daily', icone: 'Leaf' });

  const apiFetch = useCallback((input: RequestInfo | URL, init?: RequestInit) => {
    return requestApi(input, init);
  }, []);

  const load = useCallback(async () => {
    const loadJson = async <T,>(url: string): Promise<T> => {
      const response = await apiFetch(url);
      if (!response.ok) {
        throw new Error(url);
      }
      return response.json();
    };

    const [overviewResult, usersResult, postsResult, missionsResult] = await Promise.allSettled([
      loadJson<Overview>('/api/admin/overview'),
      loadJson<AdminUser[]>('/api/admin/users'),
      loadJson<AdminPost[]>('/api/admin/posts'),
      loadJson<AdminMission[]>('/api/admin/missions'),
    ]);

    if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value);
    if (usersResult.status === 'fulfilled') setUsers(usersResult.value);
    if (postsResult.status === 'fulfilled') setPosts(postsResult.value);
    if (missionsResult.status === 'fulfilled') setMissions(missionsResult.value);

    if (
      overviewResult.status === 'rejected' &&
      usersResult.status === 'rejected' &&
      postsResult.status === 'rejected' &&
      missionsResult.status === 'rejected'
    ) {
      throw new Error();
    }
  }, [apiFetch]);

  useEffect(() => {
    load().catch(() => toast.error('Não foi possível carregar o painel administrativo'));
  }, [load]);

  useEffect(() => {
    const loadFallbackMissions = async () => {
      if (missions.length > 0) return;
      const response = await apiFetch('/api/tasks');
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setMissions(data);
      }
    };

    loadFallbackMissions().catch(() => {});
  }, [apiFetch, missions.length]);

  useEffect(() => {
    const loadFallbackPosts = async () => {
      if (posts.length > 0) return;
      const response = await apiFetch(`/api/feed?page=1&limit=100&filtro=para-voce`);
      if (!response.ok) return;
      const payload = await response.json();
      const feedPosts = payload?.data?.posts;
      if (!Array.isArray(feedPosts) || feedPosts.length === 0) return;

      const normalizedPosts: AdminPost[] = feedPosts.map((post: any) => ({
        id: post.id,
        user_id: post.usuario?.id ?? 0,
        autor_nome: post.usuario?.nome ?? 'Utilizador',
        autor_email: post.usuario?.username ? `${post.usuario.username}@...` : null,
        descricao: post.descricao ?? '',
        categoria: post.categoria ?? 'geral',
        imagem: post.imagem_url ?? null,
        criada_em: post.created_at ?? null,
      }));

      setPosts(normalizedPosts);
    };

    loadFallbackPosts().catch(() => {});
  }, [apiFetch, posts.length, currentUserId]);

  const stats = overview ? [
    { label: 'Utilizadores', value: overview.users, icon: Users, color: '#10b981' },
    { label: 'Administradores', value: overview.admins, icon: ShieldCheck, color: '#06b6d4' },
    { label: 'Publicações', value: overview.posts, icon: FileText, color: '#8b5cf6' },
    { label: 'Missões', value: overview.missions, icon: BarChart3, color: '#f59e0b' },
  ] : [];

  const getCategoryLabel = (value: string) => CATEGORY_LABELS[value] || value;
  const getIconLabel = (value: string) => ICON_LABELS[value] || value;
  const filteredPosts = postFilterUserId === 'todos'
    ? posts
    : posts.filter(post => String(post.user_id) === postFilterUserId);

  const tabButtonStyle = (tab: AdminTab) => ({
    border: `1px solid ${activeTab === tab ? T.accentBorder : T.border}`,
    background: activeTab === tab ? T.accentSub : T.bgSurface,
    color: activeTab === tab ? T.accent : T.text,
    borderRadius: 12,
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 800,
  });

  const cardStyle = useMemo(() => ({
    background: T.bgCard,
    border: `1px solid ${T.border}`,
    borderRadius: 20,
    padding: 22,
  }), [T]);

  const inputStyle = {
    width: '100%',
    borderRadius: 12,
    border: `1px solid ${T.border}`,
    background: T.bgSurface,
    color: T.text,
    padding: '11px 13px',
    outline: 'none',
  } as const;

  const textAreaStyle = {
    ...inputStyle,
    minHeight: 90,
    resize: 'vertical' as const,
  };

  const smallButtonStyle = {
    borderRadius: 10,
    padding: '9px 12px',
    cursor: 'pointer',
    border: `1px solid ${T.border}`,
    background: T.bgSurface,
    color: T.text,
    fontWeight: 700,
  } as const;

  const primaryButtonStyle = {
    ...smallButtonStyle,
    background: T.accent,
    color: '#fff',
    border: `1px solid ${T.accent}`,
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setUserForm({ nome: '', email: '', senha: '', is_admin: false });
  };

  const resetPostForm = () => {
    setEditingPostId(null);
    setPostForm({ user_id: '', descricao: '', categoria: 'geral', imagem: '' });
  };

  const resetMissionForm = () => {
    setEditingMissionId(null);
    setMissionForm({ titulo: '', descricao: '', pontos: '10', categoria: 'daily', icone: 'Leaf' });
  };

  const chooseRandomMission = async () => {
    const res = await apiFetch('/api/admin/random-mission');
    if (!res.ok) return toast.error('Não foi possível escolher uma missão');
    setMission(await res.json());
  };

  const toggleRole = async (user: AdminUser) => {
    if (user.id === currentUserId) {
      toast.info('Não podes remover a tua própria permissão nesta sessão.');
      return;
    }

    const res = await apiFetch(`/api/admin/users/${user.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_admin: !user.is_admin }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) return toast.error(data?.erro || data?.mensagem || 'Não foi possível alterar a permissão');

    setUsers(current => current.map(item =>
      item.id === user.id ? { ...item, is_admin: !item.is_admin } : item
    ));
    setOverview(current => current ? {
      ...current,
      admins: current.admins + (user.is_admin ? -1 : 1),
    } : current);
    toast.success('Permissão atualizada com sucesso');
  };

  const submitUser = async () => {
    const isEditing = editingUserId !== null;
    const previousUser = editingUserId !== null
      ? users.find(user => user.id === editingUserId) || null
      : null;
    const payload = {
      nome: userForm.nome,
      email: userForm.email,
      senha: userForm.senha,
      is_admin: userForm.is_admin,
    };

    const res = await apiFetch(
      isEditing ? `/api/admin/users/${editingUserId}` : '/api/admin/users',
      {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json().catch(() => null);
    if (!res.ok) return toast.error(data?.erro || data?.mensagem || 'Não foi possível guardar o utilizador');

    if (isEditing) {
      setUsers(current => current.map(user => user.id === data.id ? data : user));
      if (previousUser && previousUser.is_admin !== data.is_admin) {
        setOverview(current => current ? {
          ...current,
          admins: current.admins + (data.is_admin ? 1 : -1),
        } : current);
      }
      toast.success('Utilizador atualizado com sucesso');
    } else {
      setUsers(current => [...current, data].sort((a, b) => a.id - b.id));
      setOverview(current => current ? {
        ...current,
        users: current.users + 1,
        admins: current.admins + (data.is_admin ? 1 : 0),
      } : current);
      toast.success('Utilizador criado com sucesso');
    }

    resetUserForm();
  };

  const editUser = (user: AdminUser) => {
    setEditingUserId(user.id);
    setUserForm({ nome: user.nome, email: user.email, senha: '', is_admin: user.is_admin });
    setActiveTab('users');
  };

  const removeUser = async (user: AdminUser) => {
    if (user.id === currentUserId) {
      toast.info('Não podes apagar a tua própria conta por aqui.');
      return;
    }
    if (!window.confirm(`Apagar o utilizador "${user.nome}"?`)) return;

    const res = await apiFetch(`/api/admin/users/${user.id}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return toast.error(data?.erro || data?.mensagem || 'Não foi possível apagar o utilizador');

    setUsers(current => current.filter(item => item.id !== user.id));
    const removedPostsCount = posts.filter(post => post.user_id === user.id).length;
    setPosts(current => current.filter(post => post.user_id !== user.id));
    setOverview(current => current ? {
      ...current,
      users: Math.max(current.users - 1, 0),
      admins: Math.max(current.admins - (user.is_admin ? 1 : 0), 0),
      posts: Math.max(current.posts - removedPostsCount, 0),
    } : current);
    toast.success('Utilizador apagado com sucesso');
  };

  const submitPost = async () => {
    const isEditing = editingPostId !== null;
    const payload = {
      user_id: Number(postForm.user_id),
      descricao: postForm.descricao,
      categoria: postForm.categoria,
      imagem: postForm.imagem,
    };

    const res = await apiFetch(
      isEditing ? `/api/admin/posts/${editingPostId}` : '/api/admin/posts',
      {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json().catch(() => null);
    if (!res.ok) return toast.error(data?.erro || data?.mensagem || 'Não foi possível guardar a publicação');

    if (isEditing) {
      setPosts(current => current.map(post => post.id === data.id ? data : post));
      toast.success('Publicação atualizada com sucesso');
    } else {
      setPosts(current => [data, ...current]);
      setOverview(current => current ? { ...current, posts: current.posts + 1 } : current);
      toast.success('Publicação criada com sucesso');
    }

    resetPostForm();
  };

  const editPost = (post: AdminPost) => {
    setEditingPostId(post.id);
    setPostForm({
      user_id: String(post.user_id),
      descricao: post.descricao,
      categoria: post.categoria,
      imagem: post.imagem || '',
    });
    setActiveTab('posts');
  };

  const removePost = async (post: AdminPost) => {
    if (!window.confirm(`Apagar a publicação #${post.id}?`)) return;

    const res = await apiFetch(`/api/admin/posts/${post.id}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return toast.error(data?.erro || data?.mensagem || 'Não foi possível apagar a publicação');

    setPosts(current => current.filter(item => item.id !== post.id));
    setOverview(current => current ? { ...current, posts: Math.max(current.posts - 1, 0) } : current);
    toast.success('Publicação apagada com sucesso');
  };

  const submitMission = async () => {
    const isEditing = editingMissionId !== null;
    const payload = {
      titulo: missionForm.titulo,
      descricao: missionForm.descricao,
      pontos: Number(missionForm.pontos),
      categoria: missionForm.categoria,
      icone: missionForm.icone,
    };

    const res = await apiFetch(
      isEditing ? `/api/admin/missions/${editingMissionId}` : '/api/admin/missions',
      {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json().catch(() => null);
    if (!res.ok) return toast.error(data?.erro || data?.mensagem || 'Não foi possível guardar a missão');

    if (isEditing) {
      setMissions(current => current.map(item => item.id === data.id ? data : item));
      toast.success('Missão atualizada com sucesso');
    } else {
      setMissions(current => [...current, data].sort((a, b) => a.id - b.id));
      setOverview(current => current ? { ...current, missions: current.missions + 1 } : current);
      toast.success('Missão criada com sucesso');
    }

    resetMissionForm();
  };

  const editMission = (item: AdminMission) => {
    setEditingMissionId(item.id);
    setMissionForm({
      titulo: item.titulo,
      descricao: item.descricao,
      pontos: String(item.pontos),
      categoria: item.categoria,
      icone: item.icone,
    });
    setActiveTab('missions');
  };

  const removeMission = async (item: AdminMission) => {
    if (!window.confirm(`Apagar a missão "${item.titulo}"?`)) return;

    const res = await apiFetch(`/api/admin/missions/${item.id}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return toast.error(data?.erro || data?.mensagem || 'Não foi possível apagar a missão');

    setMissions(current => current.filter(missionItem => missionItem.id !== item.id));
    setOverview(current => current ? { ...current, missions: Math.max(current.missions - 1, 0) } : current);
    toast.success('Missão apagada com sucesso');
  };

  const resetDatabase = async () => {
    if (!window.confirm("ATENÇÃO: Tens a certeza que queres APAGAR completamente a base de dados? Esta ação não pode ser desfeita!")) return;
    
    const confirmText = prompt('Escreve "APAGAR TUDO" para confirmar a limpeza da base de dados:');
    if (confirmText !== "APAGAR TUDO") {
      toast.error("Limpeza cancelada. O texto de confirmação não coincide.");
      return;
    }

    try {
      const res = await apiFetch('/api/admin/reset-database', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.erro || 'Erro ao limpar a base de dados');
        return;
      }
      toast.success(data?.mensagem || 'Base de dados limpa com sucesso!');
      load();
    } catch {
      toast.error('Erro de conexão ao servidor.');
    }
  };

  return (
    <div style={{ maxWidth: 1150, margin: '0 auto', color: T.text }}>
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: 24,
          borderRadius: 24,
          border: `1px solid ${isDarkMode ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.12)'}`,
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(6,14,8,0.95), rgba(10,30,18,0.92))'
            : 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
          boxShadow: isDarkMode
            ? '0 12px 32px rgba(0,0,0,0.22)'
            : '0 10px 30px rgba(15,23,42,0.05)',
        }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-500/20">
          <ShieldCheck size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: isDarkMode ? '#34d399' : '#059669', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 6 }}>
            Administração
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: isDarkMode ? '#86efac' : '#0f172a' }}>Painel EcoChat</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: isDarkMode ? 'rgba(255,255,255,0.70)' : '#475569' }}>
            Gere utilizadores, publicações e missões num único lugar.
          </p>
        </div>
        <div>
          <motion.button 
             onClick={resetDatabase}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             style={{ background: '#ef4444', color: 'white', padding: '10px 16px', borderRadius: 12, border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
             title="Apagar Base de Dados"
          >
             <Trash2 size={18} /> <span className="hidden sm:inline">Limpar Dados</span>
          </motion.button>
        </div>
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

      <motion.section whileHover={{ y: -3 }} style={{ ...cardStyle, marginBottom: 18 }}>
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
            <span style={{ display: 'inline-block', marginTop: 9, color: T.accent, fontWeight: 800 }}>+{mission.pontos} pontos · {getCategoryLabel(mission.categoria)}</span>
          </motion.div>
        )}
      </motion.section>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        {([
          { id: 'users', label: 'Utilizadores' },
          { id: 'posts', label: 'Publicações' },
          { id: 'missions', label: 'Missões' },
        ] as const).map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{ ...tabButtonStyle(tab.id), transition: 'all 0.2s ease', boxShadow: activeTab === tab.id ? `0 0 0 1px ${T.accentBorder}, 0 8px 20px rgba(16,185,129,0.12)` : 'none' }}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div style={{ display: 'grid', gap: 18 }}>
          <section style={cardStyle}>
            <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0,1.2fr) minmax(300px,0.8fr)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 19, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Crown size={20} color="#f59e0b" /> {editingUserId ? 'Editar utilizador' : 'Criar utilizador'}
                  </h2>
                  {editingUserId && <button onClick={resetUserForm} style={smallButtonStyle}>Cancelar edição</button>}
                </div>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
                  <input placeholder="Nome" value={userForm.nome} onChange={e => setUserForm(current => ({ ...current, nome: e.target.value }))} style={inputStyle} />
                  <input placeholder="Email" value={userForm.email} onChange={e => setUserForm(current => ({ ...current, email: e.target.value }))} style={inputStyle} />
                  <input placeholder={editingUserId ? 'Nova senha (opcional)' : 'Senha'} type="password" value={userForm.senha} onChange={e => setUserForm(current => ({ ...current, senha: e.target.value }))} style={inputStyle} />
                </div>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, color: T.textSub }}>
                  <input type="checkbox" checked={userForm.is_admin} onChange={e => setUserForm(current => ({ ...current, is_admin: e.target.checked }))} />
                  Definir como administrador
                </label>
                <div style={{ marginTop: 14 }}>
                  <button onClick={submitUser} style={primaryButtonStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> {editingUserId ? 'Guardar alterações' : 'Criar utilizador'}</span>
                  </button>
                </div>
              </div>

              <div style={{ border: `1px solid ${T.border}`, borderRadius: 16, background: T.bgSurface, padding: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Utilizadores já existentes</h3>
                <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {users.length === 0 ? (
                    <p style={{ color: T.textMuted, fontSize: 13 }}>Nenhum utilizador encontrado.</p>
                  ) : users.map(user => (
                    <motion.div key={user.id} whileHover={{ x: 4, scale: 1.01 }}
                      style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bgCard, cursor: 'pointer' }}
                      onClick={() => editUser(user)}>
                      <p style={{ fontWeight: 700 }}>{user.nome}</p>
                      <p style={{ color: T.textMuted, fontSize: 12 }}>{user.email}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 16 }}>Gestão de utilizadores</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {users.length === 0 ? (
                <p style={{ color: T.textMuted, fontSize: 13 }}>Ainda não existem utilizadores para gerir.</p>
              ) : users.map(user => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 13, border: `1px solid ${T.border}`, background: T.bgSurface, flexWrap: 'wrap' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: T.accentSub, color: T.accent, display: 'grid', placeItems: 'center', fontWeight: 900 }}>
                    {user.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p style={{ fontWeight: 750 }}>{user.nome}</p>
                    <p style={{ color: T.textMuted, fontSize: 12 }}>{user.email} · {user.pontos} pts</p>
                  </div>
                  <button onClick={() => toggleRole(user)}
                    style={{ ...smallButtonStyle, border: `1px solid ${user.is_admin ? 'rgba(245,158,11,.35)' : T.border}`, color: user.is_admin ? '#f59e0b' : T.textSub }}>
                    {user.is_admin ? 'Administrador' : 'Utilizador'}
                  </button>
                  <button onClick={() => editUser(user)} style={smallButtonStyle}>Editar</button>
                  <button onClick={() => removeUser(user)} style={{ ...smallButtonStyle, color: '#ef4444' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trash2 size={15} /> Apagar</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'posts' && (
        <div style={{ display: 'grid', gap: 18 }}>
          <section style={cardStyle}>
            <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0,1.2fr) minmax(300px,0.8fr)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 19, fontWeight: 800 }}>{editingPostId ? 'Editar conteúdo publicado' : 'Nova publicação'}</h2>
                  {editingPostId && <button onClick={resetPostForm} style={smallButtonStyle}>Cancelar edição</button>}
                </div>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
                  <select value={postForm.user_id} onChange={e => setPostForm(current => ({ ...current, user_id: e.target.value }))} style={inputStyle}>
                    <option value="">Seleciona o autor</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.nome} ({user.email})</option>
                    ))}
                  </select>
                  <input placeholder="Categoria" value={postForm.categoria} onChange={e => setPostForm(current => ({ ...current, categoria: e.target.value }))} style={inputStyle} />
                  <input placeholder="Nome da imagem (opcional)" value={postForm.imagem} onChange={e => setPostForm(current => ({ ...current, imagem: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'minmax(220px,1fr)', marginTop: 12 }}>
                  <select value={postFilterUserId} onChange={e => setPostFilterUserId(e.target.value)} style={inputStyle}>
                    <option value="todos">Filtrar publicações: todos os utilizadores</option>
                    {users.map(user => (
                      <option key={user.id} value={String(user.id)}>
                        {user.nome} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <textarea placeholder="Descrição da publicação" value={postForm.descricao} onChange={e => setPostForm(current => ({ ...current, descricao: e.target.value }))} style={{ ...textAreaStyle, marginTop: 12 }} />
                <div style={{ marginTop: 14 }}>
                  <button onClick={submitPost} style={primaryButtonStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> {editingPostId ? 'Guardar alterações' : 'Criar publicação'}</span>
                  </button>
                </div>
              </div>

              <div style={{ border: `1px solid ${T.border}`, borderRadius: 16, background: T.bgSurface, padding: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
                  Biblioteca de publicações {postFilterUserId !== 'todos' && '(filtrada)'}
                </h3>
                <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {filteredPosts.length === 0 ? (
                    <p style={{ color: T.textMuted, fontSize: 13 }}>
                      {posts.length === 0 ? 'Nenhuma publicação encontrada.' : 'Nenhuma publicação encontrada para este utilizador.'}
                    </p>
                  ) : filteredPosts.map(post => (
                    <motion.div key={post.id} whileHover={{ x: 4, scale: 1.01 }}
                      style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bgCard, cursor: 'pointer' }}
                      onClick={() => editPost(post)}>
                      <p style={{ fontWeight: 700 }}>#{post.id} · {post.autor_nome}</p>
                      <p style={{ color: T.textMuted, fontSize: 11 }}>{post.autor_email}</p>
                      <p style={{ color: T.textMuted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.descricao}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 16 }}>Controlo de publicações</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {filteredPosts.length === 0 ? (
                <p style={{ color: T.textMuted, fontSize: 13 }}>
                  {posts.length === 0 ? 'Ainda não existem publicações para gerir.' : 'Nenhuma publicação encontrada para o filtro selecionado.'}
                </p>
              ) : filteredPosts.map(post => (
                <div key={post.id} style={{ padding: 16, borderRadius: 13, border: `1px solid ${T.border}`, background: T.bgSurface }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontWeight: 800 }}>#{post.id} · {post.autor_nome}</p>
                      <p style={{ color: T.textMuted, fontSize: 12 }}>{post.autor_email} · {post.categoria}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => editPost(post)} style={smallButtonStyle}>Editar</button>
                      <button onClick={() => removePost(post)} style={{ ...smallButtonStyle, color: '#ef4444' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trash2 size={15} /> Apagar</span>
                      </button>
                    </div>
                  </div>
                  <p style={{ marginTop: 10, color: T.textSub }}>{post.descricao}</p>
                  {post.imagem && <p style={{ marginTop: 8, fontSize: 12, color: T.textMuted }}>Imagem: {post.imagem}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'missions' && (
        <div style={{ display: 'grid', gap: 18 }}>
          <section style={cardStyle}>
            <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0,1.2fr) minmax(300px,0.8fr)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 19, fontWeight: 800 }}>{editingMissionId ? 'Editar missão ecológica' : 'Nova missão ecológica'}</h2>
                  {editingMissionId && <button onClick={resetMissionForm} style={smallButtonStyle}>Cancelar edição</button>}
                </div>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
                  <input placeholder="Título" value={missionForm.titulo} onChange={e => setMissionForm(current => ({ ...current, titulo: e.target.value }))} style={inputStyle} />
                  <input placeholder="Pontos" type="number" min={0} value={missionForm.pontos} onChange={e => setMissionForm(current => ({ ...current, pontos: e.target.value }))} style={inputStyle} />
                  <select value={missionForm.categoria} onChange={e => setMissionForm(current => ({ ...current, categoria: e.target.value }))} style={inputStyle}>
                    {MISSION_CATEGORIES.map(item => <option key={item} value={item}>{getCategoryLabel(item)}</option>)}
                  </select>
                  <select value={missionForm.icone} onChange={e => setMissionForm(current => ({ ...current, icone: e.target.value }))} style={inputStyle}>
                    {MISSION_ICONS.map(item => <option key={item} value={item}>{getIconLabel(item)}</option>)}
                  </select>
                </div>
                <textarea placeholder="Descrição da missão" value={missionForm.descricao} onChange={e => setMissionForm(current => ({ ...current, descricao: e.target.value }))} style={{ ...textAreaStyle, marginTop: 12 }} />
                <div style={{ marginTop: 14 }}>
                  <button onClick={submitMission} style={primaryButtonStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> {editingMissionId ? 'Guardar alterações' : 'Criar missão'}</span>
                  </button>
                </div>
              </div>

              <div style={{ border: `1px solid ${T.border}`, borderRadius: 16, background: T.bgSurface, padding: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Biblioteca de missões</h3>
                <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {missions.length === 0 ? (
                    <p style={{ color: T.textMuted, fontSize: 13 }}>Nenhuma missão encontrada.</p>
                  ) : missions.map(item => (
                    <motion.div key={item.id} whileHover={{ x: 4, scale: 1.01 }}
                      style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bgCard, cursor: 'pointer' }}
                      onClick={() => editMission(item)}>
                      <p style={{ fontWeight: 700 }}>{item.titulo}</p>
                      <p style={{ color: T.textMuted, fontSize: 12 }}>{getCategoryLabel(item.categoria)} · +{item.pontos} pontos</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 16 }}>Controlo de missões</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {missions.length === 0 ? (
                <p style={{ color: T.textMuted, fontSize: 13 }}>Ainda não existem missões para gerir.</p>
              ) : missions.map(item => (
                <div key={item.id} style={{ padding: 16, borderRadius: 13, border: `1px solid ${T.border}`, background: T.bgSurface }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontWeight: 800 }}>{item.titulo}</p>
                      <p style={{ color: T.textMuted, fontSize: 12 }}>{getCategoryLabel(item.categoria)} · {getIconLabel(item.icone)} · +{item.pontos} pontos</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => editMission(item)} style={smallButtonStyle}>Editar</button>
                      <button onClick={() => removeMission(item)} style={{ ...smallButtonStyle, color: '#ef4444' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trash2 size={15} /> Apagar</span>
                      </button>
                    </div>
                  </div>
                  <p style={{ marginTop: 10, color: T.textSub }}>{item.descricao}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
