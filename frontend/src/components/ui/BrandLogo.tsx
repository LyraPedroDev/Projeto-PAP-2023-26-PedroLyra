import { motion } from 'motion/react';
import logo from '../../assets/ecochat-logo-v2.png';

interface BrandLogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function BrandLogo({ size = 40, animate = true, className }: BrandLogoProps) {
  return (
    <motion.img
      src={logo}
      alt="EcoChat"
      className={className}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain' }}
      whileHover={animate ? { scale: 1.06, rotate: 2 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    />
  );
}
