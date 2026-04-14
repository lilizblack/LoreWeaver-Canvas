import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, addEdge, Connection } from 'reactflow';

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedNodeId: (id: string | null) => void;
  updateNodeData: (id: string, data: any) => void;
  addNode: (node: Node) => void;
  hideThreads: boolean;
  setHideThreads: (hide: boolean) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  hideThreads: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setHideThreads: (hide) => set({ hideThreads: hide }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  setSelectedNodeId: (id) => {
    if (get().selectedNodeId === id) return;
    set({ selectedNodeId: id });
  },

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  },

  addNode: (node) => set({ nodes: [...get().nodes, node] }),
}));
