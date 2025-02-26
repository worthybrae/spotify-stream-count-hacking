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
      
      /* Custom scrollbar styles for search results */
      .overflow-auto::-webkit-scrollbar {
        width: 6px;
      }
      
      .overflow-auto::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }
      
      .overflow-auto::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }
      
      .overflow-auto::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    `}</style>
  );
};