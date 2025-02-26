// components/features/album/AlbumBackground.tsx
import React, { useEffect, useRef, useState } from 'react';
import useColorExtractor from '@/hooks/useColorExtractor';
import { SearchResult } from '@/types/search';

interface AlbumBackgroundProps {
  selectedAlbum: SearchResult | null;
}

const AlbumBackground: React.FC<AlbumBackgroundProps> = ({ selectedAlbum }) => {
  const { colors, loading } = useColorExtractor(selectedAlbum?.cover_art || null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [_, setIsExiting] = useState(false);
  
  // Effect to handle transitions based on album selection
  useEffect(() => {
    if (selectedAlbum) {
      // We have an album selected
      setIsExiting(false);
      
      // As soon as we have colors, make the background visible immediately
      if (colors.length > 0 && !loading) {
        setIsVisible(true);
      }
    } else {
      // Album has been deselected
      if (isVisible) {
        // Start exit animation
        setIsExiting(true);
        const exitTimeout = setTimeout(() => {
          setIsVisible(false);
          setIsExiting(false);
        }, 800); // Match transition duration
        return () => clearTimeout(exitTimeout);
      }
    }
  }, [selectedAlbum, colors, loading, isVisible]);
  
  // Effect to create particles
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
      
      // Random opacity - increased for more vibrancy
      particle.style.opacity = `${Math.random() * 0.6 + 0.2}`;
      
      // Random animation duration
      const duration = Math.random() * 100 + 50;
      particle.style.animationDuration = `${duration}s`;
      
      // Random delay
      const delay = Math.random() * 50;
      particle.style.animationDelay = `-${delay}s`;
      
      particlesContainer.appendChild(particle);
    }
  }, []);
  
  // Effect to update background gradient based on album colors
  useEffect(() => {
    if (!backgroundRef.current || colors.length === 0) return;
    
    // Create vibrant gradient mesh with album colors
    const background = backgroundRef.current;
    
    if (colors.length >= 3) {
      // Enhance colors with higher opacity and saturation
      // Convert RGB to more vibrant versions
      const enhanceColor = (color: string) => {
        // Extract RGB values
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const r = Math.min(255, parseInt(rgbMatch[1]) * 1.2); // Increase brightness by 20%
          const g = Math.min(255, parseInt(rgbMatch[2]) * 1.2);
          const b = Math.min(255, parseInt(rgbMatch[3]) * 1.2);
          return `rgba(${r}, ${g}, ${b}, 0.65)`; // Increased opacity
        }
        return color.replace('rgb', 'rgba').replace(')', ', 0.65)');
      };
      
      const color1 = enhanceColor(colors[0]);
      const color2 = enhanceColor(colors[1]);
      const color3 = enhanceColor(colors[2]);
      
      background.style.backgroundImage = `
        radial-gradient(circle at 10% 20%, ${color1} 0%, transparent 50%),
        radial-gradient(circle at 90% 30%, ${color2} 0%, transparent 55%),
        radial-gradient(circle at 60% 85%, ${color3} 0%, transparent 60%)
      `;
    }
  }, [colors]);
  
  // Create a vibrant background gradient based on album
  const backgroundStyle = {
    background: colors.length >= 2 
      ? `linear-gradient(to bottom, ${colors[0]}ee, ${colors[1]}ee)` // More opaque
      : `linear-gradient(to bottom, #1a1a2e, #16213e)`, // Deeper, more saturated dark colors
    transition: 'all 0.5s ease-in-out'
  };
  
  return (
    <div 
      className="app-background" 
      style={{
        ...backgroundStyle,
        opacity: isVisible ? 1 : 0,
        // Set a default dark background so there's never a white flash
        backgroundColor: '#0f0f19'
      }}
    >
      <div 
        className="gradient-mesh" 
        ref={backgroundRef} 
        style={{ 
          transition: 'all 0.5s ease-in-out',
          opacity: isVisible ? 0.9 : 0 // Increased opacity
        }}
      ></div>
      <div className="grid-pattern"></div>
      <div className="particles" ref={particlesRef}></div>
    </div>
  );
};

export default AlbumBackground;