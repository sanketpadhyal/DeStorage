import React, { useState } from 'react';
import './universalhover.css';

interface UniversalHoverProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'gradient' | 'ghost' | 'danger';
  scaleOnHover?: number;
  scaleOnPress?: number;
  className?: string;
}

/**
 * Universal Tactical Spring Button Component
 * Delivers professional Apple/Linear physical press depth, elastic spring rebound,
 * and magnetic hover states across all platforms and devices.
 */
export const UniversalHover: React.FC<UniversalHoverProps> = ({
  children,
  variant = 'gradient',
  scaleOnHover = 1.02,
  scaleOnPress = 0.95,
  className = '',
  style,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState<boolean>(false);

  return (
    <button
      className={`universal-btn universal-btn-${variant} ${isPressed ? 'is-pressed' : ''} ${className}`}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        ...style,
        transform: isPressed 
          ? `scale(${scaleOnPress})` 
          : undefined,
      }}
      {...props}
    >
      <span className="universal-btn-inner">{children}</span>
    </button>
  );
};

export default UniversalHover;
