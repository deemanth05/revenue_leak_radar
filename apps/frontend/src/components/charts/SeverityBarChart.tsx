'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SeverityData {
  name: string;
  value: number;
  color: string;
}

interface SeverityBarChartProps {
  data: Record<string, number>;
  height?: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#2563EB',
  low: '#475569',
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-elevated px-3 py-2 border border-surface-border">
      <div className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
        {payload[0].payload.name}
      </div>
      <div className="text-text-secondary text-xs">{payload[0].value} incidents</div>
    </div>
  );
}

export function SeverityBarChart({ data, height = 120 }: SeverityBarChartProps) {
  const chartData: SeverityData[] = Object.entries(data).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: SEVERITY_COLORS[key] || '#475569',
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={24}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" horizontal={true} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#475569', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: '#475569', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
