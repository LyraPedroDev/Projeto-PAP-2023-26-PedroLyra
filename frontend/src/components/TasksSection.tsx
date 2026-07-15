import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Leaf, Droplet, Recycle, Zap, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { apiFetch } from '../services/api';
import { useTutorial } from '../tutorial/TutorialProvider';
import { TutorialTarget } from '../tutorial/TutorialTarget';

interface Task {
  id: number;
  titulo: string;
  descricao: string;
  pontos: number;
  completada: boolean;
  icone: string;
  categoria: 'daily' | 'weekly' | 'monthly';
}

interface TasksSectionProps {
  userId: number;
  isDarkMode?: boolean;
}

// Componente MissionRow para uma lista minimalista
function MissionRow({ task, onToggle, isDarkMode }: { task: Task; onToggle: (taskId: number, currentStatus: boolean) => Promise<void>; isDarkMode: boolean }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const getIcon = () => {
    const icon = task.icone.toLowerCase();
    if (icon === 'droplet') return <Droplet size={24} className="text-blue-500" />;
    if (icon === 'zap') return <Zap size={24} className="text-yellow-500" />;
    if (icon === 'recycle') return <Recycle size={24} className="text-emerald-500" />;
    return <Leaf size={24} className="text-green-500" />;
  };

  const getIconBg = () => {
    const icon = task.icone.toLowerCase();
    if (icon === 'droplet') return "bg-blue-100 dark:bg-blue-900/30";
    if (icon === 'zap') return "bg-yellow-100 dark:bg-yellow-900/30";
    if (icon === 'recycle') return "bg-emerald-100 dark:bg-emerald-900/30";
    return "bg-green-100 dark:bg-green-900/30";
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await onToggle(task.id, task.completada);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ scale: 1.01 }}
      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl transition-all"
      style={{
        border: task.completada
          ? (isDarkMode ? '1px solid rgba(34,197,94,0.28)' : '1px solid rgba(34,197,94,0.18)')
          : (isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.08)'),
        background: task.completada
          ? (isDarkMode ? 'rgba(20,83,45,0.35)' : 'rgba(220,252,231,0.9)')
          : (isDarkMode ? '#0d1711' : '#ffffff'),
        boxShadow: isDarkMode ? 'none' : '0 10px 24px rgba(15,23,42,0.04)',
      }}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
        <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${task.completada ? 'bg-green-500 text-white' : getIconBg()}`}
        style={!task.completada ? { background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)' } : undefined}
      >
        {task.completada ? <CheckCircle2 size={24} className="text-white" /> : getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <h3
          className="font-bold text-base line-clamp-2 sm:truncate leading-tight"
          style={{
            color: task.completada
              ? (isDarkMode ? 'rgba(255,255,255,0.72)' : '#166534')
              : (isDarkMode ? '#f8fafc' : '#0f172a'),
            textDecoration: task.completada ? 'line-through' : 'none',
          }}
        >
          {task.titulo}
        </h3>
        <p
          className="text-sm line-clamp-2 sm:truncate mt-0.5"
          style={{
            color: task.completada
              ? (isDarkMode ? 'rgba(255,255,255,0.52)' : '#15803d')
              : (isDarkMode ? 'rgba(255,255,255,0.72)' : '#475569'),
          }}
        >
          {task.descricao}
        </p>
      </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
        <Badge
          variant="secondary"
          className="font-bold border-0 h-10 px-3 flex items-center justify-center whitespace-nowrap"
          style={{
            background: task.completada
              ? (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(34,197,94,0.12)')
              : (isDarkMode ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.12)'),
            color: task.completada
              ? (isDarkMode ? 'rgba(255,255,255,0.74)' : '#15803d')
              : (isDarkMode ? '#86efac' : '#16a34a'),
          }}
        >
          +{task.pontos} pts
        </Badge>
        
        <motion.button
          onClick={handleToggle}
          disabled={isUpdating}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-xl transition-all font-bold text-sm whitespace-nowrap"
          style={{
            background: task.completada
              ? (isDarkMode ? '#1f2d25' : '#dcfce7')
              : 'linear-gradient(90deg, #22c55e 0%, #10b981 100%)',
            border: task.completada && !isDarkMode ? '1px solid rgba(34,197,94,0.18)' : 'none',
            colorScheme: 'normal',
            color: task.completada && !isDarkMode ? '#166534' : '#fff',
            boxShadow: task.completada ? 'none' : '0 6px 18px rgba(16,185,129,0.22)',
          }}
          title={task.completada ? "Refazer tarefa" : "Marcar como concluída"}
        >
          {isUpdating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          ) : task.completada ? (
            <><RotateCcw size={17} /> Desmarcar</>
          ) : (
            <><CheckCircle2 size={17} /> Realizar missão</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export function TasksSection({ userId, isDarkMode = false }: TasksSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { state, notifySectionReady } = useTutorial();

  // Notificar o tutorial que a secção carregou os dados
  useEffect(() => {
    if (!isLoading && state.status === 'waiting' && state.requestedSection === 'tasks' && state.activeRequestId) {
      notifySectionReady({
        section: 'tasks',
        requestId: state.activeRequestId,
        status: 'ready'
      });
    }
  }, [isLoading, state.status, state.requestedSection, state.activeRequestId, notifySectionReady]);

  // 🔥 BUSCAR TAREFAS DO BACKEND
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await apiFetch('/api/tasks/user');
        const data = await res.json();

        if (res.ok) {
          setTasks(data);
        } else {
          toast.error('Erro ao carregar tarefas');
        }
      } catch {
        toast.error('Erro ao conectar ao servidor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [userId]);

  // 🔥 MARCAR/DESMARCAR TAREFA
  const toggleTask = async (taskId: number, currentStatus: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (!currentStatus) {
        // COMPLETAR TAREFA
        const res = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tarefa_id: taskId
          })
        });

        const data = await res.json();

        if (res.ok) {
          toast.success(`+${task.pontos} pontos! 🌱`, {
            description: data.mensagem
          });

          if (data.streak && data.streak > 1) {
            const streakMsg =
              data.streak >= 30 ? `🏆 ${data.streak} dias! SEQUÊNCIA LENDÁRIA!` :
              data.streak >= 14 ? `⭐ ${data.streak} dias consecutivos! Imparável!` :
              data.streak >= 7  ? `💪 ${data.streak} dias! Uma semana de sequência!` :
              data.streak >= 3  ? `🔥 ${data.streak} dias! Continua a sequência!` :
              `🔥 ${data.streak} dias de sequência!`;
            setTimeout(() => toast(streakMsg, {
              style: { background: '#f97316', color: 'white', border: 'none' }
            }), 600);
          }

          if (data.novo_nivel) {
            setTimeout(() => toast(`🎉 Subiste de nível!`, {
              description: `Agora és ${data.novo_nivel}`,
              style: { background: '#10b981', color: 'white', border: 'none' }
            }), 1200);
          }

          setTasks(tasks.map(t =>
            t.id === taskId ? { ...t, completada: true } : t
          ));
        } else {
          toast.error(data.erro || 'Erro ao completar tarefa');
        }
      } else {
        // DESMARCAR TAREFA
        const res = await apiFetch('/api/tasks/uncomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tarefa_id: taskId
          })
        });

        const data = await res.json();

        if (res.ok) {
          toast.info('Tarefa desmarcada');
          
          setTasks(tasks.map(t => 
            t.id === taskId ? { ...t, completada: false } : t
          ));
        } else {
          toast.error(data.erro || 'Erro ao desmarcar tarefa');
        }
      }
    } catch {
      toast.error('Erro ao conectar ao servidor');
    }
  };

  const getTasksByCategory = (category: string) => {
    return tasks.filter(task => task.categoria === category);
  };

  const getProgress = (categoryTasks: Task[]) => {
    if (categoryTasks.length === 0) return 0;
    const completed = categoryTasks.filter(t => t.completada).length;
    return (completed / categoryTasks.length) * 100;
  };

  const categories = [
    { id: 'daily', name: 'Diárias', emoji: '☀️' },
    { id: 'weekly', name: 'Semanais', emoji: '📅' },
    { id: 'monthly', name: 'Mensais', emoji: '🗓️' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-2">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
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
          <CheckCircle2 size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: isDarkMode ? '#86efac' : '#0f172a' }}>Desafios Ecológicos</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: isDarkMode ? 'rgba(255,255,255,0.70)' : '#475569' }}>Complete missões, acumule pontos e suba no ranking global da sustentabilidade!</p>
        </div>
      </motion.div>

      <TutorialTarget id="tour-tasks-list" className="space-y-10">
        {categories.map((category, catIndex) => {
          const categoryTasks = getTasksByCategory(category.id);
          const progress = getProgress(categoryTasks);

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <Card className="border-green-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden">
                <CardHeader id={catIndex === 0 ? "tour-task-rewards" : undefined} className="pb-4 bg-green-50/50 dark:bg-green-900/10 border-b border-green-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="text-2xl">{category.emoji}</span> Missões {category.name}
                      </CardTitle>
                      <CardDescription className="dark:text-gray-400 mt-1 font-medium text-sm">
                        {categoryTasks.filter(t => t.completada).length} de {categoryTasks.length} tarefas concluídas
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-green-600 dark:text-green-400">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <Progress value={progress} className="mt-4 h-3 bg-gray-200 dark:bg-gray-800" />
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 sm:p-6">
                  <motion.div 
                    className="flex flex-col gap-3"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.05 } }
                    }}
                  >
                    {categoryTasks.length > 0 ? (
                      categoryTasks.map((task) => (
                        <MissionRow
                          key={task.id}
                          task={task}
                          onToggle={toggleTask}
                          isDarkMode={isDarkMode}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                          <Leaf size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tudo limpo por aqui!</h3>
                        <p className="text-gray-500 dark:text-gray-400">Nenhuma missão disponível nesta categoria no momento.</p>
                      </div>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </TutorialTarget>
    </div>
  );
}
