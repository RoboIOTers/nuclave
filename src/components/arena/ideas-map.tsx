'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { ContributionType, SignalType } from '@/types/arena';

// ── Types ──

interface Contribution {
  id: string;
  type: ContributionType;
  content: string;
  isSkepticAi: boolean;
  signals: Record<SignalType, number>;
}

interface MapNode extends SimulationNodeDatum {
  id: string;
  type: ContributionType;
  content: string;
  isSkepticAi: boolean;
  agree: number;
  critical: number;
  challenge: number;
  radius: number;
  cluster: number;
}

interface MapLink extends SimulationLinkDatum<MapNode> {
  similarity: number;
}

interface IdeasMapProps {
  contributions: Contribution[];
  arenaId: string;
}

// ── Colors ──

const TYPE_FILL: Record<ContributionType, string> = {
  benefit: '#22c55e',
  risk: '#ef4444',
  feature: '#f59e0b',
  blocker: '#dc2626',
  checklist: '#3b82f6',
  question: '#a855f7',
  decision: '#14b8a6',
  wildcard: '#ec4899',
};

const TYPE_LABELS: Record<ContributionType, string> = {
  benefit: 'Benefit',
  risk: 'Risk',
  feature: 'Idea',
  blocker: 'Blocker',
  checklist: 'Check',
  question: 'Question',
  decision: 'Decision',
  wildcard: 'Wild',
};

// ── Similarity (Jaccard on words) ──

function wordSet(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2)
  );
}

