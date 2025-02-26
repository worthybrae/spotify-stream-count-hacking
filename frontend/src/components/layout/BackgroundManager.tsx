// components/layout/BackgroundManager.tsx
import React, { useState, useEffect, useRef } from 'react';
import useColorExtractor from '@/hooks/useColorExtractor';
import { SearchResult } from '@/types/search';

interface BackgroundManagerProps {
  selectedAlbum: SearchResult | null;
}

// Helper function to convert RGB string to hex for animation
const rgbToHex = (rgb: string): string => {
  // Extract RGB values
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '#6366f1'; // Default if parsing fails
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  // Convert to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Helper function to interpolate between two colors
const interpolateColor = (color1: string, color2: string, factor: number): string => {
  // If colors are in RGB format, convert to hex
  if (color1.startsWith('rgb')) {
    color1 = rgbToHex(color1);
  }
  if (color2.startsWith('rgb')) {
    color2 = rgbToHex(color2);
  }
  
  // Extract RGB components
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);
  
  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);
  
  // Interpolate each component
  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const BackgroundManager: React.FC<BackgroundManagerProps> = ({ selectedAlbum }) => {
  const { colors, loading } = useColorExtractor(selectedAlbum?.cover_art || null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Set up default colors in hex for easier interpolation
  const defaultColors = [
    '#6366f1', // Indigo
    '#ec4899', // Pink 
    '#3b82f6'  // Blue
  ];
  
  // Current color state for animations
  const [currentColors, setCurrentColors] = useState(defaultColors);
  
  // Animate gradient transition
  const animateGradientTransition = (startColors: string[], endColors: string[], duration: number = 1500) => {
    if (!gradientRef.current) return;
    
    const startTime = performance.now();
    
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    function updateColors(timestamp: number) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use an easing function for smoother transitions
      // Cubic easing: progress³
      const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Interpolate all colors
      const color1 = interpolateColor(startColors[0], endColors[0], ease);
      const color2 = interpolateColor(startColors[1], endColors[1], ease);
      const color3 = interpolateColor(startColors[2], endColors[2], ease);
      
      // Update current colors state
      setCurrentColors([color1, color2, color3]);
      
      // Update the background gradient - IMPORTANT FIX: use consistent radial gradient positions
      if (gradientRef.current) {
        gradientRef.current.style.backgroundImage = `
          radial-gradient(circle at 15% 20%, ${color1}99 0%, transparent 45%),
          radial-gradient(circle at 85% 30%, ${color2}99 0%, transparent 50%),
          radial-gradient(circle at 50% 80%, ${color3}99 0%, transparent 55%)
        `;
        
        // Ensure no transform or position changes during animation
        gradientRef.current.style.transform = 'translateZ(0)';
        gradientRef.current.style.left = '0';
        gradientRef.current.style.top = '0';
        gradientRef.current.style.width = '100vw';
        gradientRef.current.style.height = '100vh';
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(updateColors);
      } else {
        animationRef.current = null;
      }
    }
    
    animationRef.current = requestAnimationFrame(updateColors);
  };
  
  // Initialize gradient with default colors
  useEffect(() => {
    if (gradientRef.current) {
      // Set initial gradient with default colors
      gradientRef.current.style.backgroundImage = `
        radial-gradient(circle at 15% 20%, ${defaultColors[0]}99 0%, transparent 45%),
        radial-gradient(circle at 85% 30%, ${defaultColors[1]}99 0%, transparent 50%),
        radial-gradient(circle at 50% 80%, ${defaultColors[2]}99 0%, transparent 55%)
      `;
      
      // Ensure fixed position and size
      gradientRef.current.style.position = 'absolute';
      gradientRef.current.style.top = '0';
      gradientRef.current.style.left = '0';
      gradientRef.current.style.width = '100vw';
      gradientRef.current.style.height = '100vh';
      gradientRef.current.style.margin = '0';
      gradientRef.current.style.transform = 'translateZ(0)';
    }
  }, []);
  
  // Update colors based on album selection
  useEffect(() => {
    if (selectedAlbum && colors.length >= 3 && !loading) {
      // Enhance album colors
      const hexColors = colors.slice(0, 3).map(rgbToHex);
      
      // Animate transition to album colors
      animateGradientTransition(currentColors, hexColors);
    } else if (!selectedAlbum && currentColors.some((color, i) => color !== defaultColors[i])) {
      // Animate back to default colors only if they've changed
      animateGradientTransition(currentColors, defaultColors);
    }
    
    // Cleanup animation on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [selectedAlbum, colors, loading]);
  
  // Create particles effect
  useEffect(() => {
    if (!particlesRef.current) return;
    
    // Clear any existing particles
    particlesRef.current.innerHTML = '';
    
    // Create particles
    const particlesContainer = particlesRef.current;
    const particleCount = 60;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      
      // Random size
      const size = Math.random() * 6 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      
      // Random opacity
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
  
  return (
    <div className="app-background" style={{
      background: 'linear-gradient(to bottom, #1a1a2e, #16213e)',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <div 
        className="gradient-mesh" 
        ref={gradientRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          willChange: 'background-image'
        }}
      ></div>
      <div className="grid-pattern" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}></div>
      <div className="particles" ref={particlesRef} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}></div>
    </div>
  );
};

export default BackgroundManager;