// components/ui/EnhancedBackground.tsx
import React, { useEffect, useRef } from 'react';

const EnhancedBackground: React.FC = () => {
  const particlesRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!particlesRef.current) return;
    
    // Clear any existing particles
    particlesRef.current.innerHTML = '';
    
    // Create particles
    const particlesContainer = particlesRef.current;
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      
      // Random size
      const size = Math.random() * 3 + 1;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      
      // Random opacity
      particle.style.opacity = `${Math.random() * 0.6 + 0.1}`;
      
      // Random animation duration
      const duration = Math.random() * 100 + 50;
      particle.style.animationDuration = `${duration}s`;
      
      // Random delay
      const delay = Math.random() * 50;
      particle.style.animationDelay = `-${delay}s`;
      
      particlesContainer.appendChild(particle);
    }
  }, []);
  
  return (
    <div className="app-background">
      <div className="gradient-mesh"></div>
      <div className="grid-pattern"></div>
      <div className="particles" ref={particlesRef}></div>
    </div>
  );
};

export default EnhancedBackground;