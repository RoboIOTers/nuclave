'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

// ── Similarity ──

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

// ── Consensus glow ──

function consensusGlow(agree: number, challenge: number): string {
  if (agree === 0 && challenge === 0) return 'rgba(255,255,255,0.02)';
  const total = agree + challenge;
  const ratio = agree / total;
  if (ratio > 0.7) return `rgba(34,197,94,${Math.min(0.12, 0.03 + agree * 0.015)})`;
  if (ratio < 0.3) return `rgba(239,68,68,${Math.min(0.12, 0.03 + challenge * 0.015)})`;
  return `rgba(245,158,11,${Math.min(0.1, 0.03 + total * 0.01)})`;
}

// ── Component ──

export function IdeasMap({ contributions }: IdeasMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation<MapNode>> | null>(null);
  const nodesRef = useRef<MapNode[]>([]);
  const linksRef = useRef<MapLink[]>([]);
  const [, forceRender] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [dims, setDims] = useState({ w: 800, h: 500 });

  // Resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      setDims({ w: Math.max(400, width), h: Math.max(350, height) });
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Type cluster mapping
  const typeOrder = useMemo(() => {
    const types = [...new Set(contributions.map((c) => c.type))];
    return new Map(types.map((t, i) => [t, i]));
  }, [contributions]);

  // Build graph data (only when contributions change by count)
  const contribCount = contributions.length;
  useEffect(() => {
    const { w, h } = dims;

    // Stop old simulation
    simRef.current?.stop();

    // Build nodes
    const newNodes: MapNode[] = contributions.map((c, i) => {
      const agree = c.signals.agree;
      const radius = 16 + Math.min(agree * 3, 24);
      // Start in a circle so they don't all spawn at 0,0
      const angle = (i / Math.max(contributions.length, 1)) * 2 * Math.PI;
      const startR = Math.min(w, h) * 0.2;
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
        x: w / 2 + Math.cos(angle) * startR,
        y: h / 2 + Math.sin(angle) * startR,
      };
    });

    // Build links
    const newLinks: MapLink[] = [];
    for (let i = 0; i < contributions.length; i++) {
      for (let j = i + 1; j < contributions.length; j++) {
        const sim = jaccardSim(contributions[i].content, contributions[j].content);
        if (sim >= 0.2) {
          newLinks.push({ source: newNodes[i], target: newNodes[j], similarity: sim });
        }
      }
    }

    nodesRef.current = newNodes;
    linksRef.current = newLinks;

    // Cluster positions
    const clusterCount = typeOrder.size || 1;
    const clusterAngle = (idx: number) => (idx / clusterCount) * 2 * Math.PI;
    const clusterR = Math.min(w, h) * 0.2;
    const pad = 40;

    // Simulation
    const sim = forceSimulation<MapNode>(newNodes)
      .force('charge', forceManyBody<MapNode>().strength(-30).distanceMax(200))
      .force('center', forceCenter(w / 2, h / 2).strength(0.1))
      .force('collision', forceCollide<MapNode>().radius((d) => d.radius + 4).strength(1))
      .force(
        'link',
        forceLink<MapNode, MapLink>(newLinks)
          .id((d) => d.id)
          .distance(60)
          .strength((l) => l.similarity * 0.3)
      )
      .force('clusterX', forceX<MapNode>((d) => w / 2 + Math.cos(clusterAngle(d.cluster)) * clusterR).strength(0.08))
      .force('clusterY', forceY<MapNode>((d) => h / 2 + Math.sin(clusterAngle(d.cluster)) * clusterR).strength(0.08))
      .velocityDecay(0.4)
      .alphaDecay(0.03)
      .on('tick', () => {
        // Clamp nodes inside bounds
        for (const node of newNodes) {
          node.x = Math.max(pad + node.radius, Math.min(w - pad - node.radius, node.x ?? w / 2));
          node.y = Math.max(pad + node.radius, Math.min(h - pad - node.radius, node.y ?? h / 2));
        }
        forceRender((n) => n + 1);
      });

    simRef.current = sim;

    return () => { sim.stop(); };
  }, [contribCount, dims, typeOrder]);

  const nodes = nodesRef.current;
  const links = linksRef.current;
  const { w, h } = dims;

  if (contributions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-paper/40 text-sm">
        Add contributions to see the Ideas Map
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px]">
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
        {[...typeOrder.entries()].map(([type]) => (
          <div key={type} className="flex items-center gap-1.5 text-[10px] text-paper/50">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_FILL[type] }} />
            {TYPE_LABELS[type]}
          </div>
        ))}
      </div>

      <div className="absolute top-3 right-3 z-10 flex items-center gap-3 text-[9px] font-mono text-paper/30">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(34,197,94,0.3)' }} />
          consensus
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(245,158,11,0.3)' }} />
          contested
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.3)' }} />
          disagreed
        </span>
      </div>

      <svg ref={svgRef} width={w} height={h} className="w-full h-full">
        {/* Consensus heatmap glow */}
        {nodes.map((n) => (
          <circle
            key={`glow-${n.id}`}
            cx={n.x ?? 0}
            cy={n.y ?? 0}
            r={n.radius * 2.5}
            fill={consensusGlow(n.agree, n.challenge)}
          />
        ))}

        {/* Links */}
        {links.map((link, i) => {
          const s = link.source as MapNode;
          const t = link.target as MapNode;
          if (!s.x || !s.y || !t.x || !t.y) return null;
          return (
            <line
              key={`l-${i}`}
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1 + link.similarity * 2}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const isHov = hoveredNode?.id === n.id;
          const fill = TYPE_FILL[n.type];
          return (
            <g
              key={n.id}
              onMouseEnter={() => setHoveredNode(n)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Agree ring */}
              {n.agree > 0 && (
                <circle cx={n.x ?? 0} cy={n.y ?? 0} r={n.radius + 3}
                  fill="none" stroke={fill} strokeWidth={1.5} strokeOpacity={0.3} />
              )}
              {/* Main bubble */}
              <circle
                cx={n.x ?? 0} cy={n.y ?? 0} r={n.radius}
                fill={fill}
                fillOpacity={isHov ? 0.95 : n.isSkepticAi ? 0.35 : 0.65}
                stroke={isHov ? '#fff' : 'none'}
                strokeWidth={2}
              />
              {/* Label */}
              <text
                x={n.x ?? 0} y={n.y ?? 0}
                textAnchor="middle" dominantBaseline="central"
                fill="#fff" fontSize={Math.max(9, n.radius * 0.45)}
                fontWeight="700" fontFamily="system-ui"
                style={{ pointerEvents: 'none' }}
              >
                {n.agree > 0 ? `+${n.agree}` : n.isSkepticAi ? 'AI' : ''}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-20 bg-[#1a1918] text-paper border border-white/10 px-3 py-2.5 text-xs max-w-[260px] pointer-events-none shadow-xl"
          style={{
            left: Math.min((hoveredNode.x ?? 0) + 20, w - 280),
            top: Math.max(10, (hoveredNode.y ?? 0) - 15),
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_FILL[hoveredNode.type] }} />
            <span className="font-mono text-[10px] uppercase text-paper/40">{TYPE_LABELS[hoveredNode.type]}</span>
            {hoveredNode.isSkepticAi && <span className="text-[9px] text-accent">Skeptic AI</span>}
          </div>
          <p className="text-paper/80 leading-relaxed mb-1.5">{hoveredNode.content}</p>
          <div className="flex gap-3 text-[10px] font-mono text-paper/35">
            <span>+{hoveredNode.agree} agree</span>
            <span>{hoveredNode.critical} important</span>
            <span>{hoveredNode.challenge} disagree</span>
          </div>
        </div>
      )}
    </div>
  );
}
