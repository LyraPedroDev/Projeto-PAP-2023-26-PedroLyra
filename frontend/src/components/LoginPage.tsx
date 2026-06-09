import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Leaf, Sun, Moon, Sprout, Globe, Recycle } from 'lucide-react';
import { LeafLogo } from './ui/LeafLogo';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: (userData: { user_id: number; email: string }) => void;
  initialIsLogin?: boolean;
  onToggleMode?: (isLogin: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export function LoginPage({ onLogin, initialIsLogin = true, onToggleMode, isDarkMode, toggleTheme }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔥 SUBMIT - LOGIN E REGISTRO COM BACKEND
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        // 🔥 LOGIN
        const res = await fetch("/api/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            senha: formData.password
          })
        });

        const data = await res.json();

        if (res.ok && data.sucesso) {
          // Backend retorna: { sucesso: true, user: { id, nome, email } }
          const userId = data.user.id;
          
          // Salvar no localStorage
          localStorage.setItem("user_id", String(userId));
          localStorage.setItem("user_email", formData.email);

          toast.success("Login realizado com sucesso! 🌿");

          // Passar dados para o App.tsx
          setTimeout(() => {
            onLogin({ 
              user_id: userId, 
              email: formData.email 
            });
          }, 500);
        } else {
          toast.error(data.mensagem || "Email ou senha inválidos");
        }

      } else {
        // 🔥 REGISTRO
        const res = await fetch("/api/register", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: formData.name,
            email: formData.email,
            senha: formData.password
          })
        });

        const data = await res.json();

        if (res.ok && data.sucesso) {
          toast.success("Conta criada com sucesso! 🌱");
          
          // Após criar conta, fazer login automático
          setTimeout(async () => {
            const loginRes = await fetch("/api/login", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: formData.email,
                senha: formData.password
              })
            });

            const loginData = await loginRes.json();
            
            if (loginRes.ok && loginData.sucesso) {
              const userId = loginData.user.id;
              localStorage.setItem("user_id", String(userId));
              localStorage.setItem("user_email", formData.email);
              
              onLogin({ 
                user_id: userId, 
                email: formData.email 
              });
            }
          }, 1000);
        } else {
          toast.error(data.mensagem || "Erro ao criar conta");
        }
      }

    } catch (err) {
      console.error("Erro ao conectar ao servidor:", err);
      toast.error("Erro ao conectar ao servidor. Verifique se o backend está rodando.");
    } finally {
      setIsLoading(false);
    }
  };

  const floatingIcons = [
    { Icon: Leaf, delay: 0, x: '10%', y: '20%' },
    { Icon: Sprout, delay: 0.2, x: '80%', y: '15%' },
    { Icon: Globe, delay: 0.4, x: '15%', y: '70%' },
    { Icon: Recycle, delay: 0.6, x: '85%', y: '75%' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Vídeo de Fundo */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          minWidth: '100%',
          minHeight: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          filter: 'blur(8px)',
          zIndex: 0,
        }}
      >
        <source src="/videos/login-background.mp4" type="video/mp4" />
        Seu navegador não suporta vídeo HTML5
      </video>

      {/* Overlay escuro para contraste */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40 dark:bg-black/60 z-0"></div>

      {/* Ícones flutuantes de fundo */}
      {floatingIcons.map(({ Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          className="absolute text-green-200/10 dark:text-green-700/10 z-0"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 360,
            y: [0, -20, 0]
          }}
          transition={{
            delay,
            duration: 1,
            y: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            },
            rotate: {
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }
          }}
        >
          <Icon size={64} />
        </motion.div>
      ))}

      {/* Botão de tema */}
      <motion.button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all z-10"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isDarkMode ? (
          <Sun className="text-yellow-500" size={24} />
        ) : (
          <Moon className="text-indigo-600" size={24} />
        )}
      </motion.button>

      {/* Card de Login/Registro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 shadow-2xl border-green-200 dark:border-green-800">
          <CardHeader className="text-center space-y-4">
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-xl opacity-50"></div>
                <LeafLogo className="text-green-600 dark:text-green-400 relative" size={64} />
              </div>
            </motion.div>
            <CardTitle className="text-green-800 dark:text-green-300">
              Bem-vindo ao EcoChat
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Seu assistente inteligente para sustentabilidade 🌍
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Campo Nome (só no registro) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Label htmlFor="name" className="dark:text-gray-200">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isLoading}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 text-sm"
                    >
                      {errors.name}
                    </motion.p>
                  )}
                </motion.div>
              )}

              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-gray-200">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-sm"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-gray-200">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-sm"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </div>

              {/* Campo Confirmar Senha (só no registro) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Label htmlFor="confirmPassword" className="dark:text-gray-200">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={isLoading}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  {errors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 text-sm"
                    >
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </motion.div>
              )}

              {/* Botão Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isLogin ? 'Entrando...' : 'Criando conta...'}
                  </span>
                ) : (
                  isLogin ? 'Entrar' : 'Criar Conta'
                )}
              </Button>

              {/* Toggle Login/Registro */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    const newMode = !isLogin;
                    setIsLogin(newMode);
                    setErrors({});
                    onToggleMode?.(newMode);
                  }}
                  disabled={isLoading}
                  className="text-green-600 dark:text-green-400 hover:underline disabled:opacity-50"
                >
                  {isLogin 
                    ? 'Não tem uma conta? Criar conta' 
                    : 'Já tem uma conta? Entrar'
                  }
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}