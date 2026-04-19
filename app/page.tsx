"use client";

import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';
import { 
  Shield, 
  ChevronRight, 
  Library, 
  Link2, 
  GitBranch, 
  Layers, 
  Gem, 
  Server, 
  Sparkles,
  ArrowRight,
  Database,
  Users,
  Feather,
  ScrollText,
  Map,
  Compass
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// --- Animation Variants ---
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: "easeInOut" }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } }
};

const floatAnimation = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// --- Custom Components ---
const FeatureCard = ({ iconPath: Icon, title, description, badge, imageUrl }: { iconPath: any, title: string, description: string, badge?: string, imageUrl?: string }) => (
  <motion.div 
    variants={fadeInUp}
    className="relative p-8 rounded-[32px] bg-[var(--bg-2)] border border-white/[0.03] hover:border-[var(--primary)]/30 transition-all duration-500 group overflow-hidden flex flex-col h-full"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative z-10 flex flex-col h-full">
      {imageUrl && (
        <div className="mb-8 aspect-video rounded-2xl overflow-hidden border border-white/[0.05] bg-black/40">
           <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={title} />
        </div>
      )}
      <div className="mb-6 h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-[var(--primary)]/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
        <Icon className="w-7 h-7 text-[var(--primary)]" />
      </div>
      {badge && <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] mb-4 block">{badge}</span>}
      <h3 className="text-xl font-serif font-bold mb-4 text-white group-hover:text-purple-200 transition-colors">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed group-hover:text-zinc-400 transition-colors font-medium flex-1">
        {description}
      </p>
    </div>
  </motion.div>
);

