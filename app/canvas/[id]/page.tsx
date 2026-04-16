"use client";

import { useAuth } from "@/hooks/useAuth";
import { Canvas } from "@/components/canvas/Canvas";
import { useRouter } from "next/navigation";
import { useEffect, use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function CanvasPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const [projectName, setProjectName] = useState<string>("Loading...");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user && projectId) {
      const fetchProject = async () => {
        try {
          const docRef = doc(db, "users", user.uid, "projects", projectId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().ownerId === user.uid) {
            setProjectName(docSnap.data().name);
            document.title = `${docSnap.data().name} | LoreWeaver`;
          } else {
            console.error("Project not found or unauthorized");
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Error fetching project:", error);
        }
      };
      fetchProject();
    }
  }, [user, authLoading, projectId, router]);

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0c] flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-purple-500 font-serif text-2xl"
        >
          Consulting the Lore...
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="h-screen w-full overflow-hidden relative">
      {/* Dynamic Header */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <Link 
          href="/dashboard"
          className="p-2 rounded-xl bg-zinc-900/50 backdrop-blur-md border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div className="px-5 py-2 rounded-xl bg-zinc-900/50 backdrop-blur-md border border-white/5">
          <h1 className="text-sm font-medium text-zinc-400 tracking-wider uppercase mb-0.5">Project</h1>
          <p className="text-white font-serif text-lg leading-none">{projectName}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="canvas"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full w-full"
        >
          <Canvas projectId={projectId} />
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
