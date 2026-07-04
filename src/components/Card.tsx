import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: 'surface' | 'surface-2';
};

export function Card({ children, variant = 'surface', className = '', ...rest }: CardProps) {
  const bg = variant === 'surface' ? 'bg-surface' : 'bg-surface-2';
  return (
    <div className={`rounded-card border ${bg} p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}
