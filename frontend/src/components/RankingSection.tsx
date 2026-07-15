import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Award, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { UserProfileModal } from './UserProfileModal';
import { apiFetch, apiJson } from '../services/api';
import { useTutorial } from '../tutorial/TutorialProvider';
import { TutorialTarget } from '../tutorial/TutorialTarget';

interface RankingUser {
  id: number;
  nome: string;
  pontos: number;
  nivel: string;
  tarefas_completas: number;
  posicao: number;
  isFriend?: boolean;
}

interface RankingSectionProps {
  userId: number;
}

export function RankingSection({ userId }: RankingSectionProps) {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { state, notifySectionReady } = useTutorial();
  
  // User profile modal states
  const [selectedUser, setSelectedUser] = useState<RankingUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openUserProfile = async (user: RankingUser) => {
    try {
      const friendsList = await apiJson<Array<{ id: number }>>('/api/friends');
      const isFriend = friendsList.some((friend) => friend.id === user.id);
      setSelectedUser({ ...user, isFriend });
    } catch {
      setSelectedUser(user);
    }
    setIsModalOpen(true);
  };

  // Mapeamento de avatares baseado no nível
  const getAvatar = (nivel: string) => {
    const avatarMap: { [key: string]: string } = {
      'Eco Master': '🌟',
      'Defensor Verde': '🌱',
      'Guardião Verde': '🌲',
      'Eco Iniciante': '🌿'
    };
    return avatarMap[nivel] || '🍃';
  };

  // 🔥 BUSCAR RANKING DO BACKEND
  const fetchRanking = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      
      const res = await apiFetch('/api/ranking');
      const data = await res.json();

      if (res.ok) {
        setUsers(data);
        if (showToast) toast.success('Ranking atualizado! 🏆');
      } else {
        toast.error('Erro ao carregar ranking');
      }
    } catch {
      if (showToast) toast.error('Erro ao conectar ao servidor');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 🔥 ATUALIZAR AUTOMATICAMENTE A CADA 30 SEGUNDOS
  useEffect(() => {
    fetchRanking();

    const interval = setInterval(() => {
      fetchRanking();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Notificar o tutorial que a secção carregou os dados
  useEffect(() => {
    if (!isLoading && state.status === 'waiting' && state.requestedSection === 'ranking' && state.activeRequestId) {
      notifySectionReady({
        section: 'ranking',
        requestId: state.activeRequestId,
        status: 'ready'
      });
    }
  }, [isLoading, state.status, state.requestedSection, state.activeRequestId, notifySectionReady]);

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Trophy className="text-yellow-500" size={24} />;
    if (position === 2) return <Medal className="text-gray-400" size={24} />;
    if (position === 3) return <Award className="text-orange-600" size={24} />;
    return <span className="text-gray-500">#{position}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-500/20">
            <Trophy size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: isDarkMode ? '#86efac' : '#0f172a' }}>Ranking Global</h1>
            <p style={{ fontSize: 14, marginTop: 4, color: isDarkMode ? 'rgba(255,255,255,0.70)' : '#475569' }}>
              Veja os usuários mais engajados na comunidade
            </p>
          </div>
        </div>
        <Button
          onClick={() => fetchRanking(true)}
          disabled={isRefreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={16} />
          Atualizar
        </Button>
      </motion.div>

      {/* Top 3 */}
      <TutorialTarget id="tour-ranking-board" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.slice(0, 3).map((user, index) => {
          const isCurrentUser = user.id === userId;
          
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.15, type: 'spring', stiffness: 200, damping: 20 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openUserProfile(user)}
              style={{ cursor: 'pointer' }}
            >
              <Card className={`text-center h-full hover:shadow-md transition-shadow ${
                index === 0 
                  ? 'border-yellow-400 dark:border-yellow-600 bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800' 
                  : 'border-green-200 dark:border-gray-700'
              } ${isCurrentUser ? 'ring-2 ring-green-500' : ''}`}>
                <CardHeader>
                  <div className="flex justify-center mb-2">
                    {getMedalIcon(user.posicao)}
                  </div>
                  <Avatar className="mx-auto w-16 h-16 text-2xl">
                    <AvatarFallback>{localStorage.getItem(`user_avatar_${user.id}`) || getAvatar(user.nivel)}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center justify-center gap-2">
                    <CardTitle className="dark:text-gray-200">{user.nome}</CardTitle>
                    {isCurrentUser && <Badge className="bg-green-500">Você</Badge>}
                  </div>
                  <CardDescription className="dark:text-gray-400">{user.nivel}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-green-600 dark:text-green-400 text-lg font-bold">
                    {user.pontos} pontos
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {user.tarefas_completas} tarefas
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </TutorialTarget>

      {/* Rest of ranking */}
      {users.length > 3 && (
        <Card className="border-green-200 dark:border-gray-700">
          <CardContent className="p-4 lg:p-6">
            <div className="space-y-3">
              {users.slice(3).map((user, index) => {
                const isCurrentUser = user.id === userId;
                
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
                    whileHover={{ scale: 1.01, x: 5, backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openUserProfile(user)}
                    style={{ cursor: 'pointer' }}
                    className={`flex items-center gap-4 p-3 lg:p-4 rounded-lg transition-all ${
                      isCurrentUser 
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-600' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="w-8 text-center flex-shrink-0">
                      {getMedalIcon(user.posicao)}
                    </div>
                    <Avatar className="flex-shrink-0">
                      <AvatarFallback>{localStorage.getItem(`user_avatar_${user.id}`) || getAvatar(user.nivel)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="dark:text-gray-200 truncate">{user.nome}</span>
                        {isCurrentUser && <Badge className="bg-green-500 flex-shrink-0">Você</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.nivel} • {user.tarefas_completas} tarefas
                      </p>
                    </div>
                    <div className="text-green-600 dark:text-green-400 font-semibold flex-shrink-0">
                      {user.pontos} pts
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {users.length === 0 && (
        <Card className="border-green-200 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum usuário no ranking ainda
            </p>
          </CardContent>
        </Card>
      )}

      <UserProfileModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        currentUserId={userId}
      />
    </div>
  );
}
