import { useState, useEffect } from 'react';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedModal = ({ isOpen, children, className = '', style = {} }: AnimatedModalProps) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }
  }, [isOpen]);

  const onAnimationEnd = () => {
    if (!isOpen) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
        isOpen ? 'animate-backdrop-enter' : 'animate-backdrop-exit'
      }`}
      style={{ backgroundColor: 'color-mix(in srgb, var(--background, #202225) 80%, transparent)' }}
      onAnimationEnd={onAnimationEnd}
    >
      <div
        className={`w-full shadow-2xl ${className} ${
          isOpen ? 'animate-modal-enter' : 'animate-modal-exit'
        }`}
        style={style}
      >
        {children}
      </div>
    </div>
  );
};
