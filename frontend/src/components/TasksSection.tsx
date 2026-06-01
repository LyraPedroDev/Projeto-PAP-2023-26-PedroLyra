import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Leaf, Droplet, Recycle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

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
}

export function TasksSection({ userId }: TasksSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mapear ícones
  const iconMap: { [key: string]: any } = {
    Recycle: Recycle,
    Droplet: Droplet,
    Zap: Zap,
    Leaf: Leaf
  };

  // 🔥 BUSCAR TAREFAS DO BACKEND
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`/api/tasks/user/${userId}`);
        const data = await res.json();

        if (res.ok) {
          setTasks(data);
        } else {
          toast.error('Erro ao carregar tarefas');
        }
      } catch (err) {
        console.error('Erro ao buscar tarefas:', err);
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
        const res = await fetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            tarefa_id: taskId
          })
        });

        const data = await res.json();

        if (res.ok) {
          // Toast principal de pontos
          toast.success(`+${task.pontos} pontos! 🌱`, {
            description: data.mensagem
          });

          // Toast de streak 🔥
          if (data.streak && data.streak > 1) {
            const streakMsg =
              data.streak >= 30 ? `🏆 ${data.streak} dias! LENDÁRIO!` :
              data.streak >= 14 ? `⭐ ${data.streak} dias consecutivos! Imparável!` :
              data.streak >= 7  ? `💪 ${data.streak} dias! Uma semana!` :
              data.streak >= 3  ? `🔥 ${data.streak} dias! Continua!` :
              `🔥 ${data.streak} dias seguidos!`;
            setTimeout(() => toast(streakMsg, {
              style: { background: '#f97316', color: 'white', border: 'none' }
            }), 600);
          }

          // Toast de nível subido 🎉
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
        const res = await fetch('/api/tasks/uncomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            tarefa_id: taskId
          })
        });

        const data = await res.json();

        if (res.ok) {
          toast.info('Tarefa desmarcada');
          
          // Atualizar localmente
          setTasks(tasks.map(t => 
            t.id === taskId ? { ...t, completada: false } : t
          ));
        } else {
          toast.error(data.erro || 'Erro ao desmarcar tarefa');
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      toast.error('Erro ao conectar ao servidor');
    }
  };

  const getTasksByCategory = (category: 'daily' | 'weekly' | 'monthly') => {
    return tasks.filter(task => task.categoria === category);
  };

  const getProgress = (category: 'daily' | 'weekly' | 'monthly') => {
    const categoryTasks = getTasksByCategory(category);
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
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-green-800 dark:text-green-300 mb-2">Minhas Tarefas</h1>
        <p className="text-gray-600 dark:text-gray-400">Complete desafios e ganhe pontos para o ranking</p>
      </motion.div>

      {categories.map((category, catIndex) => {
        const categoryTasks = getTasksByCategory(category.id as any);
        const progress = getProgress(category.id as any);
        
        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIndex * 0.1 }}
          >
            <Card className="border-green-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="dark:text-gray-200">
                      {category.emoji} {category.name}
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      {categoryTasks.filter(t => t.completada).length} de {categoryTasks.length} completas
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-500">{Math.round(progress)}%</Badge>
                </div>
                <Progress value={progress} className="mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryTasks.map((task, index) => {
                    const Icon = iconMap[task.icone] || Leaf;
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => toggleTask(task.id, task.completada)}
                        className={`flex items-center gap-4 p-3 lg:p-4 rounded-lg cursor-pointer transition-all ${
                          task.completada 
                            ? 'bg-green-100 dark:bg-green-900/30 opacity-75' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        {task.completada ? (
                          <CheckCircle2 className="text-green-600 dark:text-green-400 flex-shrink-0" size={24} />
                        ) : (
                          <Circle className="text-gray-400 flex-shrink-0" size={24} />
                        )}
                        <div className="flex-1">
                          <div className={`${task.completada ? 'line-through' : ''} dark:text-gray-200`}>
                            {task.titulo}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{task.descricao}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Icon className="text-green-600 dark:text-green-400" size={20} />
                          <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                            +{task.pontos} pts
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}