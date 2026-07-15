import React from 'react';
import { motion } from 'motion/react';
import { Leaf, Loader2, Trophy } from 'lucide-react';
import { TutorialState } from './tutorialTypes';

type TutorialWelcomeProps = {
  mode: 'welcome' | 'completion';
  state?: TutorialState;
  onAction: () => void;
  onClose: () => void;
  isDarkMode: boolean;
};

export function TutorialWelcome({ mode, state, onAction, onClose, isDarkMode }: TutorialWelcomeProps) {
  const bg = isDarkMode ? 'rgba(30, 41, 59, 0.97)' : 'rgba(255, 255, 255, 0.99)';
  const border = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const text = isDarkMode ? '#F8FAFC' : '#0F172A';
  const textSub = isDarkMode ? '#CBD5E1' : '#64748B';

  const isWelcome = mode === 'welcome';
  const title = isWelcome ? 'Bem-vindo ao EcoChat' : 'Estás pronto para começar!';
  const desc = isWelcome
    ? 'Transforma pequenas ações sustentáveis em impacto positivo, ganha EcoPoints e evolui com a comunidade.'
    : 'Completa missões, partilha ações sustentáveis e ajuda a comunidade a criar um impacto positivo.';
  const btnText = isWelcome ? 'Começar tutorial' : 'Explorar o EcoChat';
  const isSaving = Boolean(state?.completionSaving);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.58)',
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        style={{
          width: '100%',
          maxWidth: 420,
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 20,
          padding: 32,
          textAlign: 'center',
          boxShadow: isDarkMode
            ? '0 24px 48px -12px rgba(0,0,0,0.55)'
            : '0 24px 48px -12px rgba(15,23,42,0.18)',
          fontFamily: '"Inter", "Poppins", "Segoe UI", sans-serif',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tutorial-${mode}-title`}
        aria-describedby={`tutorial-${mode}-desc`}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #22C55E 0%, #166534 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.28)',
            margin: '0 auto 24px auto',
          }}
        >
          {isWelcome ? <Leaf size={36} strokeWidth={2} /> : <Trophy size={36} strokeWidth={2} />}
        </div>

        <h2 id={`tutorial-${mode}-title`} style={{ fontSize: 24, fontWeight: 800, color: text, marginBottom: 12 }}>
          {title}
        </h2>

        <p id={`tutorial-${mode}-desc`} style={{ fontSize: 15, color: textSub, lineHeight: 1.6, marginBottom: 28, fontWeight: 500 }}>
          {desc}
        </p>

        {state?.completionError && (
          <p role="alert" style={{ color: '#ef4444', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
            {state.completionError}
          </p>
        )}

        <motion.button
          onClick={onAction}
          disabled={isSaving}
          whileHover={!isSaving ? { scale: 1.02 } : {}}
          whileTap={!isSaving ? { scale: 0.97 } : {}}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 14,
            fontWeight: 750,
            fontSize: 15,
            background: '#22C55E',
            color: '#fff',
            border: 'none',
            cursor: isSaving ? 'wait' : 'pointer',
            marginBottom: isWelcome ? 16 : 0,
            opacity: isSaving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isSaving && <Loader2 size={17} className="animate-spin" />}
          {btnText}
        </motion.button>

        {isWelcome && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: textSub,
              fontWeight: 650,
              fontSize: 14,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 4,
            }}
          >
            Agora não
          </button>
        )}
      </motion.div>
    </div>
  );
}
