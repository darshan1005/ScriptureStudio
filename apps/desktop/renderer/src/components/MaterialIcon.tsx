import React from 'react';

export interface MaterialIconProps {
  name: string;
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  filled?: boolean;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({
  name,
  size = 20,
  color,
  className = '',
  style = {},
  title,
  filled = false,
}) => {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <span
      className={`material-symbols-outlined ${className}`.trim()}
      title={title}
      aria-hidden={!title}
      style={{
        fontSize: sizeValue,
        width: sizeValue,
        height: sizeValue,
        color: color || 'currentColor',
        fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
        ...style,
      }}
    >
      {name}
    </span>
  );
};

export default MaterialIcon;

