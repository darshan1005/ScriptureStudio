import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = '550px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="modal-container"
        style={{
          width,
          maxWidth: '100%',
          backgroundColor: '#0E1A2D',
          border: '1px solid #1E355B',
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(56, 189, 248, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #1E355B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#13233D',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            ✕
          </button>
        </div>
        <div
          className="modal-body custom-scrollbar"
          style={{
            padding: '1.25rem',
            overflowY: 'auto',
            maxHeight: '80vh',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(56, 189, 248, 0.35) transparent',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

