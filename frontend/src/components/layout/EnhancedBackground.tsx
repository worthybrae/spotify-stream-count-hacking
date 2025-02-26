// components/layout/EnhancedBackground.tsx
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface EnhancedBackgroundProps {
  isTransitioning?: boolean;
}

const EnhancedBackground: React.FC<EnhancedBackgroundProps> = ({ isTransitioning = false }) => {
  const particlesRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  
  // Effect to handle transitions
  useEffect(() => {
    if (isTransitioning) {
      // When transitioning to album view, hide default background quickly
      setIsVisible(false);
    } else {
      // When going back to default, show it immediately
      setIsVisible(true);
    }
  }, [isTransitioning]);
  
  useEffect(() => {
    if (!particlesRef.current) return;
    
    // Clear any existing particles
    particlesRef.current.innerHTML = '';
    
    // Create particles
    const particlesContainer = particlesRef.current;
    const particleCount = 60; // Increased from 30 to 60
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      
      // Random size (doubled the max size)
      const size = Math.random() * 6 + 2; // Increased from 3+1 to 6+2
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      
      // Random opacity
      particle.style.opacity = `${Math.random() * 0.6 + 0.2}`; // Increased minimum opacity
      
      // Random animation duration
      const duration = Math.random() * 100 + 50;
      particle.style.animationDuration = `${duration}s`;
      
      // Random delay
      const delay = Math.random() * 50;
      particle.style.animationDelay = `-${delay}s`;
      
      particlesContainer.appendChild(particle);
    }
  }, []);
  
  // Background transition classes
  const backgroundClasses = cn(
    "app-background",
    { "opacity-0": !isVisible },
    { "opacity-100": isVisible }
  );
  
  return (
    <div className={backgroundClasses} style={{ 
      transition: 'opacity 0.5s ease-in-out',
      backgroundColor: '#0f0f19' // Ensure a dark background
    }}>
      {/* More vibrant gradients */}
      <div className="gradient-mesh" style={{ 
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.5) 0%, transparent 45%),
          radial-gradient(circle at 80% 30%, rgba(236, 72, 153, 0.5) 0%, transparent 50%),
          radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.5) 0%, transparent 55%)
        `,
        transition: 'opacity 0.5s ease-in-out',
        animationPlayState: isVisible ? 'running' : 'paused'
      }}></div>
      <div className="grid-pattern"></div>
      <div className="particles" ref={particlesRef}></div>
    </div>
  );
};

export default EnhancedBackground;