"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Book, Plus, Settings, LogOut, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  updatedAt: any;
}

export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/");
      return;
    }

    // First-time users haven't completed onboarding yet
    const onboarded = localStorage.getItem("lw-onboarded");
    if (!onboarded) {
      router.push("/onboarding");
      return;
    }

    console.log("Setting up Firestore subscription for user:", user.uid);
    const q = query(
      collection(db, "projects"), 
      where("ownerId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      
      setProjects(projectsList);
      setProjectsLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setProjectsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, authLoading, router]);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !user) return;

    setIsCreating(true);
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name: newProjectName,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        nodes: [],
        edges: [],
        characters: []
      });
      setNewProjectName("");
      setIsNewProjectModalOpen(false);
      router.push(`/canvas/${docRef.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || projectsLoading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0c] flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-zinc-500 font-serif animate-pulse">Consulting the Lore...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 font-sans">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              LoreWeaver
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-zinc-200">{user?.displayName}</span>
              <span className="text-xs text-zinc-500">{user?.email}</span>
            </div>
            <button 
              onClick={() => logout()}
              className="p-2 hover:bg-white/5 rounded-full transition-colors group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-zinc-500 group-hover:text-red-400" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold mb-2">My Worlds</h1>
            <p className="text-zinc-500">Select a project to continue weaving your epic saga.</p>
          </div>
          <button 
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-5 h-5" />
            New Book
          </button>
        </header>

        {projects.length === 0 ? (
          <div className="border-2 border-dashed border-white/5 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 text-zinc-600">
              <Book className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-medium mb-2">No worlds created yet</h3>
            <p className="text-zinc-500 mb-8 max-w-sm">Every great story starts with a single note. Begin your next adventure by creating a new book canvas.</p>
            <button 
              onClick={() => setIsNewProjectModalOpen(true)}
              className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Start your first book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link 
                key={project.id} 
                href={`/canvas/${project.id}`}
                className="group relative bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:bg-zinc-800/50 transition-all hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10"
              >
                <div className="flex justify-between items-start mb-12">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Book className="text-purple-400 w-6 h-6" />
                  </div>
                  <Settings className="w-5 h-5 text-zinc-700 hover:text-zinc-400 cursor-pointer transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-1 truncate group-hover:text-purple-400 transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-zinc-500">
                  Last updated {project.updatedAt?.seconds 
                    ? new Date(project.updatedAt.seconds * 1000).toLocaleDateString() 
                    : "Recently"}
                </p>
                <div className="absolute inset-0 border-2 border-purple-500/0 group-hover:border-purple-500/20 rounded-2xl transition-all pointer-events-none" />
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      <AnimatePresence>
        {isNewProjectModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewProjectModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-serif font-bold mb-6">Create New World</h2>
              <form onSubmit={createProject}>
                <div className="mb-8">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Book Title</label>
                  <input 
                    type="text"
                    autoFocus
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. The Shadow Chronicles"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-zinc-700"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsNewProjectModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-white/5 hover:bg-white/5 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isCreating || !newProjectName.trim()}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                  >
                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create World"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
