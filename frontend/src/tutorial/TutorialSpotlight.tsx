import React from 'react';
import { motion } from 'motion/react';

type Bounds = { top: number; left: number; width: number; height: number };

type TutorialSpotlightProps = {
  bounds: Bounds | null;
  padding?: number;
  borderRadius?: number;
  isDarkMode?: boolean;
  disableOverlay?: boolean;
};

export function TutorialSpotlight({ bounds, padding = 12, borderRadius = 20, isDarkMode = false, disableOverlay = false }: TutorialSpotlightProps) {
  if (disableOverlay) return null;
  
  // Se não houver bounds, o ecrã fica apenas escurecido
  const x = bounds ? bounds.left - padding : window.innerWidth / 2;
  const y = bounds ? bounds.top - padding : window.innerHeight / 2;
  const width = bounds ? bounds.width + padding * 2 : 0;
  const height = bounds ? bounds.height + padding * 2 : 0;
  
  // Overlay premium mais contido
  const overlayColor = isDarkMode ? 'rgba(2, 6, 23, 0.66)' : 'rgba(15, 23, 42, 0.50)';

  const springConfig = { type: 'spring', damping: 28, stiffness: 220, mass: 0.8 };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9998,
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
      <motion.svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              animate={{
                x,
                y,
                width,
                height,
                rx: width === 0 ? 0 : borderRadius
              }}
              transition={springConfig}
              fill="black"
            />
          </mask>
          
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient id="border-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.6)" />
            <stop offset="100%" stopColor="rgba(21, 128, 61, 0.6)" />
          </linearGradient>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill={overlayColor}
          mask="url(#spotlight-mask)"
        />
        
        {/* Borda verde fina, sem efeito neon forte nem pulsação */}
        <motion.rect
          animate={{
            x: x - 1,
            y: y - 1,
            width: width + 2,
            height: height + 2,
            rx: width === 0 ? 0 : borderRadius + 1,
            opacity: width > 0 ? 1 : 0
          }}
          transition={{
            x: springConfig,
            y: springConfig,
            width: springConfig,
            height: springConfig,
            rx: springConfig,
            opacity: { duration: 0.2 }
          }}
          fill="none"
          stroke="url(#border-gradient)"
          strokeWidth="1.5"
          filter="url(#glow)"
        />
      </motion.svg>
    </div>
  );
}
