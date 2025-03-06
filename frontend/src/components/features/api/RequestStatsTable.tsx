// components/features/api/RequestStatsTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiRequest } from '@/types/api';
import { useState, useEffect } from 'react';

interface RequestStatsTableProps {
  requests: ApiRequest[];
}

const RequestStatsTable: React.FC<RequestStatsTableProps> = ({ requests }) => {
  // Use state to force periodic updates of relative times
  const [, setTimeUpdate] = useState(0);
  
  // Log received data to help debugging
  useEffect(() => {
    if (requests && requests.length > 0) {
      console.log('First request:', requests[0]);
    }
  }, [requests]);
  
  // Update the time display every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUpdate(prev => prev + 1);
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  if (!requests || requests.length === 0) {
    return (
      <div className="text-sm text-white/60 text-center py-6 bg-black/20 rounded-md">
        No requests in the past hour
      </div>
    );
  }

  // Function to calculate accurate time difference from any timestamp format
  const getTimeDiff = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    
    let date: Date;
    
    try {
      // Handle different possible timestamp formats
      if (typeof timestamp === 'string') {
        if (/^\d{10}$/.test(timestamp)) {
          // Unix timestamp (seconds)
          date = new Date(parseInt(timestamp) * 1000);
        } else if (/^\d{13}$/.test(timestamp)) {
          // Unix timestamp (milliseconds)
          date = new Date(parseInt(timestamp));
        } else {
          // ISO or other string format
          date = new Date(timestamp);
        }
      } else if (typeof timestamp === 'number') {
        // Numeric timestamp
        date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
      } else {
        return 'Unknown';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      
      // Calculate time difference
      const now = Date.now();
      const diffMs = now - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      // Format time difference
      if (diffMinutes < 1) {
        return 'Just now';
      } else if (diffMinutes === 1) {
        return '1 min ago';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} mins ago`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        if (hours === 1) {
          return '1 hour ago';
        } else if (hours < 24) {
          return `${hours} hours ago`;
        } else {
          const days = Math.floor(hours / 24);
          return days === 1 ? '1 day ago' : `${days} days ago`;
        }
      }
    } catch (error) {
      console.error('Error parsing timestamp:', timestamp, error);
      return 'Unknown';
    }
  };

  // Sort requests by timestamp (newest first)
  const sortedRequests = [...requests].sort((a, b) => {
    try {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    } catch (error) {
      return 0; // Keep original order if parsing fails
    }
  });

  return (
    <div className="rounded-md border border-white/10 flex-1 overflow-y-auto">
      <Table className="border-collapse">
        <TableHeader className="bg-black/30 sticky top-0">
          <TableRow className="hover:bg-transparent border-b-0">
            <TableHead className="text-white font-medium w-1/4 pl-3">Time</TableHead>
            <TableHead className="text-white font-medium w-3/4 pl-0">Endpoint</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="border-t-0">
          {sortedRequests.map((request, index) => (
            <TableRow 
              key={index} 
              className="border-white/5 hover:bg-white/5"
            >
              <TableCell className="text-white/80 text-xs pl-3 py-2">
                {getTimeDiff(request.timestamp)}
              </TableCell>
              <TableCell className="font-mono text-xs text-blue-300 pl-0 py-2">
                {request.endpoint}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RequestStatsTable;