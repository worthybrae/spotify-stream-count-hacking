// ScrollbarRemover.tsx
// This is a utility component that injects global styles to hide scrollbars

import React, { useEffect } from 'react';

const ScrollbarRemover: React.FC = () => {
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement('style');

    // Add aggressive scrollbar hiding styles
    styleElement.textContent = `
      /* Hide scrollbar for Chrome, Safari and Opera */
      ::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        background: transparent !important;
      }

      /* Hide scrollbar for IE, Edge and Firefox */
      * {
        -ms-overflow-style: none !important;  /* IE and Edge */
        scrollbar-width: none !important;  /* Firefox */
      }

      /* Ensure overflow behavior still works properly */
      .overflow-y-auto, .overflow-y-scroll {
        overflow-y: auto !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      /* Prevent horizontal scrolling */
      body, .main-content {
        overflow-x: hidden !important;
      }
    `;

    // Append to the document head
    document.head.appendChild(styleElement);

    // Clean up on component unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default ScrollbarRemover;