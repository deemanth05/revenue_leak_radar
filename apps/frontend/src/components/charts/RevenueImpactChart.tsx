'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface TrendPoint {
  timestamp: string;
  value: number;
}

interface RevenueImpactChartProps {
  data: TrendPoint[];
  height?: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-elevated px-3 py-2 border border-danger/20 shadow-danger">
      <div className="text-2xs text-text-muted mb-1">{label}</div>
      <div className="text-sm font-bold text-danger">
        ${(payload[0].value / 1000).toFixed(1)}k/day
      </div>
      <div className="text-2xs text-text-muted">Revenue at risk</div>
    </div>
  );
}

export function RevenueImpactChart({ data, height = 200 }: RevenueImpactChartProps) {
  const chartData = data.map((p) => ({
    time: format(parseISO(p.timestamp), 'HH:mm'),
    value: p.value,
    fullTime: p.timestamp,
  }));

  // Find the peak for reference line
  const maxValue = Math.max(...data.map((d) => d.value));
  const maxPoint = chartData.find((d) => d.value === maxValue);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />

        <XAxis
          dataKey="time"
          tick={{ fill: '#475569', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={3}
        />
        <YAxis
          tick={{ fill: '#475569', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={40}
        />

        <Tooltip content={<CustomTooltip />} />

        {maxPoint && (
          <ReferenceLine
            x={maxPoint.time}
            stroke="#EF4444"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
        )}

        <Area
          type="monotone"
          dataKey="value"
          stroke="#EF4444"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#EF4444', stroke: '#0A0F1E', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
