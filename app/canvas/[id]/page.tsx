"use client";

import { useAuth } from "@/hooks/useAuth";
import { Canvas } from "@/components/canvas/Canvas";
import { useRouter } from "next/navigation";
import { useEffect, use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { BrandLogo } from "@/components/BrandLogo";

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
      <div className="h-screen w-full bg-[#0a0a0c] flex items-center justify-center text-center px-10">
        <div className="flex flex-col items-center gap-8">
          <BrandLogo className="w-20 h-20" withGlow />
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-zinc-500 font-serif text-2xl tracking-widest uppercase"
          >
            Consulting the Lore...
          </motion.div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="h-screen w-full overflow-hidden relative">

      <AnimatePresence mode="wait">
        <motion.div
          key="canvas"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full w-full"
        >
          <Canvas projectId={projectId} projectName={projectName} />
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
