import React, { useState, useCallback, useEffect } from 'react';
import { getBezierPath, EdgeProps, EdgeLabelRenderer, useReactFlow } from 'reactflow';
import { X, GripVertical } from 'lucide-react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useWorldStore } from '@/store/useWorldStore';

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
  const [isDragging, setIsDragging] = useState(false);
  const flow = useReactFlow();
  
  const controlPoint = (data as any)?.controlPoint as { x: number, y: number } | undefined;

  // Calculate default path and midpoint
  const [defaultPath, defaultLX, defaultLY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // If we have a control point, we use a Quadratic Bezier path instead of the default Cubic one
  // to make the single-point dragging feel intuitive.
  const midpointX = (sourceX + targetX) / 2;
  const midpointY = (sourceY + targetY) / 2;
  
  const cx = defaultLX + (controlPoint?.x || 0);
  const cy = defaultLY + (controlPoint?.y || 0);
  
  // Custom path using Quadratic Bezier through the control point
  const edgePath = controlPoint 
    ? `M ${sourceX},${sourceY} Q ${cx},${cy} ${targetX},${targetY}`
    : defaultPath;

  const removeEdge = () => {
    useCanvasStore.setState((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
      mainEdges: state.canvasMode === 'main' ? state.edges.filter((e) => e.id !== id) : state.mainEdges,
      loreEdges: state.canvasMode === 'lore' ? state.edges.filter((e) => e.id !== id) : state.loreEdges,
    }));
  };

  const updateControlPoint = useCallback((offset: { x: number, y: number }) => {
    if ((data as any)?.type === 'thread') {
      const { characterId, threadIndex } = data;
      const char = useWorldStore.getState().characters[characterId];
      if (char?.threads?.[threadIndex]) {
        const newThreads = [...char.threads];
        newThreads[threadIndex] = { ...newThreads[threadIndex], controlPoint: offset };
        useWorldStore.getState().updateCharacter(characterId, { threads: newThreads });
      }
    } else {
      // Normal edge
      const currentEdges = useCanvasStore.getState().edges;
      useCanvasStore.getState().setEdges(
        currentEdges.map(e => e.id === id ? { ...e, data: { ...(e.data || {}), controlPoint: offset } } : e)
      );
    }
  }, [data, id]);

  // Handle Dragging
  const onHandleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      // Convert screen coords to flow coords
      const pos = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newOffset = {
        x: pos.x - defaultLX,
        y: pos.y - defaultLY
      };
      updateControlPoint(newOffset);
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, flow, midpointX, midpointY, updateControlPoint]);

  const edgeColor = (data as any)?.color || (style.stroke as string) || '#9ca3af';
  const isRelationshipEdge = (data as any)?.type === 'thread' || (data as any)?.relationship;
  const edgeLabel = label || (data as any)?.label;

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: selected ? 4 : (isRelationshipEdge ? 3 : 2),
          stroke: selected ? '#a855f7' : edgeColor,
          strokeDasharray: isRelationshipEdge ? '0' : (style.strokeDasharray as any),
          transition: isDragging ? 'none' : 'stroke 0.2s, stroke-width 0.2s',
          opacity: selected ? 1 : 0.7,
        }}
        fill="none"
        className="react-flow__edge-path transition-all hover:opacity-100 hover:stroke-zinc-300"
        d={edgePath}
        markerEnd={markerEnd}
      />

      {/* Interaction path - much wider to make selection easy */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={30}
        className="react-flow__edge-interaction cursor-pointer"
      />

      <EdgeLabelRenderer>
        {/* Drag Handle - Only when selected */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${cx}px,${cy}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan z-50"
          >
            <div 
              onMouseDown={onHandleMouseDown}
              className={`w-8 h-8 rounded-full border-2 bg-zinc-950 flex items-center justify-center cursor-move shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-110 ${isDragging ? 'border-purple-500 bg-purple-950/20' : 'border-purple-500/50 hover:border-purple-400 hover:scale-105'}`}
            >
              <GripVertical className="w-4 h-4 text-purple-400" />
            </div>
            
            {/* Action buttons (Delete) anchored to handle */}
            {!isDragging && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
                 {!isRelationshipEdge && (
                    <button
                      className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-2 shadow-lg border border-red-500/30 transition-all cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEdge();
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                 )}
                 {controlPoint && (
                   <button
                    title="Reset curve"
                    className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-full p-1.5 shadow-lg border border-zinc-600 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateControlPoint({ x: 0, y: 0 });
                    }}
                   >
                     <div className="w-3 h-3 flex items-center justify-center text-[8px] font-bold">R</div>
                   </button>
                 )}
              </div>
            )}
          </div>
        )}

        {/* Relationship label pill - positioned at the control point */}
        {edgeLabel && !isDragging && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${cx}px,${selected ? cy - 20 : cy}px)`,
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
              zIndex: 40
            }}
            className="nodrag nopan"
          >
            {edgeLabel}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
