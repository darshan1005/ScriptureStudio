import React from 'react';

export type BadgeVariant = 'live' | 'frozen' | 'idle' | 'tag';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'idle', children, style }) => {
  const baseStyle: React.CSSProperties = {
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  let variantStyle: React.CSSProperties = {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    color: '#94A3B8',
    border: '1px solid #1E355B',
  };

  if (variant === 'live') {
    variantStyle = {
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      color: '#F87171',
      border: '1px solid #EF4444',
    };
  } else if (variant === 'frozen') {
    variantStyle = {
      backgroundColor: 'rgba(6, 182, 212, 0.2)',
      color: '#22D3EE',
      border: '1px solid #06B6D4',
    };
  } else if (variant === 'tag') {
    variantStyle = {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      color: '#F59E0B',
      border: '1px solid #F59E0B',
    };
  }

  return <span style={{ ...baseStyle, ...variantStyle, ...style }}>{children}</span>;
};

