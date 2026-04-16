"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { User, Heart } from 'lucide-react';
import { useWorldStore } from '@/store/useWorldStore';
import { getRelationshipColor, getRoleColor } from '@/lib/relationshipTypes';

export const CharacterNode = memo(({ data, selected }: NodeProps) => {
  const [imgError, setImgError] = useState(false);
  const character = useWorldStore((state) =>
    data.characterId ? state.characters[data.characterId] : null
  );
  const allCharacters = useWorldStore((state) => state.characters);

  // Fallback to node data if store not found (e.g. legacy nodes)
  const name          = character?.name          ?? data.name          ?? 'Anonymous';
  const characterType = data.characterType       ?? 'Protagonist';
  const roleColor     = getRoleColor(characterType);
  const imageUrl      = character?.imageUrl      ?? data.imageUrl;
  const sex           = character?.sex           ?? data.sex;
  const relationships = character?.relationships ?? data.relationships ?? [];

  return (
    <div className="relative" style={{ width: 260 }}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-zinc-900"
        style={{ background: data.color || 'var(--accent)' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-3 !h-3 !border-2 !border-zinc-900"
        style={{ background: data.color || 'var(--accent)' }}
      />

      <div className={`rounded-2xl border-2 overflow-hidden transition-colors duration-300`}
        style={{
          borderColor: selected ? (data.color || 'var(--accent)') : 'var(--border)',
          backgroundColor: 'var(--card-bg)',
          boxShadow: selected ? `0 0 20px ${data.color || 'var(--accent)'}44` : 'var(--node-shadow)',
        }}
      >
        {/* Portrait */}
        <div style={{ height: 144, position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-2)' }}>
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={name}
              onError={() => setImgError(true)}
              style={{
                width: '100%', height: '100%',
                objectFit: data.imagePosition === 'fill' ? 'fill' : data.imagePosition === 'contain' ? 'contain' : 'cover',
                objectPosition: ['contain', 'fill'].includes(data.imagePosition) ? 'center' : (data.imagePosition || 'center'),
                display: 'block'
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              className="bg-gradient-to-br from-purple-900/10 to-transparent"
            >
              <User className="w-10 h-10 text-zinc-500 mb-1" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">No Portrait</span>
            </div>
          )}
          {/* Gradient + name overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--card-bg) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
            <h4 className="font-serif font-bold truncate" style={{ fontSize: (data.fontSize || 16) + 2, color: 'var(--fg)' }}>{name}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <p className="font-bold uppercase tracking-wider" style={{
                fontSize: (data.fontSize || 16) - 5,
                color: roleColor,
                background: roleColor + '22',
                border: `1px solid ${roleColor}55`,
                borderRadius: 4,
                padding: '1px 6px',
                display: 'inline-block',
              }}>{characterType}</p>
              {sex && (
                <span style={{
                  fontSize: (data.fontSize || 16) - 6,
                  color: 'var(--fg-3)',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '0px 5px',
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                }}>
                  {sex}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-2 border" style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}>
              <p style={{ fontSize: (data.fontSize || 16) - 8, color: 'var(--fg-3)' }} className="uppercase font-bold tracking-tighter mb-0.5">Age</p>
              <p className="truncate" style={{ fontSize: (data.fontSize || 16) - 4, color: 'var(--fg-2)' }}>{data.age || '—'}</p>
            </div>
            <div className="rounded-lg p-2 border" style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}>
              <p style={{ fontSize: (data.fontSize || 16) - 8, color: 'var(--fg-3)' }} className="uppercase font-bold tracking-tighter mb-0.5">Physical</p>
              <p className="truncate" style={{ fontSize: (data.fontSize || 16) - 4, color: 'var(--fg-2)' }}>{data.appearance || '—'}</p>
            </div>
          </div>

          {data.personality && (
            <div className="rounded-lg p-2 border" style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}>
              <p style={{ fontSize: (data.fontSize || 16) - 8, color: 'var(--fg-3)' }} className="uppercase font-bold tracking-tighter mb-0.5">Personality</p>
              <p className="line-clamp-2 leading-relaxed break-words" style={{ fontSize: (data.fontSize || 16) - 5, color: 'var(--fg-3)' }}>{data.personality}</p>
            </div>
          )}

          {/* Relationships */}
          {relationships.length > 0 && (
            <div className="rounded-lg p-2 border" style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}>
              <p style={{ fontSize: (data.fontSize || 16) - 8, color: 'var(--fg-3)' }} className="uppercase font-bold tracking-tighter mb-1.5 flex items-center gap-1">
                <Heart style={{ width: 8, height: 8, color: data.color || 'var(--accent)' }} />
                Relations
              </p>
              <div className="space-y-1">
                {relationships.slice(0, 3).map((rel: any) => {
                  const relChar = allCharacters[rel.characterId];
                  if (!relChar) return null;
                  const relColor = getRelationshipColor(rel.type);
                  return (
                    <div key={rel.characterId} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${relColor}` }}>
                        {relChar.imageUrl
                          ? <img src={relChar.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', background: relColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User style={{ width: 8, height: 8, color: relColor }} />
                            </div>
                        }
                      </div>
                      <span style={{ fontSize: (data.fontSize || 16) - 6, color: 'var(--fg-2)', fontWeight: 600 }} className="truncate flex-1">{relChar.name}</span>
                      <span style={{
                        fontSize: (data.fontSize || 16) - 8,
                        color: relColor,
                        background: relColor + '22',
                        padding: '1px 5px',
                        borderRadius: 3,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }} className="truncate">{rel.type}</span>
                    </div>
                  );
                })}
                {relationships.length > 3 && (
                  <p style={{ fontSize: (data.fontSize || 16) - 7, color: 'var(--fg-3)' }}>+{relationships.length - 3} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-3 !h-3 !border-2 !border-zinc-900"
        style={{ background: data.color || 'var(--accent)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-zinc-900"
        style={{ background: data.color || 'var(--accent)' }}
      />
    </div>
  );
});

CharacterNode.displayName = 'CharacterNode';
