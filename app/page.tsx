"use client";

import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Wand2, Map, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      const onboarded = localStorage.getItem("lw-onboarded");
      router.push(onboarded ? "/dashboard" : "/onboarding");
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#fcfcfd] selection:bg-purple-500/30 overflow-y-auto">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-900/20 blur-[120px] rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-900/10 blur-[100px] rounded-full"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-200">For Fantasy & Dark Romance Authors</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-serif mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Weave Your World <br />
            <span className="italic font-light">With Magic</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            A persistent, spatial canvas where lore, characters, and storylines converge. 
            Track your arcs and world-building with an infinite workspace designed for grand sagas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={login}
              className="group relative px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              Get Started for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold transition-all backdrop-blur-sm">
              Watch Demo
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Infinite Canvas</h3>
              <p className="text-zinc-400 leading-relaxed">
                Connect plot points, lore notes, and images in a scalable spatial layout that grows with your epic.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6 text-amber-400 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Lore-Deep Characters</h3>
              <p className="text-zinc-400 leading-relaxed">
                Structured profiles for aliases, supernatural abilities, and faction allegiances tailored for fantasy logic.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <Wand2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Visual Relationships</h3>
              <p className="text-zinc-400 leading-relaxed">
                Draw lines between characters to track dynamic relationships, betrayals, and bloodlines.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
