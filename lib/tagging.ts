import { useCanvasStore } from '@/store/useCanvasStore';

/**
 * Parses text for "@Name" mentions and automatically creates LoreLinks
 * to matching elements in the Lore Canvas.
 */
export function processMentions(sourceId: string, text: string) {
  if (!text || !text.includes('@')) return;

  const { loreNodes, links, addLink } = useCanvasStore.getState();
  
  // Sort lore nodes by name length (descending) to match longest names first 
  // (e.g., "@King Arthur" before "@King")
  const sortedLore = [...loreNodes].sort((a, b) => {
    const nameA = (a.data?.name || a.data?.title || a.data?.label || '');
    const nameB = (b.data?.name || b.data?.title || b.data?.label || '');
    return nameB.length - nameA.length;
  });

  const lowercaseText = text.toLowerCase();

  sortedLore.forEach(targetNode => {
    const name = (targetNode.data?.name || targetNode.data?.title || targetNode.data?.label || '').toLowerCase();
    if (!name) return;

    const mentionKey = `@${name}`;
    
    // Check if the text contains @name
    if (lowercaseText.includes(mentionKey)) {
      // Check if link already exists
      const exists = links.some(l => 
        l.sourceId === sourceId && 
        l.targetId === targetNode.id && 
        l.relationType === 'mention'
      );

      if (!exists) {
        addLink({
          id: `mention-${sourceId}-${targetNode.id}-${Date.now()}`,
          sourceId,
          sourceCanvas: 'main',
          targetId: targetNode.id,
          targetCanvas: 'lore',
          relationType: 'mention',
          createdAt: Date.now()
        });
        console.log(`[Tagging] Auto-linked ${sourceId} to ${targetNode.id} via @mention: "${mentionKey}"`);
      }
    }
  });
}
