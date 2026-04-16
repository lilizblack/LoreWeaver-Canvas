import React from 'react';
import { getBezierPath, EdgeProps, EdgeLabelRenderer } from 'reactflow';
import { X } from 'lucide-react';
import { useCanvasStore } from '@/store/useCanvasStore';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
  label,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const removeEdge = () => {
    useCanvasStore.setState((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
      mainEdges: state.canvasMode === 'main' ? state.edges.filter((e) => e.id !== id) : state.mainEdges,
      loreEdges: state.canvasMode === 'lore' ? state.edges.filter((e) => e.id !== id) : state.loreEdges,
    }));
  };

  const edgeColor = (data as any)?.color || (style.stroke as string) || '#9ca3af';
  const isRelationshipEdge = (data as any)?.relationship;
  const edgeLabel = label || (data as any)?.label;

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: selected ? 3 : (isRelationshipEdge ? 2.5 : 2),
          stroke: selected ? '#a855f7' : edgeColor,
          strokeDasharray: isRelationshipEdge ? '0' : (style.strokeDasharray as any),
        }}
        className="react-flow__edge-path transition-colors duration-200"
        d={edgePath}
        markerEnd={markerEnd}
      />

      {/* Invisible thicker path to make edge easier to hover/click */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />

      <EdgeLabelRenderer>
        {/* Relationship label pill */}
        {edgeLabel && !selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: edgeColor,
              color: 'white',
              padding: '2px 8px',
              borderRadius: 999,
              boxShadow: `0 2px 8px ${edgeColor}66`,
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            {edgeLabel}
          </div>
        )}

        {selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            className="nodrag nopan"
          >
            {edgeLabel && (
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: edgeColor,
                color: 'white',
                padding: '2px 8px',
                borderRadius: 999,
                boxShadow: `0 2px 8px ${edgeColor}66`,
                whiteSpace: 'nowrap',
              }}>{edgeLabel}</span>
            )}
            {!isRelationshipEdge && (
              <button
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg border border-red-400 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEdge();
                }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
