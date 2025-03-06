import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricBadgeProps {
  icon: React.ReactNode;
  value: string;
  fullValue?: string;
  label?: string;
  className?: string;
}

// Reusable MetricBadge component with tooltip
const MetricBadge: React.FC<MetricBadgeProps> = ({ 
  icon, 
  value, 
  fullValue,
  label,
  className = "" 
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-1 ${className}`}>
          {icon}
          <span className="text-sm font-medium">{value}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs whitespace-nowrap">
          {label && <span className="mr-1">{label}:</span>}
          {fullValue || value}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default MetricBadge;