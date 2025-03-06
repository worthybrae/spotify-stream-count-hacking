// components/features/api/RequestStatsTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTimestamp } from '@/lib/utils/formatters';
import { ApiRequest } from '@/types/api';

interface RequestStatsTableProps {
  requests: ApiRequest[];
}

const RequestStatsTable: React.FC<RequestStatsTableProps> = ({ requests }) => {
  if (!requests || requests.length === 0) {
    return (
      <div className="text-sm text-white/60 text-center py-6 bg-black/20 rounded-md">
        No requests in the past hour
      </div>
    );
  }

  return (
    <div className="rounded-md border border-white/10 overflow-hidden">
      <Table>
        <TableHeader className="bg-black/30 border">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-white font-medium w-1/3">Timestamp</TableHead>
            <TableHead className="text-white font-medium w-2/3">Endpoint</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request, index) => (
            <TableRow 
              key={index} 
              className="border-white/5 hover:bg-white/5"
            >
              <TableCell className="text-white/80 text-xs font-mono">
                {formatTimestamp(request.timestamp)}
              </TableCell>
              <TableCell className="font-mono text-xs text-blue-300">
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