import React from 'react';

export const SearchStyles: React.FC = () => {
  return (
    <style>{`
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .scale-102 {
        scale: 1.02;
      }
      .text-xxs {
        font-size: 0.65rem;
      }
    `}</style>
  );
};