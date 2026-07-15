import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Bot, LayoutGrid } from 'lucide-react';

interface AIFloatingButtonProps {
  onClick: () => void;
}

export function AIFloatingButton({ onClick }: AIFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBotClick = () => {
    setIsOpen(false);
    onClick(); 
  };

  const handleMenuClick = () => {
    setIsOpen(false);
    window.dispatchEvent(new Event('open-mobile-menu'));
  };

  // Se não for mobile, mostra o botão original
  if (!isMobile) {
    return (
      <div id="tour-ecobot" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 10001 }}>
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: '60px', height: '60px',
          borderRadius: '50%', backgroundColor: '#10b981', border: 'none', cursor: 'pointer',
          fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        aria-label="Abrir assistente IA"
      >
        <Bot size={32} color="#fff" />
      </motion.button>
      </div>
    );
  }

  // Speed Dial para Mobile
  return (
    <div id="tour-ecobot" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 10001, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', paddingRight: 6 }}
          >
            {/* Opção Chatbot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>EcoBot IA</span>
              <motion.button
                onClick={handleBotClick}
                whileTap={{ scale: 0.9 }}
                style={{
                  width: 48, height: 48, borderRadius: '50%', backgroundColor: '#06b6d4', border: 'none',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer'
                }}
              >
                <Bot size={24} />
              </motion.button>
            </div>

            {/* Opção Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Navegação</span>
              <motion.button
                onClick={handleMenuClick}
                whileTap={{ scale: 0.9 }}
                style={{
                  width: 48, height: 48, borderRadius: '50%', backgroundColor: '#f59e0b', border: 'none',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer'
                }}
              >
                <LayoutGrid size={22} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
        style={{
          width: 60, height: 60, borderRadius: '50%', backgroundColor: '#10b981', border: 'none',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isOpen ? '0 0 20px rgba(16,185,129,0.5)' : '0 4px 12px rgba(0, 0, 0, 0.15)', 
          cursor: 'pointer'
        }}
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </motion.button>
    </div>
  );
}
