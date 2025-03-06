import React from 'react';
import { Flame } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrackInfoProps {
  name: string;
  artist?: string;
  isHot: boolean;
}

// Component to display track name and artist
const TrackInfo: React.FC<TrackInfoProps> = ({ 
  name, 
  artist, 
  isHot 
}) => (
  <div className="flex-1 min-w-0 mr-2">
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="truncate max-w-[160px]">
              <p className="text-sm font-medium text-white truncate">{name}</p>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs whitespace-nowrap">{name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {isHot && <Flame className="h-5 w-5 text-orange-500 flex-shrink-0" />}
    </div>
    {artist && (
      <p className="text-xs text-white/60">{artist}</p>
    )}
  </div>
);

export default TrackInfo;