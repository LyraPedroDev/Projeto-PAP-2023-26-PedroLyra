import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, LogOut, Save, Flame, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface ProfileSectionProps {
  onLogout: () => void;
  userId: number;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export function ProfileSection({ onLogout, userId, isDarkMode = false, toggleTheme }: ProfileSectionProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [userStats, setUserStats] = useState({
    level: 'Carregando...',
    points: 0,
    nextLevel: 2000,
    tasksCompleted: 0,
    friendsCount: 0,
    daysActive: 0,
    streak: 0,
    avatar: localStorage.getItem(`user_avatar_${userId}`) || '🌱'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedTempAvatar, setSelectedTempAvatar] = useState(userStats.avatar);

  const EMOJIS = [
    '🌱', '🌿', '🌲', '🍀', '🍃', '🦁', '🐼', '🦊', '🐨', '🐳',
    '😎', '🤓', '😊', '🔥', '✨', '🌍', '⚡', '💧', '♻️', '🏆'
  ];

  const handleSaveAvatar = () => {
    localStorage.setItem(`user_avatar_${userId}`, selectedTempAvatar);
    setUserStats(prev => ({ ...prev, avatar: selectedTempAvatar }));
    setIsAvatarModalOpen(false);
    toast.success('Imagem de perfil atualizada! 🤩');
    // Forçar recarga da Sidebar/Header disparando evento global
    window.dispatchEvent(new Event('storage'));
  };

  const achievements = [
    { id: 1, title: 'Primeira Tarefa', description: 'Complete sua primeira tarefa', icon: '🎯', earned: userStats.tasksCompleted > 0 },
    { id: 2, title: 'Eco Iniciante', description: 'Alcance 500 pontos', icon: '🌿', earned: userStats.points >= 500 },
    { id: 3, title: 'Semana Verde', description: '7 dias consecutivos', icon: '📅', earned: userStats.daysActive >= 7 },
    { id: 4, title: 'Social', description: 'Adicione 10 amigos', icon: '👥', earned: userStats.friendsCount >= 10 },
    { id: 5, title: 'Eco Master', description: 'Alcance 2000 pontos', icon: '🏆', earned: userStats.points >= 2000 },
    { id: 6, title: 'Mês Sustentável', description: '30 dias consecutivos', icon: '🗓️', earned: userStats.daysActive >= 30 }
  ];

  // 🔥 BUSCAR DADOS DO PERFIL AO CARREGAR
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${userId}`);
        const data = await res.json();

        if (res.ok) {
          setFormData({
            name: data.nome,
            email: data.email,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });

          setUserStats({
            level: data.nivel,
            points: data.pontos,
            nextLevel: data.proximo_nivel,
            tasksCompleted: data.tarefas_completas,
            friendsCount: data.amigos_count,
            daysActive: data.dias_ativos,
            streak: data.streak ?? 0,
            avatar: localStorage.getItem(`user_avatar_${userId}`) || '🌱'
          });
        } else {
          toast.error('Erro ao carregar perfil');
        }
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
        toast.error('Erro ao conectar ao servidor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // 🔥 SALVAR ALTERAÇÕES DO PERFIL
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          nome: formData.name,
          email: formData.email
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Perfil atualizado com sucesso! 🌿');
        // Atualizar localStorage se mudou email
        if (formData.email !== localStorage.getItem('user_email')) {
          localStorage.setItem('user_email', formData.email);
        }
      } else {
        toast.error(data.erro || 'Erro ao atualizar perfil');
      }
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      toast.error('Erro ao conectar ao servidor');
    }
  };

  // 🔥 ALTERAR SENHA
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Preencha todos os campos de senha');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          senha_atual: formData.currentPassword,
          senha_nova: formData.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Senha alterada com sucesso! 🔒');
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.erro || 'Erro ao alterar senha');
      }
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      toast.error('Erro ao conectar ao servidor');
    }
  };

  const progressToNextLevel = (userStats.points / userStats.nextLevel) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-green-800 dark:text-green-300 mb-2">Meu Perfil</h1>
        <p className="text-gray-600 dark:text-gray-400">Gerencie suas informações e configurações</p>
      </motion.div>

      {/* Profile overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-green-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex flex-col items-center lg:items-start gap-4">
                {/* Avatar clicável com overlay de edição */}
                <div 
                  onClick={() => {
                    setSelectedTempAvatar(userStats.avatar);
                    setIsAvatarModalOpen(true);
                  }}
                  className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden"
                >
                  <Avatar className="w-24 h-24 text-4xl">
                    <AvatarFallback>{userStats.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-white text-xs font-semibold">Editar</span>
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <h2 className="text-green-800 dark:text-green-300">{formData.name}</h2>
                  <Badge className="bg-green-500 mt-2">{userStats.level}</Badge>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                {/* Streak em destaque */}
                <AnimatePresence>
                  {userStats.streak > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-orange-500 to-amber-500"
                    >
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
                      <div className="relative flex items-center gap-4">
                        <motion.div
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-4xl"
                        >
                          🔥
                        </motion.div>
                        <div>
                          <p className="text-orange-100 text-xs font-semibold uppercase tracking-widest">Sequência atual</p>
                          <p className="text-white font-black text-3xl leading-none">
                            {userStats.streak} {userStats.streak === 1 ? 'dia' : 'dias'}
                          </p>
                          <p className="text-orange-200 text-xs mt-0.5">
                            {userStats.streak >= 30 ? '🏆 Lendário!' :
                             userStats.streak >= 14 ? '⭐ Imparável!' :
                             userStats.streak >= 7  ? '💪 Uma semana!' :
                             userStats.streak >= 3  ? '👍 A ganhar ritmo!' :
                             'Continua assim!'}
                          </p>
                        </div>
                        <div className="ml-auto text-right">
                          <Flame size={32} className="text-orange-200 opacity-60" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Progresso para o próximo nível
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400">
                      {userStats.points} / {userStats.nextLevel} pts
                    </span>
                  </div>
                  <Progress value={progressToNextLevel} />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="text-green-600 dark:text-green-400 font-bold">{userStats.points}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Pontos</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-blue-600 dark:text-blue-400 font-bold">{userStats.tasksCompleted}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Tarefas</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <div className="text-purple-600 dark:text-purple-400 font-bold">{userStats.friendsCount}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Amigos</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <div className="text-orange-600 dark:text-orange-400 font-bold">{userStats.daysActive}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Dias ativos</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-green-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-200">Conquistas</CardTitle>
            <CardDescription className="dark:text-gray-400">
              {achievements.filter(a => a.earned).length} de {achievements.length} conquistadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    achievement.earned
                      ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50'
                  }`}
                >
                  <div className="text-2xl mb-2">{achievement.icon}</div>
                  <div className="dark:text-gray-200">{achievement.title}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-green-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-200">Editar Perfil</CardTitle>
            <CardDescription className="dark:text-gray-400">Atualize suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-gray-200">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-gray-200">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                <Save size={20} className="mr-2" />
                Salvar Alterações
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-green-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-200">Alterar Senha</CardTitle>
            <CardDescription className="dark:text-gray-400">Mantenha sua conta segura</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="dark:text-gray-200">Senha Atual</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="dark:text-gray-200">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="dark:text-gray-200">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                <Lock size={20} className="mr-2" />
                Alterar Senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-green-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-200">Preferências</CardTitle>
            <CardDescription className="dark:text-gray-400">Personaliza a tua experiência</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-amber-500" />}
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Alterna entre tema claro e escuro</p>
                </div>
              </div>
              {toggleTheme && (
                <button
                  onClick={toggleTheme}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                    isDarkMode ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-red-200 dark:border-red-900/50">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-red-600 dark:text-red-400">Sair da Conta</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Desconectar-se do EcoChat</p>
              </div>
              <Button
                onClick={onLogout}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut size={20} className="mr-2" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de Seleção de Avatar */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div
            onClick={() => setIsAvatarModalOpen(false)}
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
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: isDarkMode ? '#060e08' : '#ffffff',
                color: isDarkMode ? '#ffffff' : '#0d1f14',
                borderRadius: '24px',
                padding: '28px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(16, 185, 129, 0.1)',
                textAlign: 'center'
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Alterar Imagem de Perfil</h3>
              <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '20px' }}>Escolha um emoji para representar sua jornada ecológica</p>
              
              {/* Preview */}
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  margin: '0 auto 24px',
                  boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
                }}
              >
                {selectedTempAvatar}
              </div>

              {/* Grid of Emojis */}
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(5, 1fr)', 
                  gap: '10px', 
                  marginBottom: '24px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '4px'
                }}
              >
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedTempAvatar(emoji)}
                    style={{
                      fontSize: '26px',
                      padding: '8px',
                      borderRadius: '12px',
                      border: selectedTempAvatar === emoji ? '2px solid #10b981' : (isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)'),
                      background: selectedTempAvatar === emoji ? 'rgba(16,185,129,0.15)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setIsAvatarModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                    background: 'transparent',
                    color: 'inherit',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAvatar}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}