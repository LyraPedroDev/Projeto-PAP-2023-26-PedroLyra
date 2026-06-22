import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { Sun, Moon, ArrowRight, Star, Users, Zap, Shield, ChevronDown, MessageCircle, Trophy, Camera } from 'lucide-react';
import { BrandLogo } from './ui/BrandLogo';
import landingBG from '../assets/landingpageBG.png';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const WORDS = ['recicla', 'poupa', 'inspira', 'conecta', 'impacta'];

function CyclingWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.span key={idx}
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.38 }}
        style={{ background: 'linear-gradient(135deg,#34d399,#10b981,#6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
        {WORDS[idx]}
      </motion.span>
    </AnimatePresence>
  );
}

function Counter({ n, label }: { n: number; label: string }) {
  const [c, setC] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let v = 0; const inc = n / 70;
    const t = setInterval(() => { v += inc; if (v >= n) { setC(n); clearInterval(t); } else setC(Math.floor(v)); }, 22);
    return () => clearInterval(t);
  }, [inView, n]);
  return (
    <motion.div ref={ref}
      whileHover={{ scale: 1.05, y: -5, boxShadow: '0 20px 40px rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)' }}
      transition={{ type: "spring", stiffness: 300 }}
      style={{ textAlign: 'center', padding: '24px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 16, cursor: 'default' }}>
      <p style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{c.toLocaleString('pt-PT')}+</p>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.5)', marginTop: 8, fontWeight: 600 }}>{label}</p>
    </motion.div>
  );
}

const FEATS = [
  { icon: <Camera size={22} />, title: 'Feed Ecológico', color: '#10b981', desc: 'Publica ações reais, recebe likes e inspira a tua comunidade a agir pelo planeta.', bullets: ['Posts com foto e descrição', 'Likes e comentários em tempo real', 'Filtros por categoria ecológica'] },
  { icon: <MessageCircle size={22} />, title: 'EcoBot IA', color: '#06b6d4', desc: 'Assistente inteligente especializado em sustentabilidade, disponível 24/7.', bullets: ['Respostas instantâneas', 'Dados sobre clima, água e energia', 'Dicas acionáveis personalizadas'] },
  { icon: <Trophy size={22} />, title: 'Missões & Ranking', color: '#f59e0b', desc: 'Gamificação real. Completa desafios, acumula pontos e sobe no ranking global.', bullets: ['Missões diárias e semanais', 'Ranking entre amigos', 'Sistema de níveis e conquistas'] },
];

function FloatingOrbs() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: Math.random() * 0.4 + 0.1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{
            y: [0, Math.random() * -150 - 50],
            x: [0, Math.random() * 100 - 50],
            opacity: [null, Math.random() * 0.6 + 0.2, 0.1]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            width: Math.random() * 5 + 3,
            height: Math.random() * 5 + 3,
            borderRadius: '50%',
            background: '#34d399',
            boxShadow: '0 0 15px 4px rgba(16,185,129,0.4)'
          }}
        />
      ))}
    </div>
  );
}