function jaccardSim(a: string, b: string): number {
  const setA = wordSet(a);
  const setB = wordSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const w of setA) if (setB.has(w)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

// ── Consensus color ──

function consensusColor(agree: number, challenge: number): string {
  if (agree === 0 && challenge === 0) return 'rgba(255,255,255,0.03)';
  const total = agree + challenge;
  const ratio = agree / total;
  if (ratio > 0.7) return `rgba(34,197,94,${Math.min(0.15, 0.05 + agree * 0.02)})`;
  if (ratio < 0.3) return `rgba(239,68,68,${Math.min(0.15, 0.05 + challenge * 0.02)})`;
  return `rgba(245,158,11,${Math.min(0.12, 0.04 + total * 0.01)})`;
}

// ── Component ──

export function IdeasMap({ contributions, arenaId }: IdeasMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [links, setLinks] = useState<MapLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const animRef = useRef<number>(0);
  const simRef = useRef<ReturnType<typeof forceSimulation<MapNode>> | null>(null);

  // Resize observer
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.max(400, width), height: Math.max(300, height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Assign clusters by type
  const typeOrder = useMemo(() => {
    const types = [...new Set(contributions.map((c) => c.type))];
    return new Map(types.map((t, i) => [t, i]));
  }, [contributions]);

  // Build nodes + links when contributions change
  useEffect(() => {
    if (contributions.length === 0) {
      setNodes([]);
      setLinks([]);
      return;
    }

    const newNodes: MapNode[] = contributions.map((c) => {
      const agree = c.signals.agree;
      const baseRadius = 18;
      const radius = baseRadius + Math.min(agree * 4, 30);
      return {
        id: c.id,
        type: c.type,
        content: c.content,
        isSkepticAi: c.isSkepticAi,
        agree: c.signals.agree,
        critical: c.signals.critical,
        challenge: c.signals.challenge,
        radius,
        cluster: typeOrder.get(c.type) ?? 0,
      };
    });

    // Find links based on text similarity
    const newLinks: MapLink[] = [];
    const SIM_THRESHOLD = 0.25;
    for (let i = 0; i < contributions.length; i++) {
      for (let j = i + 1; j < contributions.length; j++) {
        const sim = jaccardSim(contributions[i].content, contributions[j].content);
        if (sim >= SIM_THRESHOLD) {
          newLinks.push({
            source: contributions[i].id,
            target: contributions[j].id,
            similarity: sim,
          });
        }
      }
    }

    setNodes(newNodes);
    setLinks(newLinks);
  }, [contributions, typeOrder]);

  // Run force simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const { width, height } = dimensions;
    const clusterCount = typeOrder.size;

    // Position cluster centers in a circle
    const clusterAngle = (i: number) => (i / Math.max(clusterCount, 1)) * 2 * Math.PI;
    const clusterRadius = Math.min(width, height) * 0.25;

    const sim = forceSimulation<MapNode>(nodes)
      .force('charge', forceManyBody<MapNode>().strength(-80))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collision', forceCollide<MapNode>().radius((d) => d.radius + 3).strength(0.8))
      .force(
        'link',
        forceLink<MapNode, MapLink>(links)
          .id((d) => d.id)
          .distance(80)
          .strength((l) => (l as MapLink).similarity * 0.5)
      )
      .force(
        'clusterX',
        forceX<MapNode>((d) => width / 2 + Math.cos(clusterAngle(d.cluster)) * clusterRadius).strength(0.15)
      )
      .force(
        'clusterY',
        forceY<MapNode>((d) => height / 2 + Math.sin(clusterAngle(d.cluster)) * clusterRadius).strength(0.15)
      )
      .alphaDecay(0.02)
      .on('tick', () => {
        setNodes((prev) => [...prev]);
      });

    simRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [nodes.length, links.length, dimensions, typeOrder]);

  if (contributions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-dim text-sm">
        Add contributions to see the Ideas Map
      </div>
    );
  }

  const { width, height } = dimensions;

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
        {[...typeOrder.entries()].map(([type]) => (
          <div key={type} className="flex items-center gap-1.5 text-[10px] text-dim">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: TYPE_FILL[type] }}
            />
            {TYPE_LABELS[type]}
          </div>
        ))}
      </div>

      {/* Consensus legend */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-3 text-[9px] font-mono text-dim">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(34,197,94,0.15)' }} />
          consensus
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(245,158,11,0.12)' }} />
          contested
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(239,68,68,0.15)' }} />
          disagreed
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      >
        {/* Consensus heatmap zones */}
        {nodes.map((node) => {
          if (!node.x || !node.y) return null;
          const glow = consensusColor(node.agree, node.challenge);
          const glowR = node.radius * 3;
          return (
            <circle
              key={`heatmap-${node.id}`}
              cx={node.x}
              cy={node.y}
              r={glowR}
              fill={glow}
              style={{ transition: 'cx 0.1s, cy 0.1s, r 0.3s' }}
            />
          );
        })}

        {/* Connection lines */}
        {links.map((link, i) => {
          const s = typeof link.source === 'object' ? link.source : nodes.find((n) => n.id === link.source);
          const t = typeof link.target === 'object' ? link.target : nodes.find((n) => n.id === link.target);
          if (!s?.x || !s?.y || !t?.x || !t?.y) return null;
          return (
            <line
              key={`link-${i}`}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1 + link.similarity * 3}
              style={{ transition: 'x1 0.1s, y1 0.1s, x2 0.1s, y2 0.1s' }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          if (!node.x || !node.y) return null;
          const isHovered = hoveredNode?.id === node.id;
          const fill = TYPE_FILL[node.type];

          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
            >
              {/* Outer ring for agree count */}
              {node.agree > 0 && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius + 3}
                  fill="none"
                  stroke={fill}
                  strokeWidth={1.5}
                  strokeOpacity={0.3}
                  style={{ transition: 'cx 0.1s, cy 0.1s' }}
                />
              )}

              {/* Main bubble */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={fill}
                fillOpacity={isHovered ? 0.9 : node.isSkepticAi ? 0.3 : 0.6}
                stroke={isHovered ? '#fff' : 'none'}
                strokeWidth={2}
                style={{ transition: 'cx 0.1s, cy 0.1s, fill-opacity 0.2s' }}
              />

              {/* Agree count */}
              {node.agree > 0 && (
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize={Math.max(10, node.radius * 0.5)}
                  fontWeight="700"
                  fontFamily="system-ui"
                  style={{ transition: 'x 0.1s, y 0.1s', pointerEvents: 'none' }}
                >
                  +{node.agree}
                </text>
              )}

              {/* Skeptic AI badge */}
              {node.isSkepticAi && (
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize={9}
                  fontFamily="system-ui"
                  style={{ transition: 'x 0.1s, y 0.1s', pointerEvents: 'none' }}
                >
                  AI
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredNode && hoveredNode.x && hoveredNode.y && (
        <div
          className="absolute z-20 bg-ink text-paper border border-white/10 px-3 py-2 text-xs max-w-[250px] pointer-events-none shadow-lg"
          style={{
            left: Math.min(hoveredNode.x + 15, width - 270),
            top: hoveredNode.y - 10,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: TYPE_FILL[hoveredNode.type] }}
            />
            <span className="font-mono text-[10px] uppercase text-paper/50">
              {TYPE_LABELS[hoveredNode.type]}
            </span>
            {hoveredNode.isSkepticAi && (
              <span className="text-[9px] text-accent">Skeptic AI</span>
            )}
          </div>
          <p className="text-paper/80 leading-relaxed">{hoveredNode.content}</p>
          <div className="flex gap-3 mt-1.5 text-[10px] font-mono text-paper/40">
            <span>+{hoveredNode.agree} agree</span>
            <span>{hoveredNode.critical} important</span>
            <span>{hoveredNode.challenge} disagree</span>
          </div>
        </div>
      )}
    </div>
  );
}
