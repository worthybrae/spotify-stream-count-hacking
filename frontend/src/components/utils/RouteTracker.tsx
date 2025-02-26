// src/components/utils/RouteTracker.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageview } from '../../lib/analytics';

const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Track pageview with Google Analytics
    pageview(location.pathname + location.search);
  }, [location]);
  
  return null; // This component doesn't render anything
};

export default RouteTracker;