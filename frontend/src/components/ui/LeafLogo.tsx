import React from 'react';
import { motion } from 'motion/react';

interface LeafLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  animate?: boolean;
}

export function LeafLogo({ size = 24, color = 'currentColor', animate = true, ...props }: LeafLogoProps) {
  // Se color for white ou algo explícito, deixamos, senão usamos gradiente
  const strokeColor = color === 'currentColor' ? "url(#leaf-gradient)" : color;

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      whileHover={animate ? { scale: 1.15, rotate: 5, filter: "drop-shadow(0 0 8px rgba(16,185,129,0.8))" } : {}}
      animate={animate ? { y: [0, -3, 0] } : {}}
      transition={{ y: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
      {...props as any}
    >
      <defs>
        <linearGradient id="leaf-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <motion.path 
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-13.9.2" 
        initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      <motion.path 
        d="M9 22v-4" 
        initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
      />
    </motion.svg>
  );
}
