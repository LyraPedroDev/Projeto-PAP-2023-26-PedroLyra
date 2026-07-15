import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Bot, ChevronLeft, ChevronRight, Flame, Leaf, MessageSquare, Newspaper, Target, Trophy, User, X } from 'lucide-react';
import { TutorialState, TutorialStep } from './tutorialTypes';

const ICONS: Record<string, React.FC<any>> = { Bot, Flame, Leaf, MessageSquare, Newspaper, Target, Trophy, User };

type TutorialTooltipProps = {
  step: TutorialStep;
  state: TutorialState;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onRetry: () => void;
  isDarkMode: boolean;
  style?: React.CSSProperties;
};

export const TutorialTooltip = React.forwardRef<HTMLDivElement, TutorialTooltipProps>(function TutorialTooltip({
  step,
  state,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onRetry,
  isDarkMode,
  style
}, ref) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const Icon = ICONS[step.iconName || 'Leaf'] || Leaf;
  
  const bg = isDarkMode ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  const border = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const text = isDarkMode ? '#F8FAFC' : '#0F172A';
  const textSub = isDarkMode ? '#94A3B8' : '#64748B';
  const progressBg = isDarkMode ? '#1E293B' : '#E2E8F0';

  const isNavigating = state.status === 'navigating' || state.status === 'waiting';
  const isError = state.status === 'error';
  
  const percentage = Math.round(((state.currentStepIndex + 1) / totalSteps) * 100);

  const tooltipVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.96, 
      y: isMobile ? '100%' : 16 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', damping: 24, stiffness: 300, mass: 0.8 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.98, 
      y: isMobile ? '100%' : -8,
      transition: { duration: 0.2, ease: 'easeIn' }
    }
  };

  const innerStyle: React.CSSProperties = isMobile ? {
    width: '100%',
    background: bg,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderTop: `1px solid ${border}`,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: '24px 20px 32px',
    boxShadow: isDarkMode 
      ? '0 -24px 48px -12px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.1)' 
      : '0 -24px 48px -12px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.05)',
    fontFamily: '"Inter", "Poppins", "Segoe UI", sans-serif',
  } : {
    width: 'min(400px, calc(100vw - 32px))',
    minWidth: 340,
    maxWidth: 400,
    background: bg,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: `1px solid ${border}`,
    borderRadius: 24,
    padding: '24px 28px',
    boxShadow: isDarkMode 
      ? '0 32px 64px -12px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1)' 
      : '0 32px 64px -12px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.05)',
    fontFamily: '"Inter", "Poppins", "Segoe UI", sans-serif',
  };

  return (
    <div ref={ref} style={{ ...style, zIndex: 10000 }}>
      <motion.div
        variants={tooltipVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={innerStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-desc"
      >
        <button 
          onClick={onSkip}
          aria-label="Fechar tutorial"
          title="Fechar tutorial"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            border: 'none', 
            color: textSub, 
            cursor: 'pointer',
            width: 40,
            height: 40,
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; 
            e.currentTarget.style.color = text; 
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'; 
            e.currentTarget.style.color = textSub; 
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: '50%', 
            background: isError ? '#FEF2F2' : (isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4'),
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: isError ? '#EF4444' : '#22C55E',
            boxShadow: isError ? 'none' : (isDarkMode ? '0 0 0 1px rgba(34, 197, 94, 0.2) inset' : '0 0 0 1px rgba(34, 197, 94, 0.1) inset'),
            flexShrink: 0
          }}>
            {isError ? <AlertCircle size={24} strokeWidth={2.5} /> : <Icon size={24} strokeWidth={2.5} />}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, paddingRight: 48 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: textSub, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Passo {state.currentStepIndex + 1} de {totalSteps}
            </span>
            <h3 id="tutorial-title" style={{ fontSize: 20, fontWeight: 700, color: text, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {isError ? 'Oops, um contratempo!' : isNavigating ? 'A preparar a secção...' : step.title}
            </h3>
          </div>
        </div>
        
        <div id="tutorial-desc" style={{ fontSize: 15, color: textSub, lineHeight: 1.6, marginBottom: 28, fontWeight: 400, minHeight: 48 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={isError ? 'error' : isNavigating ? 'nav' : 'content'}
              initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {isError ? state.error?.message : isNavigating ? 'A carregar os dados necessários para o próximo passo. Aguarda um momento.' : step.description}
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{ marginBottom: 24, padding: '0 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 10, borderRadius: 5, background: progressBg, overflow: 'hidden', position: 'relative' }} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
            <motion.div 
              initial={{ width: `${(state.currentStepIndex / totalSteps) * 100}%` }}
              animate={{ width: `${((state.currentStepIndex + 1) / totalSteps) * 100}%` }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              style={{ 
                height: '100%', 
                background: isError ? '#EF4444' : 'linear-gradient(90deg, #22C55E 0%, #4ADE80 100%)', 
                borderRadius: 5,
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.4)'
              }}
            >
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 100%)' }} />
            </motion.div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: textSub }}>{percentage}%</span>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {state.currentStepIndex > 0 && (
            <motion.button 
              onClick={onPrev}
              disabled={isNavigating}
              whileHover={!isNavigating ? { scale: 1.02, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' } : {}}
              whileTap={!isNavigating ? { scale: 0.96 } : {}}
              style={{
                padding: '0 20px', height: 44, borderRadius: 16, fontWeight: 600, fontSize: 14,
                background: 'transparent', color: text, border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                cursor: isNavigating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s', opacity: isNavigating ? 0.4 : 1, flexShrink: 0
              }}
            >
              <ChevronLeft size={18} strokeWidth={2.5} /> 
              {!isMobile && "Anterior"}
            </motion.button>
          )}

          <motion.button 
            onClick={isError ? onRetry : onNext}
            disabled={isNavigating}
            whileHover={!isNavigating ? { 
              scale: 1.02, 
              boxShadow: isError ? 'none' : '0 12px 24px -6px rgba(34, 197, 94, 0.4), 0 4px 12px -2px rgba(34, 197, 94, 0.2)' 
            } : {}}
            whileTap={!isNavigating ? { scale: 0.96 } : {}}
            style={{
              flex: 1, height: 44, borderRadius: 16, fontWeight: 600, fontSize: 14,
              background: isError ? '#EF4444' : '#22C55E', color: '#fff', border: 'none',
              cursor: isNavigating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: isNavigating ? 0.5 : 1,
              boxShadow: isError ? 'none' : '0 8px 16px -4px rgba(34, 197, 94, 0.3)'
            }}
          >
            {isError ? 'Tentar de novo' : (state.currentStepIndex === totalSteps - 1 ? 'Concluir' : 'Próximo')} 
            {!isError && state.currentStepIndex !== totalSteps - 1 && <ChevronRight size={18} strokeWidth={2.5} />}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
});