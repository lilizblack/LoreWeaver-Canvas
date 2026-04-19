import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, addEdge, Connection } from 'reactflow';
import { useWorldStore } from './useWorldStore';

export type CanvasMode = 'main' | 'lore';

export interface LoreLink {
  id: string;
  sourceId: string;
  sourceCanvas: CanvasMode;
  targetId: string;
  targetCanvas: CanvasMode;
  relationType: string;
  createdAt: number;
}

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  canvasMode: CanvasMode;

  // Storage for the "other" canvas when not active
  mainNodes: Node[];
  mainEdges: Edge[];
  loreNodes: Node[];
  loreEdges: Edge[];

  // Cross-canvas semantic links (separate from visual ReactFlow edges)
  links: LoreLink[];
  threadEdges: Edge[];
  setThreadEdges: (edges: Edge[]) => void;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setLinks: (links: LoreLink[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedNodeId: (id: string | null) => void;
  updateNodeData: (id: string, data: any) => void;
  addNode: (node: Node) => void;
  hideThreads: boolean;
  setHideThreads: (hide: boolean) => void;
  hiddenTypes: string[];
  toggleHiddenType: (type: string) => void;
  setHiddenTypes: (types: string[]) => void;
  setCanvasMode: (mode: CanvasMode) => void;
  addLink: (link: LoreLink) => void;
  removeLink: (linkId: string) => void;
  deleteNode: (id: string) => void;
  updateNodeZIndex: (id: string, action: 'front' | 'back' | 'up' | 'down') => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  canvasMode: 'main',
  mainNodes: [],
  mainEdges: [],
  loreNodes: [],
  loreEdges: [],
  links: [],
  threadEdges: [],
  hideThreads: false,
  hiddenTypes: [],

  toggleHiddenType: (type) => set((state) => ({
    hiddenTypes: state.hiddenTypes.includes(type)
      ? state.hiddenTypes.filter(t => t !== type)
      : [...state.hiddenTypes, type],
  })),
  setHiddenTypes: (types) => set({ hiddenTypes: types }),

  setNodes: (nodes) => {
    const mode = get().canvasMode;
    set({
      nodes,
      ...(mode === 'main' ? { mainNodes: nodes } : { loreNodes: nodes })
    });
  },
  setEdges: (edges) => {
    const mode = get().canvasMode;
    set({
      edges,
      ...(mode === 'main' ? { mainEdges: edges } : { loreEdges: edges })
    });
  },
  setLinks: (links) => set({ links }),
  setThreadEdges: (edges) => set({ threadEdges: edges }),
  setHideThreads: (hide) => set({ hideThreads: hide }),

  setCanvasMode: (mode) => {
    const currentMode = get().canvasMode;
    if (currentMode === mode) return;

    // Shelf current state
    if (currentMode === 'main') {
      set({
        mainNodes: get().nodes,
        mainEdges: get().edges,
        canvasMode: mode,
        nodes: get().loreNodes,
        edges: get().loreEdges,
        selectedNodeId: null
      });
    } else {
      set({
        loreNodes: get().nodes,
        loreEdges: get().edges,
        canvasMode: mode,
        nodes: get().mainNodes,
        edges: get().mainEdges,
        selectedNodeId: null
      });
    }
  },

  onNodesChange: (changes) => {
    const newNodes = applyNodeChanges(changes, get().nodes);
    const mode = get().canvasMode;
    set({
      nodes: newNodes,
      ...(mode === 'main' ? { mainNodes: newNodes } : { loreNodes: newNodes })
    });
  },

  onEdgesChange: (changes) => {
    const { edges, threadEdges, canvasMode } = get();
    const newEdges = applyEdgeChanges(changes, edges);
    const newThreadEdges = applyEdgeChanges(changes, threadEdges);
    
    set({
      edges: newEdges,
      threadEdges: newThreadEdges,
      ...(canvasMode === 'main' ? { mainEdges: newEdges } : { loreEdges: newEdges })
    });
  },

  onConnect: (connection: Connection) => {
    const newEdges = addEdge(connection, get().edges);
    const mode = get().canvasMode;
    set({
      edges: newEdges,
      ...(mode === 'main' ? { mainEdges: newEdges } : { loreEdges: newEdges })
    });
  },

  setSelectedNodeId: (id) => {
    if (get().selectedNodeId === id) return;
    set({ selectedNodeId: id });
  },

  updateNodeData: (id, data) => {
    const mode = get().canvasMode;
    const updatedNodes = get().nodes.map((node) => {
      if (node.id === id) {
        const updatedNode = { ...node, data: { ...node.data, ...data } };

        // Write-through to the world library so chapters / notes / characters
        // survive even if the node is later deleted or the canvas goes blank.
        if (node.type === 'character' && node.data.characterId) {
          useWorldStore.getState().updateCharacter(node.data.characterId, data);
        }
        if (node.type === 'chapter') {
          useWorldStore.getState().upsertChapter(id, updatedNode.data);
        }
        if (node.type === 'note') {
          useWorldStore.getState().upsertNote(id, updatedNode.data);
        }
        if (node.type === 'place') {
          useWorldStore.getState().upsertPlace(id, updatedNode.data);
        }
        if (node.type === 'event') {
          useWorldStore.getState().upsertEvent(id, updatedNode.data);
        }
        if (node.type === 'concept') {
          useWorldStore.getState().upsertConcept(id, updatedNode.data);
        }
        if (node.type === 'item') {
          useWorldStore.getState().upsertItem(id, updatedNode.data);
        }

        return updatedNode;
      }
      return node;
    });
    set({
      nodes: updatedNodes,
      ...(mode === 'main' ? { mainNodes: updatedNodes } : { loreNodes: updatedNodes })
    });
  },

  addNode: (node) => {
    const mode = get().canvasMode;
    const sanitized = node.type === 'character'
      ? { ...node, style: { ...node.style } }
      : node;
    
    // Write-through to library immediately upon creation
    const { id, type, data } = sanitized;
    const ws = useWorldStore.getState();
    
    if (type === 'character') ws.updateCharacter(id, data);
    else if (type === 'chapter') ws.upsertChapter(id, data);
    else if (type === 'note')    ws.upsertNote(id, data);
    else if (type === 'place')   ws.upsertPlace(id, data);
    else if (type === 'event')   ws.upsertEvent(id, data);
    else if (type === 'concept') ws.upsertConcept(id, data);
    else if (type === 'item')    ws.upsertItem(id, data);

    const newNodes = [...get().nodes, sanitized];
    set({
      nodes: newNodes,
      ...(mode === 'main' ? { mainNodes: newNodes } : { loreNodes: newNodes })
    });
  },

  addLink: (link) => set((state) => ({ links: [...state.links, link] })),
  removeLink: (id) => set((state) => ({ links: state.links.filter(l => l.id !== id) })),

  updateNodeZIndex: (id, action) => {
    const state = get();
    const nodes = state.nodes;
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    const zValues = nodes.map(n => n.zIndex ?? 0);
    const currentZ = node.zIndex ?? 0;
    const maxZ = Math.max(...zValues);
    const minZ = Math.min(...zValues);

    let newZ: number;
    if      (action === 'front') newZ = maxZ + 1;
    else if (action === 'back')  newZ = minZ - 1;
    else if (action === 'up')    newZ = currentZ + 1;
    else                         newZ = currentZ - 1;

    const updatedNodes = nodes.map(n => n.id === id ? { ...n, zIndex: newZ } : n);
    const mode = state.canvasMode;
    set({
      nodes: updatedNodes,
      ...(mode === 'main' ? { mainNodes: updatedNodes } : { loreNodes: updatedNodes }),
    });
  },

  deleteNode: (id) => {
    const state = get();
    const node = [...state.mainNodes, ...state.loreNodes].find(n => n.id === id);

    // We no longer remove characters from the library when the node is deleted.
    // This allows records to be preserved in the Vault even if the canvas is cleared.
    // Chapter notes and generic notes are already preserved by existing logic.

    const filterNodes = (arr: Node[]) => arr.filter(n => n.id !== id);
    const filterEdges = (arr: Edge[]) => arr.filter(e => e.source !== id && e.target !== id);

    set({
      nodes:      filterNodes(state.nodes),
      edges:      filterEdges(state.edges),
      mainNodes:  filterNodes(state.mainNodes),
      mainEdges:  filterEdges(state.mainEdges),
      loreNodes:  filterNodes(state.loreNodes),
      loreEdges:  filterEdges(state.loreEdges),
      links:      state.links.filter(l => l.sourceId !== id && l.targetId !== id),
      selectedNodeId: null,
    });
  },

  importState: (state: any) => {
    const mode = get().canvasMode;
    set({
      mainNodes: state.mainNodes || [],
      mainEdges: state.mainEdges || [],
      loreNodes: state.loreNodes || [],
      loreEdges: state.loreEdges || [],
      links:     state.links || [],
      nodes:     mode === 'main' ? (state.mainNodes || []) : (state.loreNodes || []),
      edges:     mode === 'main' ? (state.mainEdges || []) : (state.loreEdges || []),
    });
  },

  reset: () => set({
    nodes: [],
    edges: [],
    mainNodes: [],
    mainEdges: [],
    loreNodes: [],
    loreEdges: [],
    links: [],
    selectedNodeId: null
  }),
}));
