'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Incident } from '@rlr/schemas';
import { shortHash, formatRevenueDaily, formatConfidence, formatNumber } from '@/lib/utils';

interface CorrelationFlowGraphProps {
  incident?: Incident | null;
}

interface FlowNode {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  color: string;
  bgColor: string;
  borderColor: string;
  value?: string;
  valueColor?: string;
  pulse?: boolean;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  animated?: boolean;
  color: string;
}

// Animated dot traveling along a path
function AnimatedDot({
  d,
  color,
  duration,
  delay = 0,
}: {
  d: string;
  color: string;
  duration: number;
  delay?: number;
}) {
  return (
    <circle r="3" fill={color} opacity="0.9">
      <animateMotion
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={d}
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
      />
    </circle>
  );
}

export function CorrelationFlowGraph({ incident }: CorrelationFlowGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  const W = 640;
  const H = 240;

  // Node positions in a left-to-right flow
  const nodes: FlowNode[] = [
    {
      id: 'deploy',
      label: 'Deployment',
      sublabel: incident?.deployment_id
        ? `deploy:${shortHash(incident.deployment_id)}`
        : 'abc123f',
      x: 60, y: H / 2,
      color: '#2563EB', bgColor: 'rgba(30,58,110,0.8)', borderColor: '#2563EB',
      pulse: false,
    },
    {
      id: 'incident',
      label: 'Incident',
      sublabel: 'Active',
      value: incident ? formatConfidence(incident.correlation_confidence) + ' confidence' : '94% confidence',
      valueColor: '#10B981',
      x: 210, y: H / 2,
      color: '#EF4444', bgColor: 'rgba(69,10,10,0.9)', borderColor: '#EF4444',
      pulse: true,
    },
    {
      id: 'payments',
      label: 'Payment Failures',
      sublabel: 'Stripe webhook',
      x: 360, y: H / 2 - 50,
      color: '#F59E0B', bgColor: 'rgba(69,26,3,0.8)', borderColor: '#F59E0B',
      pulse: false,
    },
    {
      id: 'errors',
      label: 'Error Surge',
      sublabel: 'Sentry / Datadog',
      x: 360, y: H / 2 + 50,
      color: '#F59E0B', bgColor: 'rgba(69,26,3,0.8)', borderColor: '#F59E0B',
      pulse: false,
    },
    {
      id: 'revenue',
      label: 'Revenue Leak',
      sublabel: incident ? formatRevenueDaily(incident.estimated_revenue_impact_daily) + '/day' : '$42k/day',
      x: 510, y: H / 2,
      color: '#8B5CF6', bgColor: 'rgba(46,16,101,0.9)', borderColor: '#8B5CF6',
      value: incident?.affected_customer_count
        ? `${formatNumber(incident.affected_customer_count)} affected`
        : '847 affected',
      valueColor: '#EF4444',
      pulse: true,
    },
  ];

  const edges: FlowEdge[] = [
    { from: 'deploy', to: 'incident', label: 'triggers', animated: true, color: '#EF4444' },
    { from: 'incident', to: 'payments', animated: true, color: '#F59E0B' },
    { from: 'incident', to: 'errors', animated: true, color: '#F59E0B' },
    { from: 'payments', to: 'revenue', animated: true, color: '#8B5CF6' },
    { from: 'errors', to: 'revenue', animated: true, color: '#8B5CF6' },
  ];

  function getNode(id: string) {
    return nodes.find((n) => n.id === id)!;
  }

  function edgePath(from: FlowNode, to: FlowNode) {
    const dx = to.x - from.x;
    const cp1x = from.x + dx * 0.4;
    const cp1y = from.y;
    const cp2x = to.x - dx * 0.4;
    const cp2y = to.y;
    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
  }

  const nodeW = 90;
  const nodeH = 56;

  return (
    <div className="w-full overflow-hidden rounded-lg bg-background-secondary border border-surface-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">
          Correlation Flow
        </div>
        <div className="live-indicator text-2xs">Live causal chain</div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ height: '200px' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker id="arrow-danger" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#EF4444" opacity="0.7" />
          </marker>
          <marker id="arrow-warning" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#F59E0B" opacity="0.7" />
          </marker>
          <marker id="arrow-revenue" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#8B5CF6" opacity="0.7" />
          </marker>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid lines for terminal aesthetic */}
        {[60, 120, 180].map((y) => (
          <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="rgba(30,45,69,0.4)" strokeWidth="1" />
        ))}
        {[128, 256, 384, 512].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2={H} stroke="rgba(30,45,69,0.4)" strokeWidth="1" />
        ))}

        {/* Edges */}
        {edges.map((edge, i) => {
          const fromNode = getNode(edge.from);
          const toNode = getNode(edge.to);
          const d = edgePath(fromNode, toNode);
          const arrowId =
            edge.color === '#EF4444' ? 'arrow-danger' :
            edge.color === '#F59E0B' ? 'arrow-warning' : 'arrow-revenue';
          return (
            <g key={i}>
              <path
                d={d}
                fill="none"
                stroke={edge.color}
                strokeWidth="1.5"
                strokeOpacity="0.4"
                markerEnd={`url(#${arrowId})`}
              />
              {edge.animated && (
                <AnimatedDot d={d} color={edge.color} duration={2.5 + i * 0.4} delay={i * 0.5} />
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x - nodeW / 2}, ${node.y - nodeH / 2})`}>
            {/* Pulse ring for critical nodes */}
            {node.pulse && (
              <rect
                x="-4" y="-4"
                width={nodeW + 8} height={nodeH + 8}
                rx="10"
                fill="none"
                stroke={node.borderColor}
                strokeWidth="1"
                strokeOpacity="0.4"
              >
                <animate
                  attributeName="stroke-opacity"
                  values="0.4;0.8;0.4"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="stroke-width"
                  values="1;2;1"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </rect>
            )}
            {/* Node box */}
            <rect
              width={nodeW} height={nodeH}
              rx="8"
              fill={node.bgColor}
              stroke={node.borderColor}
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
            {/* Node label */}
            <text
              x={nodeW / 2} y="18"
              textAnchor="middle"
              fill={node.color}
              fontSize="10"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              {node.label}
            </text>
            {/* Sublabel */}
            <text
              x={nodeW / 2} y="30"
              textAnchor="middle"
              fill="rgba(148,163,184,0.9)"
              fontSize="8"
              fontFamily="JetBrains Mono, monospace"
            >
              {node.sublabel}
            </text>
            {/* Value if present */}
            {node.value && (
              <text
                x={nodeW / 2} y="44"
                textAnchor="middle"
                fill={node.valueColor ?? '#F1F5F9'}
                fontSize="9"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                {node.value}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
