import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'freeze' | 'danger' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  active?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  active = false,
  className = '',
  style,
  children,
  ...props
}) => {
  let baseStyle: React.CSSProperties = {
    fontFamily: 'inherit',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    borderRadius: '6px',
    transition: 'all 0.15s ease-in-out',
    fontWeight: 600,
    fontSize: '0.9rem',
    padding: '0.5rem 1rem',
  };

  if (variant === 'primary') {
    baseStyle = {
      ...baseStyle,
      backgroundColor: '#10B981',
      color: '#FFFFFF',
    };
  } else if (variant === 'secondary') {
    baseStyle = {
      ...baseStyle,
      backgroundColor: '#13233D',
      color: '#F1F5F9',
      border: '1px solid #1E355B',
    };
  } else if (variant === 'freeze') {
    baseStyle = {
      ...baseStyle,
      backgroundColor: active ? '#06B6D4' : 'rgba(6, 182, 212, 0.15)',
      color: active ? '#000000' : '#06B6D4',
      border: '1px solid #06B6D4',
      fontWeight: 700,
    };
  } else if (variant === 'danger') {
    baseStyle = {
      ...baseStyle,
      backgroundColor: '#EF4444',
      color: '#FFFFFF',
    };
  } else if (variant === 'ghost') {
    baseStyle = {
      ...baseStyle,
      backgroundColor: 'transparent',
      color: '#94A3B8',
    };
  }

  return (
    <button style={{ ...baseStyle, ...style }} className={className} {...props}>
      {children}
    </button>
  );
};

