"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  Sparkles, ArrowRight, Cloud, Settings2,
  CheckCircle2, Loader2, Eye, EyeOff, ExternalLink
} from "lucide-react";

type Path = "cloud" | "custom" | null;
type Step = "welcome" | "choose" | "configure" | "ready";

const ONBOARDING_KEY = "lw-onboarded";

const FIREBASE_FIELDS = [
  { key: "apiKey",            label: "API Key",             placeholder: "AIzaSy..." },
  { key: "authDomain",        label: "Auth Domain",          placeholder: "your-project.firebaseapp.com" },
  { key: "projectId",         label: "Project ID",           placeholder: "your-project-id" },
  { key: "storageBucket",     label: "Storage Bucket",       placeholder: "your-project.appspot.com" },
  { key: "messagingSenderId", label: "Messaging Sender ID",  placeholder: "123456789" },
  { key: "appId",             label: "App ID",               placeholder: "1:123456789:web:abc..." },
] as const;

type FirebaseConfig = Record<typeof FIREBASE_FIELDS[number]["key"], string>;

const emptyConfig: FirebaseConfig = {
  apiKey: "", authDomain: "", projectId: "",
  storageBucket: "", messagingSenderId: "", appId: "",
};

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep]       = useState<Step>("welcome");
  const [path, setPath]       = useState<Path>(null);
  const [config, setConfig]   = useState<FirebaseConfig>(emptyConfig);
  const [showKeys, setShowKeys] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // If already onboarded, skip straight to dashboard
  useEffect(() => {
    if (!loading && !user) { router.push("/"); return; }
    if (!loading && user) {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (done === "true") router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleCloudChoice = () => {
    setPath("cloud");
    setStep("configure"); // skips manual config — straight to "ready" confirm
  };

  const handleCustomChoice = () => {
    setPath("custom");
    setStep("configure");
  };

  const handleCloudConfirm = async () => {
    setSaving(true);
    // Mark onboarded — using LoreWeaver Cloud (our shared Firebase, data
    // is isolated by userId in Firestore, just like Notion/Figma)
    localStorage.setItem(ONBOARDING_KEY, "true");
    localStorage.removeItem("lw-custom-firebase"); // ensure no stale custom config
    await new Promise(r => setTimeout(r, 1200)); // brief loading moment
    setSaving(false);
    setStep("ready");
  };

  const handleCustomSave = async () => {
    setError(null);
    const missing = FIREBASE_FIELDS.find(f => !config[f.key].trim());
    if (missing) { setError(`Please fill in: ${missing.label}`); return; }

    setSaving(true);
    try {
      // Validate config by pinging Firestore with a test init
      const res = await fetch("/api/validate-firebase-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Invalid config");

      localStorage.setItem("lw-custom-firebase", JSON.stringify(config));
      localStorage.setItem(ONBOARDING_KEY, "true");
      setStep("ready");
    } catch (err: any) {
      setError(err.message || "Could not verify Firebase config. Double-check your keys.");
    } finally {
      setSaving(false);
    }
  };

  const finish = () => router.push("/dashboard");

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center px-4 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-purple-900/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-amber-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait">

          {/* ── WELCOME ─────────────────────────────────────── */}
          {step === "welcome" && (
            <motion.div key="welcome"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">Welcome to LoreWeaver</span>
              </div>
              <h1 className="text-5xl font-serif mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                Your World Awaits
              </h1>
              <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                Hi {user.displayName?.split(" ")[0] ?? "there"} — let's get your workspace ready.<br />
                It only takes a moment.
              </p>
              <button
                onClick={() => setStep("choose")}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* ── CHOOSE PATH ─────────────────────────────────── */}
          {step === "choose" && (
            <motion.div key="choose"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <div className="text-center mb-8">
                <p className="text-xs uppercase tracking-widest text-purple-400 mb-2">Step 1 of 2</p>
                <h2 className="text-3xl font-serif mb-3">One quick question</h2>
                <p className="text-zinc-400">Do you already have a Firebase or Firestore account?</p>
              </div>

              <div className="grid gap-4">
                {/* Custom Firebase option — shown FIRST to nudge Firebase users */}
                <button
                  onClick={handleCustomChoice}
                  className="group p-6 rounded-2xl bg-white/5 border border-amber-500/40 hover:border-amber-400/70 hover:bg-amber-500/5 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      <Settings2 className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">Yes — I already have Firebase</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">Preferred</span>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        If you already have a Firebase project with Firestore enabled, just paste your config keys. Takes 30 seconds — your data lives in <span className="text-zinc-300 font-medium">your own Google account</span>, completely under your control.
                      </p>
                      <p className="text-xs text-amber-400/80 mt-2">Your data · Your account · Zero dependency on us</p>
                    </div>
                  </div>
                </button>

                {/* Cloud option — fallback for non-Firebase users */}
                <button
                  onClick={handleCloudChoice}
                  className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-zinc-700/50 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      <Cloud className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">No — set it up for me</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Never used Firebase? No problem. We'll handle the setup automatically — nothing to install, nothing to configure. Just start writing. You can always switch to your own account later.
                      </p>
                      <p className="text-xs text-zinc-500 mt-2">No Firebase account needed · Fully automatic</p>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-center text-xs text-zinc-600 mt-5">
                Not sure? If you use Google Cloud, Firebase Console, or have set up Firestore before — choose the first option.
              </p>
            </motion.div>
          )}

          {/* ── CONFIGURE (Cloud confirm OR custom form) ────── */}
          {step === "configure" && path === "cloud" && (
            <motion.div key="configure-cloud"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
                <Cloud className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-xs uppercase tracking-widest text-purple-400 mb-2">Step 2 of 2</p>
              <h2 className="text-3xl font-serif mb-3">Ready to go</h2>
              <p className="text-zinc-400 mb-2 leading-relaxed">
                Your workspace will be created on LoreWeaver Cloud.
              </p>
              <p className="text-sm text-zinc-500 mb-8 leading-relaxed max-w-sm mx-auto">
                Your data is private, isolated to your account, and backed up automatically.
                You can always export a full JSON backup from within your canvas.
              </p>
              <button
                onClick={handleCloudConfirm}
                disabled={saving}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]"
              >
                {saving
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Setting up workspace…</>
                  : <><CheckCircle2 className="w-5 h-5" /> Confirm &amp; Continue</>}
              </button>
              <button
                onClick={() => setStep("choose")}
                className="block mx-auto mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {step === "configure" && path === "custom" && (
            <motion.div key="configure-custom"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <div className="text-center mb-6">
                <p className="text-xs uppercase tracking-widest text-purple-400 mb-2">Step 2 of 2</p>
                <h2 className="text-3xl font-serif mb-2">Your Firebase Config</h2>
                <p className="text-zinc-400 text-sm">
                  Paste your credentials from the{" "}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
                  >
                    Firebase Console <ExternalLink className="w-3 h-3" />
                  </a>
                  {" "}→ Project Settings → Your apps → Web app config.
                </p>
              </div>

              <div className="space-y-3 mb-4">
                {FIREBASE_FIELDS.map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">
                      {field.label}
                    </label>
                    <div className="relative">
                      <input
                        type={showKeys ? "text" : "password"}
                        value={config[field.key]}
                        onChange={e => setConfig(c => ({ ...c, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none text-sm text-white placeholder-zinc-600 transition-colors"
                        spellCheck={false}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowKeys(v => !v)}
                className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-5"
              >
                {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showKeys ? "Hide keys" : "Show keys"}
              </button>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleCustomSave}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 rounded-xl font-semibold transition-all"
              >
                {saving
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying…</>
                  : <><CheckCircle2 className="w-5 h-5" /> Save &amp; Continue</>}
              </button>
              <button
                onClick={() => setStep("choose")}
                className="block w-full text-center mt-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {/* ── READY ───────────────────────────────────────── */}
          {step === "ready" && (
            <motion.div key="ready"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </motion.div>
              <h2 className="text-4xl font-serif mb-3">You're all set!</h2>
              <p className="text-zinc-400 mb-2">
                Your workspace is ready, {user.displayName?.split(" ")[0] ?? "writer"}.
              </p>
              <p className="text-sm text-zinc-500 mb-10">
                Tip: Export a JSON backup from the canvas toolbar anytime to keep a local copy of your work.
              </p>
              <button
                onClick={finish}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
              >
                Open My Canvas
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
