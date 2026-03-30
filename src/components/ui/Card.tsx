import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'blue' | 'saffron' | 'emerald' | 'none';
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

const glowStyles = {
  blue: 'hover:shadow-blue-500/20 hover:border-blue-500/30',
  saffron: 'hover:shadow-saffron-500/20 hover:border-saffron-500/30',
  emerald: 'hover:shadow-emerald-500/20 hover:border-emerald-500/30',
  none: '',
};

const paddingStyles = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
};

const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  glow = 'none',
  onClick,
  padding = 'lg',
}) => {
  const Component = hover || onClick ? motion.div : 'div';

  const motionProps = hover || onClick
    ? {
        whileHover: { y: -4, scale: 1.01 },
        whileTap: onClick ? { scale: 0.99 } : undefined,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }
    : {};

  return (
    <Component
      onClick={onClick}
      className={cn(
        'glass-card relative overflow-hidden',
        'transition-all duration-300',
        hover && 'cursor-pointer hover:shadow-xl hover:shadow-black/30',
        glow !== 'none' && glowStyles[glow],
        paddingStyles[padding],
        className
      )}
      {...motionProps}
    >
      {children}
    </Component>
  );
};

export default Card;