export function LandingPage({ onLogin, onSignup, isDarkMode, toggleTheme }: LandingPageProps) {
  const [stats, setStats] = useState({ usuarios: 5, publicacoes: 12, likes: 48, tarefas: 30 });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json())
      .then(d => setStats({ usuarios: Math.max(d.usuarios, 5), publicacoes: Math.max(d.publicacoes, 12), likes: Math.max(d.likes, 48), tarefas: Math.max(d.tarefas_completas, 30) }))
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: '"Inter","Segoe UI",system-ui,sans-serif', background: '#020b05', color: '#fff' }}>
      <FloatingOrbs />

      {/* NAV */}
      <motion.nav initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, transition: 'all 0.3s ease',
          background: scrolled ? 'rgba(2,11,5,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
              <BrandLogo size={22} animate={false} />
            </div>
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.03em', color: '#fff' }}>EcoChat</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onLogin}
              style={{ border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '9px 20px', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              Entrar
            </button>
            <motion.button onClick={onSignup} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 0 22px rgba(16,185,129,0.45)', borderRadius: 10, padding: '9px 20px', fontSize: 14, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              Registar <ArrowRight size={13} />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* HERO */}
      <section style={{ backgroundImage: `url(${landingBG})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,rgba(2,8,4,0.65) 0%,rgba(2,12,6,0.82) 50%,rgba(2,11,5,1) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 24px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: 100, paddingBottom: 80 }}>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.75 }}
            style={{ fontSize: 'clamp(48px,8vw,96px)', fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1.04, color: '#fff', marginBottom: 28, maxWidth: 900 }}>
            Transforma pequenas ações<br />em impacto real.<br />
            Tu <span style={{ display: 'inline-block', minWidth: '5ch', textAlign: 'left' }}><CyclingWord />.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ fontSize: 18, color: 'rgba(255,255,255,0.62)', maxWidth: 580, lineHeight: 1.65, marginBottom: 44 }}>
            Rede social ecológica com missões, ranking e comunidade sustentável. Gratuito e open source.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
            style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 72 }}>
            <motion.button onClick={onSignup} whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(16,185,129,0.6)' }} whileTap={{ scale: 0.97 }}
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 0 30px rgba(16,185,129,0.42)', borderRadius: 14, padding: '16px 36px', fontSize: 16, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={18} /> Criar Conta (Grátis)
            </motion.button>
            <motion.button onClick={onLogin} whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.97 }}
              style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '16px 36px', fontSize: 16, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              Iniciar Sessão <ArrowRight size={16} />
            </motion.button>
          </motion.div>

          {/* Product Mockup */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.9 }}
            whileHover={{ y: -12, scale: 1.02, boxShadow: '0 60px 140px rgba(0,0,0,0.8), 0 0 0 1px rgba(16,185,129,0.4), 0 0 60px rgba(16,185,129,0.2)' }}
            style={{ width: '100%', maxWidth: 720, background: 'rgba(10,26,16,0.9)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(16,185,129,0.1)', cursor: 'pointer' }}>
            {/* Browser chrome */}
            <div style={{ background: 'rgba(5,15,8,0.95)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                ecochat.app
              </div>
            </div>
            {/* App UI preview */}
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12, minHeight: 240 }}>
              {/* Sidebar */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BrandLogo size={14} animate={false} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>EcoChat</span>
                </div>
                {['🏠 Feed', '🤖 EcoBot', '🏆 Ranking', '👤 Perfil'].map(item => (
                  <div key={item} style={{ padding: '8px 10px', borderRadius: 8, fontSize: 12, color: item === '🏠 Feed' ? '#10b981' : 'rgba(255,255,255,0.45)', background: item === '🏠 Feed' ? 'rgba(16,185,129,0.1)' : 'transparent', marginBottom: 3, cursor: 'default' }}>{item}</div>
                ))}
              </div>
              {/* Main feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { user: 'Ana Silva', action: 'Fui de bicicleta para o trabalho hoje! 🚲', pts: '+15 pts', time: '2m' },
                  { user: 'João Costa', action: 'Plantei 3 árvores no parque da cidade 🌳', pts: '+30 pts', time: '8m' },
                ].map(post => (
                  <div key={post.user} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{post.user}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{post.time}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>{post.action}</p>
                    <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{post.pts}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
            style={{ marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Descobrir</span>
            <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <ChevronDown size={18} style={{ color: 'rgba(255,255,255,0.25)' }} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: '#020d06', borderTop: '1px solid rgba(16,185,129,0.12)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 700 }}>Impacto real</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
            <Counter n={stats.usuarios} label="Utilizadores" />
            <Counter n={stats.publicacoes} label="Publicações" />
            <Counter n={stats.likes} label="Likes dados" />
            <Counter n={stats.tarefas} label="Missões feitas" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: '#040e07', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 72 }}>
            <p style={{ fontSize: 11, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 700, marginBottom: 16 }}>Funcionalidades</p>
            <h2 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.1, color: '#fff' }}>
              Tudo o que precisas.<br />
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Nada do que não precisas.</span>
            </h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {FEATS.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.55 }}
                whileHover={{ y: -8, boxShadow: `0 24px 70px ${f.color}18` }}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: 36, cursor: 'default', transition: 'box-shadow 0.3s' }}>
                <div style={{ width: 56, height: 56, background: `${f.color}18`, border: `1px solid ${f.color}28`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: 24 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 24 }}>{f.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {f.bullets.map(b => (
                    <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: f.color, fontSize: 13, fontWeight: 700 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{b}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section style={{ background: '#020d06', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 40 }}>
          {[{ icon: <Shield size={18} />, label: '100% Gratuito', sub: 'Sem custos escondidos' }, { icon: <Star size={18} />, label: 'Open Source', sub: 'Projeto académico' }, { icon: <Users size={18} />, label: 'Comunidade', sub: 'Cresce a cada dia' }].map((item, i) => (
            <motion.div key={item.label} 
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'default' }}>
              <motion.div whileHover={{ rotate: 15 }} style={{ color: '#10b981' }}>{item.icon}</motion.div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.label}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: '#040e07', padding: '120px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <p style={{ fontSize: 11, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 700, marginBottom: 24 }}>Junta-te à comunidade</p>
            <h2 style={{ fontSize: 'clamp(40px,7vw,80px)', fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1.05, color: '#fff', marginBottom: 20 }}>
              Junta-te ao futuro<br />
              <span style={{ background: 'linear-gradient(135deg,#34d399,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>sustentável hoje.</span>
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, maxWidth: 440, margin: '0 auto 48px' }}>
              Gratuito, simples e com impacto real. Regista-te e começa hoje.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button onClick={onSignup} whileHover={{ scale: 1.05, boxShadow: '0 0 55px rgba(16,185,129,0.6)' }} whileTap={{ scale: 0.97 }}
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 0 35px rgba(16,185,129,0.4)', borderRadius: 14, padding: '18px 44px', fontSize: 17, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Zap size={20} /> Criar Conta Grátis
              </motion.button>
              <motion.button onClick={onLogin}
                whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
                whileTap={{ scale: 0.97 }}
                style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '18px 44px', fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s ease, border-color 0.2s ease' }}>
                Já tenho conta <ArrowRight size={17} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#020b05', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
              <BrandLogo size={17} animate={false} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>EcoChat</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.03em' }}>EcoChat &copy; Todos os direitos reservados</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>Sistema operacional</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
