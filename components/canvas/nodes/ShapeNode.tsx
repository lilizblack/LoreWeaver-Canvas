"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';

const SHAPES = {
  circle: ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <circle cx="50" cy="50" r="48" fill={color} />
    </svg>
  ),
  square: ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect x="2" y="2" width="96" height="96" rx="4" fill={color} />
    </svg>
  ),
  rectangle: ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect x="2" y="2" width="96" height="96" rx="4" fill={color} />
    </svg>
  ),
  diamond: ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="50,4 96,50 50,96 4,50" fill={color} />
    </svg>
  ),
  star: ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon
        points="50,6 61,35 93,35 68,57 77,88 50,70 23,88 32,57 7,35 39,35"
        fill={color}
      />
    </svg>
  ),
  arrow: ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="0,35 70,35 70,15 100,50 70,85 70,65 0,65" fill={color} />
    </svg>
  ),
  triangle: ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="50,5 97,95 3,95" fill={color} />
    </svg>
  ),
  hexagon: ({ color }: { color: string }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="50,5 93,27 93,73 50,95 7,73 7,27" fill={color} />
    </svg>
  ),
};

export type ShapeType = keyof typeof SHAPES;

export const ShapeNode = memo(({ data, selected }: NodeProps) => {
  const shape: ShapeType = data.shape || 'circle';
  const color: string = data.color || '#6d28d9';
  const opacity: number = data.opacity ?? 0.85;
  const label: string = data.label || '';
  const fontSize: number = data.fontSize || 14;
  const ShapeRenderer = SHAPES[shape] || SHAPES.circle;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <NodeResizer
        minWidth={40}
        minHeight={40}
        isVisible={selected}
        lineStyle={{ borderColor: color }}
        handleClassName="!w-3 !h-3 !rounded-full !border-2 !border-zinc-900"
        handleStyle={{ background: color }}
      />
      <Handle 
        type="target" 
        position={Position.Top}    
        className="!w-2 !h-2 !border-2 !border-zinc-900" 
        style={{ background: color }}
      />
      <Handle 
        type="target" 
        position={Position.Left}    
        id="left-target"
        className="!w-2 !h-2 !border-2 !border-zinc-900" 
        style={{ background: color }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right-source"
        className="!w-2 !h-2 !border-2 !border-zinc-900" 
        style={{ background: color }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-2 !h-2 !border-2 !border-zinc-900" 
        style={{ background: color }}
      />
      
      <div
        className="group w-full h-full relative"
        style={{ opacity, filter: selected ? `drop-shadow(0 0 15px ${color}66)` : 'none', transition: 'all 0.2s' }}
      >
        <ShapeRenderer color={color} />
        
        {label && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            pointerEvents: 'none'
          }}>
            <span style={{ 
              fontSize: fontSize, 
              color: 'white', 
              fontWeight: 800, 
              textAlign: 'center', 
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              wordBreak: 'break-word',
              maxWidth: '85%'
            }}>
              {label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

ShapeNode.displayName = 'ShapeNode';
