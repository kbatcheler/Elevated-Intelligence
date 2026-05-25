import { useMemo, useCallback, Fragment } from "react";
import {
  ReactFlow,
  Background,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  MarkerType,
  getBezierPath,
  type Node as RFNode,
  type Edge as RFEdge,
  type EdgeProps,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ─────────────────────────────────────────────────────────────────────────────
// Cross-layer map, rendered with React Flow. The visual identity (band rows,
// status colors, gap badges, hover isolation) is preserved 1:1 from the old
// hand-rolled SVG, but layout, edge routing, and label placement are now
// computed instead of hard-coded. That ends the recurring "labels overlap
// nodes" class of bug.
//
// Layout strategy: we keep the four-band horizontal structure (Executive,
// Market-facing, Operational, System) because it carries meaning. Nodes are
// placed at fixed Y per band, evenly spaced in X within the band. React Flow
// then routes bezier edges between explicit handles on the four sides of each
// node, so cross-band edges enter/exit vertically and same-band edges enter/
// exit horizontally — no edge ever crosses through a node anymore.
// ─────────────────────────────────────────────────────────────────────────────

type Band = "exec" | "market" | "ops" | "system";

const BAND_Y: Record<Band, number> = { exec: 60, market: 220, ops: 380, system: 540 };
const BAND_RANK: Record<Band, number> = { exec: 0, market: 1, ops: 2, system: 3 };
const BAND_LABEL: Record<Band, string> = {
  exec: "Executive",
  market: "Market-facing",
  ops: "Operational",
  system: "System",
};

const NODE_W = 148;
const NODE_H = 44;
const VIEWPORT_W = 920;

const statusColor = (s: "good" | "warn" | "bad") =>
  s === "bad" ? "var(--coral)" : s === "warn" ? "var(--amber)" : "var(--teal)";
const statusFill = (s: "good" | "warn" | "bad") =>
  s === "bad" ? "var(--coral-faint)" : s === "warn" ? "var(--amber-faint)" : "var(--teal-faint)";

// ─────────────────────────────────────────────────────────────────────────────
// Custom node, a layer card. All four sides expose invisible handles so the
// edge-routing logic below can pick the right one based on relative band rank.
// ─────────────────────────────────────────────────────────────────────────────

interface LayerNodeData extends Record<string, unknown> {
  label: string;
  status: "good" | "warn" | "bad";
  gapCount: number;
  isLit: boolean;
  isHover: boolean;
  showGapAnnotations: boolean;
}

const HANDLE_SIDES: Array<{ id: string; pos: Position }> = [
  { id: "t", pos: Position.Top },
  { id: "b", pos: Position.Bottom },
  { id: "l", pos: Position.Left },
  { id: "r", pos: Position.Right },
];

function LayerNode({ data }: { data: LayerNodeData }) {
  const color = statusColor(data.status);
  const fill = statusFill(data.status);
  const annotatedCount = Math.min(data.gapCount, 6);
  return (
    <div
      style={{
        position: "relative",
        opacity: data.isLit ? 1 : 0.22,
        transition: "opacity 140ms",
      }}
    >
      {HANDLE_SIDES.map(({ id, pos }) => (
        <Fragment key={id}>
          <Handle
            type="source"
            id={`s-${id}`}
            position={pos}
            style={{ opacity: 0, width: 1, height: 1, border: "none", background: "transparent", pointerEvents: "none" }}
          />
          <Handle
            type="target"
            id={`t-${id}`}
            position={pos}
            style={{ opacity: 0, width: 1, height: 1, border: "none", background: "transparent", pointerEvents: "none" }}
          />
        </Fragment>
      ))}
      {data.showGapAnnotations && data.gapCount > 0 && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 3,
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: annotatedCount }).map((_, i) => (
            <span
              key={i}
              style={{ width: 1.5, height: 9, background: "var(--coral)", opacity: 0.7, borderRadius: 1 }}
            />
          ))}
        </div>
      )}
      <div
        style={{
          width: NODE_W,
          height: NODE_H,
          borderRadius: 6,
          background: fill,
          border: `${data.isHover ? 2 : 1}px solid ${data.isHover ? color : "var(--cream-dark)"}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          boxSizing: "border-box",
          cursor: "pointer",
          boxShadow: data.isHover ? "0 4px 12px rgba(20, 30, 50, 0.08)" : "none",
          transition: "box-shadow 120ms, border-color 120ms",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--navy)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {data.label}
        </span>
      </div>
      {data.gapCount > 0 && (
        <div
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            minWidth: 20,
            height: 20,
            padding: "0 5px",
            borderRadius: 10,
            background: "var(--coral)",
            color: "white",
            border: "1.5px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, sans-serif",
            fontSize: 10,
            fontWeight: 700,
            pointerEvents: "none",
          }}
        >
          +{data.gapCount}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Band label, a non-interactive node anchored at left of each band row.
// ─────────────────────────────────────────────────────────────────────────────

interface BandLabelData extends Record<string, unknown> {
  label: string;
}

function BandLabelNode({ data }: { data: BandLabelData }) {
  return (
    <div
      style={{
        width: 100,
        textAlign: "right",
        fontFamily: "Inter, sans-serif",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: "var(--slate-light)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {data.label}
    </div>
  );
}

const nodeTypes = { layer: LayerNode, bandLabel: BandLabelNode };

// ─────────────────────────────────────────────────────────────────────────────
// Custom edge: bezier path + an HTML label positioned via linear interpolation
// along source/target. For multi-band spans we bias the label toward the
// source so it lands in the clear gap between bands instead of on top of a
// middle band's nodes (the exact failure mode of the old SVG impl).
// ─────────────────────────────────────────────────────────────────────────────

interface LabeledEdgeData extends Record<string, unknown> {
  label?: string;
  labelOffset?: number; // 0..1 along the straight line from source to target
  labelYShift?: number; // extra Y px applied after interpolation (negative = up)
  dimmed?: boolean;
}

function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const d = (data ?? {}) as LabeledEdgeData;
  const offset = d.labelOffset ?? 0.5;
  const yShift = d.labelYShift ?? 0;
  const labelX = sourceX + (targetX - sourceX) * offset;
  const labelY = sourceY + (targetY - sourceY) * offset + yShift;
  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {d.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              background: "#FFFFFF",
              border: "0.75px solid var(--cream-dark)",
              borderRadius: 3,
              padding: "2px 6px",
              fontFamily: "Inter, sans-serif",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--navy)",
              whiteSpace: "nowrap",
              opacity: d.dimmed ? 0.3 : 1,
              transition: "opacity 140ms",
            }}
          >
            {d.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = { labeled: LabeledEdge };

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export interface CrossLayerNode {
  key: string;
  label: string;
  band: Band;
  status: "good" | "warn" | "bad";
  gapCount: number;
}

export interface CrossLayerEdge {
  from: string;
  to: string;
  weight: number;
  label?: string;
}

interface Props {
  nodes: CrossLayerNode[];
  edges: CrossLayerEdge[];
  hover: string | null;
  setHover: (k: string | null) => void;
  highlightKey: string | null;
  onNavigate: (key: string) => void;
  showGapAnnotations: boolean;
  height?: number;
}

export default function CrossLayerFlow({
  nodes,
  edges,
  hover,
  setHover,
  highlightKey,
  onNavigate,
  showGapAnnotations,
  height = 640,
}: Props) {
  // Compute positions: group by band, evenly space along X.
  const positions = useMemo(() => {
    const byBand: Record<Band, CrossLayerNode[]> = { exec: [], market: [], ops: [], system: [] };
    nodes.forEach((n) => byBand[n.band].push(n));
    const out: Record<string, { x: number; y: number }> = {};
    (Object.keys(byBand) as Band[]).forEach((band) => {
      const list = byBand[band];
      const spacing = VIEWPORT_W / (list.length + 1);
      list.forEach((n, i) => {
        out[n.key] = { x: spacing * (i + 1) - NODE_W / 2, y: BAND_Y[band] };
      });
    });
    return out;
  }, [nodes]);

  // Lit/dim set derived from hover + cardHighlight (passed as highlightKey).
  const lit = useMemo(() => {
    if (highlightKey) {
      const [from, to] = highlightKey.split("->");
      return { edges: new Set([highlightKey]), nodes: new Set([from, to]), active: true };
    }
    if (hover) {
      const litEdges = new Set<string>();
      const litNodes = new Set<string>([hover]);
      edges.forEach((e) => {
        if (e.from === hover || e.to === hover) {
          litEdges.add(`${e.from}->${e.to}`);
          litNodes.add(e.from);
          litNodes.add(e.to);
        }
      });
      return { edges: litEdges, nodes: litNodes, active: true };
    }
    return { edges: new Set<string>(), nodes: new Set<string>(), active: false };
  }, [hover, highlightKey, edges]);

  const flowNodes: RFNode[] = useMemo(() => {
    const layerNodes: RFNode[] = nodes.map((n) => ({
      id: n.key,
      type: "layer",
      position: positions[n.key],
      data: {
        label: n.label,
        status: n.status,
        gapCount: n.gapCount,
        isLit: !lit.active || lit.nodes.has(n.key),
        isHover: hover === n.key,
        showGapAnnotations,
      } as LayerNodeData,
      draggable: false,
      selectable: false,
      focusable: false,
    }));
    const bandNodes: RFNode[] = (Object.keys(BAND_Y) as Band[]).map((band) => ({
      id: `band-${band}`,
      type: "bandLabel",
      position: { x: -110, y: BAND_Y[band] + NODE_H / 2 - 7 },
      data: { label: BAND_LABEL[band] } as BandLabelData,
      draggable: false,
      selectable: false,
      focusable: false,
    }));
    return [...bandNodes, ...layerNodes];
  }, [nodes, positions, lit, hover, showGapAnnotations]);

  const flowEdges: RFEdge[] = useMemo(() => {
    return edges.map((e, i) => {
      const key = `${e.from}->${e.to}`;
      const isLit = lit.active && lit.edges.has(key);
      const isDim = lit.active && !isLit;
      const stroke = isLit ? "var(--coral)" : "var(--navy)";
      const opacity = isDim ? (highlightKey ? 0.12 : 0.05) : isLit ? 0.9 : 0.22;
      const width = 1 + e.weight * 4;

      const src = nodes.find((n) => n.key === e.from);
      const tgt = nodes.find((n) => n.key === e.to);
      if (!src || !tgt) {
        return {
          id: `${i}-${key}`,
          source: e.from,
          target: e.to,
          type: "default",
        };
      }
      const srcRank = BAND_RANK[src.band];
      const tgtRank = BAND_RANK[tgt.band];

      let sourceHandle: string;
      let targetHandle: string;
      if (srcRank > tgtRank) {
        // source visually below, target visually above: exit top, enter bottom
        sourceHandle = "s-t";
        targetHandle = "t-b";
      } else if (srcRank < tgtRank) {
        sourceHandle = "s-b";
        targetHandle = "t-t";
      } else {
        const srcX = positions[e.from].x;
        const tgtX = positions[e.to].x;
        if (srcX < tgtX) {
          sourceHandle = "s-r";
          targetHandle = "t-l";
        } else {
          sourceHandle = "s-l";
          targetHandle = "t-r";
        }
      }

      // Bias label position along source→target so multi-band spans don't
      // land on top of intermediate band nodes. Same/adjacent bands: midpoint.
      // 2-band span: 30% from source. 3-band span: 22% from source.
      const rankDiff = Math.abs(srcRank - tgtRank);
      const labelOffset = rankDiff <= 1 ? 0.5 : rankDiff === 2 ? 0.30 : 0.22;
      // Same-band edges have source/target on the same Y, so the linear
      // midpoint lands on the band row. Lift the label above the row.
      const labelYShift = rankDiff === 0 ? -28 : 0;

      return {
        id: `${i}-${key}`,
        source: e.from,
        target: e.to,
        sourceHandle,
        targetHandle,
        type: "labeled",
        data: { label: e.label, labelOffset, labelYShift, dimmed: isDim } as LabeledEdgeData,
        style: { stroke, strokeWidth: width, opacity, transition: "opacity 140ms, stroke 140ms" },
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 14, height: 14 },
        interactionWidth: 18,
      } as RFEdge;
    });
  }, [edges, lit, highlightKey, positions, nodes]);

  const onNodeEnter: NodeMouseHandler = useCallback(
    (_e, n) => {
      if (n.type === "layer") setHover(n.id);
    },
    [setHover]
  );
  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, n) => {
      if (n.type === "layer") onNavigate(n.id);
    },
    [onNavigate]
  );

  // Clear hover only when the cursor leaves the whole graph container, not on
  // every node-to-node transition. Matches the old SVG's onMouseLeave feel and
  // keeps the lit-edges visible while moving between adjacent nodes.
  const onContainerLeave = useCallback(() => setHover(null), [setHover]);

  return (
    <div
      style={{ width: "100%", height, background: "var(--cream-light)" }}
      onMouseLeave={onContainerLeave}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeMouseEnter={onNodeEnter}
        onNodeClick={onNodeClick}
        onPaneClick={() => setHover(null)}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        panOnScroll={false}
        panOnDrag={false}
        preventScrolling={false}
        fitView
        fitViewOptions={{ padding: 0.06, maxZoom: 1, minZoom: 0.55 }}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={20} size={1} color="var(--cream-dark)" />
      </ReactFlow>
    </div>
  );
}