export default function LandingPage() {
  const { user, loginWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Automatic redirect removed to allow authenticated users to view landing page

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e7eb] font-sans selection:bg-purple-900/40 overflow-x-hidden">
      {/* Texture Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_-20%,_#1e1b4b_0%,_transparent_50%)] opacity-30" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_0%_0%,_#4c1d9520_0%,_transparent_40%)]" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_100%_100%,_#4c1d9510_0%,_transparent_40%)]" />

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-4 bg-[#050505]/90 backdrop-blur-xl border-b border-white/[0.05]' : 'py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group cursor-pointer">
            <BrandLogo className="w-9 h-9" />
            <span className="text-2xl font-serif font-bold tracking-tight text-white hidden sm:block">Loreweaver</span>
          </Link>
          
          <div className="flex items-center gap-4 md:gap-10">
            <div className="hidden lg:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
               <a href="#canvas" className="hover:text-white transition-colors">The Canvas</a>
               <a href="#grimoire" className="hover:text-white transition-colors">The Grimoire</a>
               <a href="#tiers" className="hover:text-white transition-colors">Sovereignty</a>
               {user && <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 transition-colors">Dashboard</Link>}
             </div>
            
            {user ? (
              <Link 
                href="/dashboard"
                className="px-8 py-3 rounded-full bg-purple-600/20 border border-purple-500/30 text-[11px] font-black uppercase tracking-[0.1em] text-white hover:bg-purple-600/30 hover:border-purple-500/50 transition-all shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <button 
                onClick={loginWithGoogle}
                className="px-8 py-3 rounded-full bg-white/[0.03] border border-white/[0.08] text-[11px] font-black uppercase tracking-[0.1em] text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all"
              >
                Enter the Realm
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-purple-900/10 blur-[200px] rounded-full animate-pulse" />
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-indigo-900/10 blur-[180px] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.03] border border-white/[0.05] mb-12 backdrop-blur-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
              The Sovereign standard for world-building
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-9xl font-serif mb-10 leading-[0.9] text-white tracking-tight"
          >
            Weave your Worlds <br />
            <span className="italic font-light text-zinc-500/80">with magic.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-16 leading-relaxed font-medium"
          >
            A visual ecosystem crafted for chroniclers of grand epics. Organize infinite lore, 
            map character legacies, and connect the threads of your saga in one immersive workspace.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8"
          >
            <button
              onClick={loginWithGoogle}
              className="group relative px-12 py-6 bg-[#4C1D95] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(76,29,149,0.4)]"
            >
              <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="flex items-center gap-4">
                Begin the Work
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <div className="flex items-center gap-4">
               <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-[#050505] bg-zinc-900 flex items-center justify-center shadow-lg">
                      <Feather className="w-4 h-4 text-zinc-600" />
                    </div>
                  ))}
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                 Chosen by 2,000+ Chroniclers
               </span>
            </div>
          </motion.div>
        </div>

        {/* Hero Visual */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 60 }}
          transition={{ duration: 1.5, delay: 0.8 }}
          className="w-full max-w-6xl mt-20 relative px-4"
        >
          <div className="aspect-[16/9] md:aspect-[21/9] rounded-[48px] bg-[#0d0d0f] border border-white/[0.05] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent z-10 opacity-60" />
            <img 
              src="/images/branding-main.png" 
              alt="Loreweaver Dashboard Workspace" 
              className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-[2000ms]"
            />
          </div>
        </motion.div>
      </section>

      {/* Feature Grid Section */}
      <section id="canvas" className="py-40 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            {...fadeInUp}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-6xl font-serif mb-8 text-white tracking-tight">Tools for the Master Work.</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-lg font-medium">
              We've distilled the complexity of world-building into a fluid, visual experience. 
              Move beyond static documents and see your world from 30,000 feet.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <FeatureCard 
              iconPath={Map}
              title="The Lore Canvas"
              description="A spatial canvas to drop character cards, place markers, and plot notes. Architect your chronology in a truly visual database."
              badge="Visual Database"
              imageUrl="/images/feat-canvas.png"
            />
            <FeatureCard 
              iconPath={Link2}
              title="Intelligent Linking"
              description="Never lose a detail. Use '@' to instantly link terms, items, or locations across your chapters. Lore Weaver tracks every mention automatically."
              badge="Smart @ Mentions"
              imageUrl="/images/feat-linking.png"
            />
            <FeatureCard 
              iconPath={GitBranch}
              title="Relationship Threads"
              description="Visualize the heart of your story. Draw lines between character cards and color-code them by relationship type (Ally, Enemy, Rival)."
              badge="Color-Coded Heritage"
              imageUrl="/images/feat-linking.png" /* Swapped mapping the web of fate image to the one in every mention accounted for */
            />
            <FeatureCard 
              iconPath={Layers}
              title="Dual-View System"
              description="Switch instantly between your Main Canvas (Chapters) and your Lore Canvas (The Encyclopedia) to keep your writing flow uninterrupted."
              badge="Unbroken Flow"
              imageUrl="/images/feat-dualview.png"
            />
          </motion.div>
        </div>
      </section>

      {/* Narrative Section */}
      <section id="grimoire" className="py-40 px-6 bg-white/[0.01] border-y border-white/[0.03]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-24">
          <motion.div 
            {...fadeInUp}
            className="flex-1"
          >
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-px bg-purple-500/40" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Character Architecture</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-serif mb-10 text-white leading-[0.95] tracking-tight">Create the fate of your character.</h2>
            <p className="text-xl text-zinc-400 leading-relaxed mb-12 font-medium">
              Don't just write a biography—weave a life. From complex relationship webs to deep-lore integration that tracks every mention, Lore Weaver ensures your cast is as interconnected as the world they inhabit.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Feather, label: "Appearance Tracking" },
                { icon: Users, label: "Social Hierarchy" },
                { icon: ScrollText, label: "Chronicled Mentions" },
                { icon: Compass, label: "Physical Traits" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group p-1">
                   <item.icon className="w-5 h-5 text-[#4C1D95] group-hover:scale-110 transition-transform" />
                   <span className="text-xs font-black uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="flex-1 relative"
          >
             <div className="relative aspect-square max-w-lg mx-auto group">
                <div className="absolute inset-0 bg-purple-600/5 blur-[180px] rounded-full animate-pulse" />
                <div className="relative z-10 w-full h-full rounded-[60px] border border-white/[0.05] bg-[#0d0d0f] flex items-center justify-center overflow-hidden shadow-2xl">
                   <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent z-10" />
                   <img 
                     src="/images/narrative-arch.png" 
                     alt="Loreweaver Character Architecture" 
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                   />
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="tiers" className="py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            {...fadeInUp}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-6xl font-serif mb-8 text-white tracking-tight">Access the Vault.</h2>
            <p className="text-zinc-500 text-lg font-medium">Choose a path that scales with the depth of your mythology. Your Lore, Your Sovereignty.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Spark Tier */}
            <motion.div 
              variants={fadeInUp}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
              className="p-12 rounded-[40px] bg-[#0d0d0f] border border-white/[0.03] flex flex-col group relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-zinc-800" />
              <div className="flex items-center gap-4 mb-10">
                 <div className="p-3 rounded-2xl bg-zinc-900 border border-white/[0.05]">
                    <Sparkles className="w-6 h-6 text-zinc-400" />
                 </div>
                 <div>
                    <h3 className="text-xl font-serif font-bold text-white">Spark</h3>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">The Apprentice</p>
                 </div>
              </div>
              <div className="mb-10 text-center">
                <span className="text-5xl font-serif text-white uppercase italic">Free</span>
              </div>
              <ul className="space-y-6 mb-12 flex-1">
                {[
                  "30 Characters",
                  "100 Lore Elements",
                  "2 Active Projects",
                  "Standard Vault Access"
                ].map(item => (
                  <li key={item} className="text-xs text-zinc-500 flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={loginWithGoogle}
                className="w-full py-5 rounded-2xl bg-zinc-900 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all border border-white/[0.05]"
              >
                Join the Circle
              </button>
            </motion.div>

            {/* Pro Tier */}
            <motion.div 
              variants={fadeInUp}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
              className="p-12 rounded-[40px] bg-white text-[#050505] flex flex-col relative shadow-[0_40px_100px_rgba(76,29,149,0.3)] z-10"
            >
              <div className="absolute top-0 right-0 p-6">
                 <div className="px-4 py-1.5 rounded-full bg-purple-600 text-white text-[9px] font-black uppercase tracking-[0.3em]">Imperial</div>
              </div>
              <div className="flex items-center gap-4 mb-10">
                 <div className="p-3 rounded-2xl bg-purple-50">
                    <Gem className="w-6 h-6 text-purple-600" />
                 </div>
                 <div>
                    <h3 className="text-xl font-serif font-bold">Weaver Pro</h3>
                    <p className="text-[10px] text-purple-600/60 font-black uppercase tracking-widest">The Master</p>
                 </div>
              </div>
              <div className="mb-10 text-center flex items-baseline justify-center gap-1">
                <span className="text-6xl font-serif font-bold">$5</span>
                <span className="text-sm font-black text-zinc-400 uppercase tracking-widest">/Monthly</span>
              </div>
              <ul className="space-y-6 mb-12 flex-1">
                {[
                  "Unlimited Lore Elements",
                  "Unlimited Projects",
                  "Advanced Thread Exports",
                  "Persistence in the Vault",
                  "Deep Relationship Logic"
                ].map(item => (
                  <li key={item} className="text-xs text-zinc-900 flex items-center gap-3">
                    <Shield className="w-3.5 h-3.5 text-purple-600 fill-purple-600/10" />
                    <span className="font-bold">{item}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={loginWithGoogle}
                className="w-full py-5 rounded-2xl bg-purple-600 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-purple-700 transition-all shadow-xl"
              >
                Ascend to Pro
              </button>
            </motion.div>

            {/* Archivist Tier */}
            <motion.div 
              variants={fadeInUp}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
              className="p-12 rounded-[40px] bg-[#0d0d0f] border border-white/[0.03] flex flex-col group relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-zinc-800" />
              <div className="flex items-center gap-4 mb-10">
                 <div className="p-3 rounded-2xl bg-zinc-900 border border-white/[0.05]">
                    <Server className="w-6 h-6 text-zinc-400" />
                 </div>
                 <div>
                    <h3 className="text-xl font-serif font-bold text-white">Archivist</h3>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">The Sovereign</p>
                 </div>
              </div>
              <div className="mb-10 text-center">
                <span className="text-5xl font-serif text-white uppercase italic">BYOH</span>
              </div>
              <ul className="space-y-6 mb-12 flex-1">
                {[
                  "Connect Your Own Firebase",
                  "100% Data Sovereignty",
                  "Absolute Privacy Controls",
                  "Custom Instance Logic",
                  "Unlimited Forever"
                ].map(item => (
                  <li key={item} className="text-xs text-zinc-500 flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => router.push('/dashboard?setup=byoh')}
                className="w-full py-5 rounded-2xl border border-white/[0.08] text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/[0.03] transition-all"
              >
                Secure Your Instance
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Persistence Callout */}
      <section className="py-20 px-6">
        <motion.div 
          {...fadeInUp}
          className="max-w-5xl mx-auto p-16 md:p-24 rounded-[60px] bg-gradient-to-br from-[var(--bg-2)] to-[var(--bg)] border border-white/[0.03] relative text-center overflow-hidden"
        >
           <div className="absolute inset-0 bg-purple-900/5 blur-[100px] rounded-full pointer-events-none" />
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 opacity-40">
              <img src="/images/persistence-vault.png" className="w-full h-full object-cover object-top" alt="Vault Security" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-2)]" />
           </div>
           <div className="relative z-10 pt-40">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] w-fit mx-auto mb-12">
                 <Database className="w-10 h-10 text-[var(--primary)]" />
              </div>
              <h2 className="text-4xl md:text-6xl font-serif mb-10 text-white tracking-tight leading-tight">Data Sovereignty is <br /> the new standard.</h2>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-16 font-medium">
                We believe your legends belong only to you. Loreweaver offers a unique Bring Your Own Hosting (BYOH) option. Connect your personal Firebase instance to keep 100% ownership, or rely on our secure, encrypted vaults.
              </p>
              <button 
                onClick={loginWithGoogle}
                className="px-14 py-6 bg-white text-[#050505] rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all shadow-2xl"
              >
                Ready to Weave your World?
              </button>
           </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-32 border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-16">
          <Link href="/" className="flex items-center gap-2 pr-2 group/logo hover:opacity-80 transition-opacity">
            <BrandLogo className="w-8 h-8" />
            <div className="w-px h-4 bg-white/10 mx-1" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none group-hover/logo:text-zinc-300 transition-colors">Loreweaver</span>
          </Link>
          
          <div className="flex flex-col items-center md:items-end gap-6">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">
              © 2026 Loreweaver. Build the Epic.
            </p>
            <div className="flex gap-8 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Sanctum</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
