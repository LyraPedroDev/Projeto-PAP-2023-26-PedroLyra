import { useState, type CSSProperties, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight, Eye, EyeOff, Globe, Leaf, LockKeyhole,
  Mail, Moon, Recycle, Sprout, Sun, UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BrandLogo } from './ui/BrandLogo';
import bgImage from '../assets/abstract_nature_bg.png';

interface LoginPageProps {
  onLogin: (userData: { user_id: number; email: string; nome?: string; is_admin?: boolean }) => void;
  initialIsLogin?: boolean;
  onToggleMode?: (isLogin: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export function LoginPage({
  onLogin,
  initialIsLogin = true,
  onToggleMode,
  isDarkMode,
  toggleTheme,
}: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!isLogin && !formData.name.trim()) nextErrors.name = 'O nome é obrigatório';
    if (!formData.email.trim()) {
      nextErrors.email = 'O e-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Introduz um e-mail válido';
    }
    if (!formData.password) {
      nextErrors.password = 'A palavra-passe é obrigatória';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Utiliza pelo menos 6 caracteres';
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'As palavras-passe não coincidem';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const completeLogin = (data: any) => {
    const userId = data.user.id;
    localStorage.setItem('user_id', String(userId));
    localStorage.setItem('user_email', data.user.email || formData.email);
    if (data.user.nome) localStorage.setItem('user_name', data.user.nome);
    onLogin({
      user_id: userId,
      email: data.user.email || formData.email,
      nome: data.user.nome,
      is_admin: data.user.is_admin,
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await fetch('/api/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, senha: formData.password }),
        });
        const data = await response.json();

        if (!response.ok || !data.sucesso) {
          toast.error(data.mensagem || 'E-mail ou palavra-passe inválidos');
          return;
        }

        toast.success('Sessão iniciada com sucesso! 🌿');
        window.setTimeout(() => completeLogin(data), 350);
        return;
      }

      const registerResponse = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.name,
          email: formData.email,
          senha: formData.password,
        }),
      });
      const registerData = await registerResponse.json();

      if (!registerResponse.ok || !registerData.sucesso) {
        toast.error(registerData.mensagem || 'Não foi possível criar a conta');
        return;
      }

      const loginResponse = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, senha: formData.password }),
      });
      const loginData = await loginResponse.json();

      if (!loginResponse.ok || !loginData.sucesso) {
        toast.success('Conta criada. Já podes iniciar sessão.');
        setIsLogin(true);
        return;
      }

      toast.success('Conta criada com sucesso! 🌱');
      completeLogin(loginData);
    } catch {
      toast.error('Não foi possível ligar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const changeMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    onToggleMode?.(newMode);
  };

  const floatingIcons = [
    { Icon: Leaf, delay: 0, x: '10%', y: '20%' },
    { Icon: Sprout, delay: 0.2, x: '80%', y: '15%' },
    { Icon: Globe, delay: 0.4, x: '15%', y: '70%' },
    { Icon: Recycle, delay: 0.6, x: '85%', y: '75%' },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center relative bg-black"
      style={{ padding: '32px 16px', overflowX: 'hidden', overflowY: 'auto' }}
    >
      <img
        src={bgImage}
        alt=""
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          filter: 'blur(3px) saturate(.9)',
          transform: 'scale(1.03)',
          zIndex: 0,
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          background: isDarkMode
            ? 'linear-gradient(135deg,rgba(3,12,7,.90),rgba(6,22,13,.80))'
            : 'linear-gradient(135deg,rgba(3,18,10,.75),rgba(8,40,23,.62))',
        }}
      />

      {floatingIcons.map(({ Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          aria-hidden="true"
          style={{ position: 'fixed', left: x, top: y, zIndex: 0, color: 'rgba(110,231,183,.10)' }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: 360, y: [0, -18, 0] }}
          transition={{
            delay,
            duration: 1,
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 22, repeat: Infinity, ease: 'linear' },
          }}
        >
          <Icon size={64} />
        </motion.div>
      ))}

      <motion.button
        type="button"
        onClick={toggleTheme}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
        style={themeButtonStyle}
      >
        {isDarkMode ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} />}
      </motion.button>

      <motion.div
        key={isLogin ? 'login' : 'register'}
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}
      >
        <Card
          style={{
            gap: 0,
            overflow: 'hidden',
            borderRadius: 24,
            border: isDarkMode ? '1px solid rgba(110,231,183,.16)' : '1px solid rgba(255,255,255,.72)',
            background: isDarkMode ? 'rgba(12,29,20,.95)' : 'rgba(255,255,255,.96)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 28px 80px rgba(0,0,0,.38)',
          }}
        >
          <CardHeader style={{ padding: '28px 30px 20px', textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}
            >
              <div style={{
                width: 78,
                height: 78,
                borderRadius: 22,
                display: 'grid',
                placeItems: 'center',
                background: isDarkMode ? 'rgba(255,255,255,.06)' : '#fff',
                boxShadow: '0 12px 34px rgba(16,185,129,.22)',
              }}>
                <BrandLogo size={66} />
              </div>
            </motion.div>

            <CardTitle style={{
              color: isDarkMode ? '#f0fdf4' : '#123c27',
              fontSize: 27,
              fontWeight: 900,
              letterSpacing: '-.025em',
            }}>
              {isLogin ? 'Bem-vindo de volta' : 'Cria a tua conta'}
            </CardTitle>
            <CardDescription style={{
              color: isDarkMode ? 'rgba(255,255,255,.58)' : '#64748b',
              marginTop: 9,
              fontSize: 14,
              lineHeight: 1.55,
            }}>
              {isLogin
                ? 'Continua a tua jornada por um futuro mais sustentável.'
                : 'Junta-te à comunidade e transforma pequenas ações em impacto real.'}
            </CardDescription>
          </CardHeader>

          <CardContent style={{ padding: '8px 30px 30px' }}>
            <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gap: 17 }}>
              {!isLogin && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  <Label htmlFor="name" style={labelStyle(isDarkMode)}>Nome</Label>
                  <div style={{ position: 'relative', marginTop: 7 }}>
                    <UserRound size={18} style={fieldIconStyle} />
                    <Input
                      id="name"
                      autoComplete="name"
                      placeholder="O teu nome"
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      disabled={isLoading}
                      aria-invalid={Boolean(errors.name)}
                      style={inputStyle(isDarkMode, Boolean(errors.name), false)}
                    />
                  </div>
                  <FieldError message={errors.name} />
                </motion.div>
              )}

              <div>
                <Label htmlFor="email" style={labelStyle(isDarkMode)}>E-mail</Label>
                <div style={{ position: 'relative', marginTop: 7 }}>
                  <Mail size={18} style={fieldIconStyle} />
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="nome@exemplo.com"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    disabled={isLoading}
                    aria-invalid={Boolean(errors.email)}
                    style={inputStyle(isDarkMode, Boolean(errors.email), false)}
                  />
                </div>
                <FieldError message={errors.email} />
              </div>

              <div>
                <Label htmlFor="password" style={labelStyle(isDarkMode)}>Palavra-passe</Label>
                <div style={{ position: 'relative', marginTop: 7 }}>
                  <LockKeyhole size={18} style={fieldIconStyle} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    placeholder="Mínimo de 6 caracteres"
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    disabled={isLoading}
                    aria-invalid={Boolean(errors.password)}
                    style={inputStyle(isDarkMode, Boolean(errors.password), true)}
                  />
                  <PasswordToggle
                    visible={showPassword}
                    onClick={() => setShowPassword(value => !value)}
                    isDarkMode={isDarkMode}
                    label="palavra-passe"
                  />
                </div>
                <FieldError message={errors.password} />
              </div>

              {!isLogin && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  <Label htmlFor="confirmPassword" style={labelStyle(isDarkMode)}>
                    Confirmar palavra-passe
                  </Label>
                  <div style={{ position: 'relative', marginTop: 7 }}>
                    <LockKeyhole size={18} style={fieldIconStyle} />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Repete a palavra-passe"
                      value={formData.confirmPassword}
                      onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
                      disabled={isLoading}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      style={inputStyle(isDarkMode, Boolean(errors.confirmPassword), true)}
                    />
                    <PasswordToggle
                      visible={showConfirmPassword}
                      onClick={() => setShowConfirmPassword(value => !value)}
                      isDarkMode={isDarkMode}
                      label="confirmação da palavra-passe"
                    />
                  </div>
                  <FieldError message={errors.confirmPassword} />
                </motion.div>
              )}

              <motion.div
                whileHover={!isLoading ? { y: -2 } : undefined}
                whileTap={!isLoading ? { scale: 0.99 } : undefined}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 13,
                    border: 0,
                    color: '#fff',
                    background: 'linear-gradient(135deg,#10b981,#059669)',
                    boxShadow: '0 12px 26px rgba(5,150,105,.28)',
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, justifyContent: 'center' }}>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      {isLogin ? 'A iniciar sessão...' : 'A criar conta...'}
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, justifyContent: 'center' }}>
                      {isLogin ? 'Entrar' : 'Criar conta'} <ArrowRight size={17} />
                    </span>
                  )}
                </Button>
              </motion.div>

              <div style={{
                height: 1,
                background: isDarkMode ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.08)',
                margin: '2px 0',
              }} />

              <div style={{ textAlign: 'center' }}>
                <span style={{
                  color: isDarkMode ? 'rgba(255,255,255,.52)' : '#64748b',
                  fontSize: 13,
                }}>
                  {isLogin ? 'Ainda não tens conta? ' : 'Já tens uma conta? '}
                </span>
                <button
                  type="button"
                  onClick={changeMode}
                  disabled={isLoading}
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: '#10b981',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 800,
                    padding: 0,
                  }}
                >
                  {isLogin ? 'Criar conta' : 'Iniciar sessão'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function PasswordToggle({
  visible,
  onClick,
  isDarkMode,
  label,
}: {
  visible: boolean;
  onClick: () => void;
  isDarkMode: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label}`}
      style={eyeButtonStyle(isDarkMode)}
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      style={{ color: '#f87171', fontSize: 12, marginTop: 6, fontWeight: 600 }}
    >
      {message}
    </motion.p>
  );
}

const themeButtonStyle: CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 20,
  width: 44,
  height: 44,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,.18)',
  background: 'rgba(8,25,15,.65)',
  backdropFilter: 'blur(14px)',
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  boxShadow: '0 10px 30px rgba(0,0,0,.22)',
};

const fieldIconStyle: CSSProperties = {
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#94a3b8',
  pointerEvents: 'none',
  zIndex: 2,
};

function labelStyle(isDarkMode: boolean): CSSProperties {
  return {
    display: 'block',
    color: isDarkMode ? 'rgba(255,255,255,.82)' : '#334155',
    fontSize: 13,
    fontWeight: 750,
  };
}

function inputStyle(isDarkMode: boolean, hasError: boolean, hasEye: boolean): CSSProperties {
  return {
    width: '100%',
    height: 48,
    paddingLeft: 43,
    paddingRight: hasEye ? 48 : 14,
    borderRadius: 12,
    border: `1px solid ${hasError ? '#f87171' : isDarkMode ? 'rgba(255,255,255,.13)' : '#d9e2ec'}`,
    background: isDarkMode ? 'rgba(255,255,255,.055)' : '#f8fafc',
    color: isDarkMode ? '#f8fafc' : '#172033',
    boxShadow: hasError ? '0 0 0 3px rgba(248,113,113,.10)' : 'none',
    outline: 'none',
    fontSize: 14,
  };
}

function eyeButtonStyle(isDarkMode: boolean): CSSProperties {
  return {
    position: 'absolute',
    right: 7,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 36,
    height: 36,
    border: 0,
    borderRadius: 9,
    background: 'transparent',
    color: isDarkMode ? '#94a3b8' : '#64748b',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    zIndex: 3,
    padding: 0,
  };
}
