import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StreamCount } from '@/types/api';

interface StreamChartProps {
  data: StreamCount[];
  title?: string;
  height?: string;
}

export function StreamChart({ 
  data, 
  title = "Streams Over Time",
  height = "h-64" 
}: StreamChartProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={height}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatDate}
          />
          <YAxis 
            tickFormatter={(value) => (
              value >= 1000000
                ? `${(value / 1000000).toFixed(1)}M`
                : value >= 1000
                ? `${(value / 1000).toFixed(1)}K`
                : value
            )}
          />
          <Tooltip
            formatter={(value: number) => [
              value.toLocaleString(),
              'Streams'
            ]}
            labelFormatter={formatFullDate}
          />
          <Line
            type="monotone"
            dataKey="playcount"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}