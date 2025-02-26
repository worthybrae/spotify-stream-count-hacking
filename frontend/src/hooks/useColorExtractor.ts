// hooks/useColorExtractor.ts
import { useState, useEffect } from 'react';

export const useColorExtractor = (imageUrl: string | null) => {
    const [colors, setColors] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      if (!imageUrl) {
        setColors([]);
        return;
      }
  
      const extractColors = async () => {
        setLoading(true);
        setError(null);
  
        try {
          // Create an image element to load the cover art
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          
          img.onload = () => {
            // Create a canvas to draw the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              setError('Canvas context not available');
              setLoading(false);
              return;
            }
            
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image on canvas
            ctx.drawImage(img, 0, 0);
            
            // Sample more points from different areas of the image for better color representation
            const samplePoints = [
              // Corners
              { x: 0, y: 0 }, // top-left
              { x: img.width - 1, y: 0 }, // top-right
              { x: 0, y: img.height - 1 }, // bottom-left
              { x: img.width - 1, y: img.height - 1 }, // bottom-right
              
              // Center
              { x: Math.floor(img.width / 2), y: Math.floor(img.height / 2) },
              
              // Quarter points
              { x: Math.floor(img.width / 4), y: Math.floor(img.height / 4) },
              { x: Math.floor(img.width * 3/4), y: Math.floor(img.height / 4) },
              { x: Math.floor(img.width / 4), y: Math.floor(img.height * 3/4) },
              { x: Math.floor(img.width * 3/4), y: Math.floor(img.height * 3/4) },
              
              // Edge midpoints
              { x: Math.floor(img.width / 2), y: 0 }, // top middle
              { x: Math.floor(img.width / 2), y: img.height - 1 }, // bottom middle
              { x: 0, y: Math.floor(img.height / 2) }, // left middle
              { x: img.width - 1, y: Math.floor(img.height / 2) }, // right middle
              
              // Additional sampling points for better coverage
              { x: Math.floor(img.width / 3), y: Math.floor(img.height / 3) },
              { x: Math.floor(img.width * 2/3), y: Math.floor(img.height / 3) },
              { x: Math.floor(img.width / 3), y: Math.floor(img.height * 2/3) },
              { x: Math.floor(img.width * 2/3), y: Math.floor(img.height * 2/3) },
            ];
            
            // Extract raw colors from sample points
            const rawColors = samplePoints.map(point => {
              const pixel = ctx.getImageData(point.x, point.y, 1, 1).data;
              return { r: pixel[0], g: pixel[1], b: pixel[2] };
            });
            
            // Calculate color distance to find the most distinctive colors
            const distinctColors: {r: number, g: number, b: number}[] = [];
            
            // Function to calculate color distance (Euclidean distance in RGB space)
            const colorDistance = (c1: {r: number, g: number, b: number}, c2: {r: number, g: number, b: number}) => {
              return Math.sqrt(
                Math.pow(c2.r - c1.r, 2) + 
                Math.pow(c2.g - c1.g, 2) + 
                Math.pow(c2.b - c1.b, 2)
              );
            };
            
            // Function to check if a color is already in our distinct list
            const isDistinct = (color: {r: number, g: number, b: number}) => {
              const THRESHOLD = 25; // Reduced threshold for more color variety
              
              for (const existingColor of distinctColors) {
                if (colorDistance(color, existingColor) < THRESHOLD) {
                  return false;
                }
              }
              return true;
            };
            
            // Find most vibrant colors (adjusted brightness range)
            for (const color of rawColors) {
              const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
              
              // Allow a wider range of colors - less restrictive on brightness
              if (brightness < 20 || brightness > 240) continue;
              
              // Add to distinct list if not too similar to existing colors
              if (isDistinct(color)) {
                // Enhance color vibrancy by increasing saturation
                const enhancedColor = enhanceSaturation(color, 1.3); // Boost saturation by 30%
                distinctColors.push(enhancedColor);
                
                // Stop at 6 distinct colors
                if (distinctColors.length >= 6) break;
              }
            }
            
            // Helper function to increase color saturation
            function enhanceSaturation(color: {r: number, g: number, b: number}, factor: number): {r: number, g: number, b: number} {
              // Convert RGB to HSL, boost saturation, convert back to RGB
              // Simple approach: just boost the color components while maintaining their proportions
              const max = Math.max(color.r, color.g, color.b);
              const min = Math.min(color.r, color.g, color.b);
              
              if (max === min) {
                // Grayscale - can't increase saturation
                return color;
              }
              
              // Get the most prominent color component and boost it
              const boost = (max - min) * (factor - 1);
              
              // Apply boost based on which component is dominant
              let r = color.r, g = color.g, b = color.b;
              
              if (r === max) {
                r = Math.min(255, r + boost);
              } else if (g === max) {
                g = Math.min(255, g + boost);
              } else if (b === max) {
                b = Math.min(255, b + boost);
              }
              
              return { r, g, b };
            }
            
            // Convert to RGB strings
            const rgbColors = distinctColors.map(
              c => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`
            );
            
            // Take up to 6 colors
            setColors(rgbColors.slice(0, 6));
            setLoading(false);
          };
          
          img.onerror = () => {
            setError('Failed to load image');
            setLoading(false);
          };
          
          img.src = imageUrl;
          
        } catch (err) {
          setError('Error extracting colors');
          setLoading(false);
        }
      };
  
      extractColors();
    }, [imageUrl]);
  
    return { colors, loading, error };
  };

export default useColorExtractor;