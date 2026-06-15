import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Leaf, Droplet, Recycle, Zap, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { getImageForCategory } from '../constants/categoryImages';

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

// Helper para descobrir a categoria de imagem do Unsplash
const getCategoryKey = (task: Task): string => {
  const icon = task.icone.toLowerCase();
  if (icon === 'droplet') return 'agua';
  if (icon === 'zap') return 'energia';
  if (icon === 'recycle') return 'reciclagem';
  if (icon === 'leaf') return 'natureza';
  
  const text = (task.titulo + ' ' + task.descricao).toLowerCase();
  if (text.includes('bicicleta') || text.includes('pé') || text.includes('transporte') || text.includes('carro')) {
    return 'transportes';
  }
  if (text.includes('comer') || text.includes('carne') || text.includes('refeição') || text.includes('alimentação') || text.includes('prato') || text.includes('vegetariano')) {
    return 'alimentacao';
  }
  
  return 'default';
};

// Componente MissionCard para cada missão
function MissionCard({ task, onToggle }: { task: Task; onToggle: (taskId: number, currentStatus: boolean) => Promise<void> }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [imgError, setImgError] = useState(false);
  const catKey = getCategoryKey(task);
  const image = getImageForCategory(catKey);

  // Mapeamento de rótulo de categoria para exibição amigável
  const categoryLabelMap: Record<string, string> = {
    agua: 'Poupança de Água 💧',
    energia: 'Eficiência Energética ⚡',
    reciclagem: 'Reciclagem ♻️',
    natureza: 'Biodiversidade 🌿',
    transportes: 'Mobilidade Verde 🚲',
    alimentacao: 'Alimentação Consciente 🥗',
    default: 'Sustentabilidade 🌱'
  };

  const getCategoryIcon = (category: string) => {
    const iconClass = "text-white/90 drop-shadow-md";
    if (category === 'agua') return <Droplet size={40} className={iconClass} />;
    if (category === 'energia') return <Zap size={40} className={iconClass} />;
    if (category === 'reciclagem') return <Recycle size={40} className={iconClass} />;
    return <Leaf size={40} className={iconClass} />;
  };

  const getCategoryGradient = (category: string): string => {
    const gradients: Record<string, string> = {
      agua: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      energia: 'linear-gradient(135deg, #f59e0b, #d97706)',
      reciclagem: 'linear-gradient(135deg, #10b981, #047857)',
      natureza: 'linear-gradient(135deg, #22c55e, #15803d)',
      transportes: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      alimentacao: 'linear-gradient(135deg, #f97316, #ea580c)',
      default: 'linear-gradient(135deg, #10b981, #059669)'
    };
    return gradients[category] || gradients.default;
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
      whileHover={{ y: -6 }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border transition-all ${
        task.completada 
          ? 'border-green-300 dark:border-green-800 opacity-90' 
          : 'border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-green-950/20'
      }`}
    >
      {/* Imagem do topo com fallback de gradiente */}
      <div 
        className="relative h-44 w-full overflow-hidden bg-gray-150 dark:bg-gray-900 flex items-center justify-center"
        style={{
          background: imgError ? getCategoryGradient(catKey) : undefined
        }}
      >
        {!imgError ? (
          <img
            src={image.url}
            alt={image.alt}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          getCategoryIcon(catKey)
        )}
        {task.completada && (
          <div className="absolute inset-0 bg-green-950/40 backdrop-blur-[2px] flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="bg-green-500 text-white rounded-full p-2.5 shadow-lg"
            >
              <CheckCircle2 size={32} />
            </motion.div>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Categoria Badge */}
          <span className="inline-block bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold mb-3">
            {categoryLabelMap[catKey] || categoryLabelMap.default}
          </span>

          {/* Título */}
          <h3 className={`font-bold text-base mb-1.5 dark:text-white leading-snug ${task.completada ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900'}`}>
            {task.titulo}
          </h3>

          {/* Descrição */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">
            {task.descricao}
          </p>
        </div>

        {/* Pontos & Ação */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-150 dark:border-gray-700">
          <span className="text-green-600 dark:text-green-400 font-bold text-sm">
            +{task.pontos} pts
          </span>

          <button
            onClick={handleToggle}
            disabled={isUpdating}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all ${
              task.completada
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent hover:bg-red-50 hover:text-red-600 hover:dark:bg-red-950/30'
                : 'bg-green-500 hover:bg-green-600 text-white border-transparent shadow-md hover:shadow-lg'
            } disabled:opacity-50`}
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
            ) : task.completada ? (
              <>
                <RotateCcw size={13} />
                Refazer
              </>
            ) : (
              'Concluído'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function TasksSection({ userId }: TasksSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

          // Toast de sequência (streak) 🔥 em Português
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
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-2">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-green-800 dark:text-green-300 mb-2">Desafios Ecológicos</h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Complete missões, acumule pontos e suba no ranking global da sustentabilidade!</p>
      </motion.div>

      {categories.map((category, catIndex) => {
        const categoryTasks = getTasksByCategory(category.id as any);
        const progress = getProgress(category.id as any);
        
        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIndex * 0.1 }}
          >
            <Card className="border-green-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/20 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-extrabold dark:text-gray-100 flex items-center gap-2">
                      <span className="text-2xl">{category.emoji}</span> Missões {category.name}
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 mt-1 font-medium">
                      {categoryTasks.filter(t => t.completada).length} de {categoryTasks.length} concluídas
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-600 text-white font-extrabold text-sm px-3 py-1 rounded-full shadow-sm">
                    {Math.round(progress)}%
                  </Badge>
                </div>
                <Progress value={progress} className="mt-3.5 h-2.5 bg-gray-200 dark:bg-gray-800" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryTasks.map((task) => (
                    <MissionCard
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                    />
                  ))}
                </div>
                {categoryTasks.length === 0 && (
                  <p className="text-center text-gray-500 py-6">Nenhuma missão disponível nesta categoria.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}