"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Sparkles, Gem, Terminal, Save, X, ShieldCheck,
  ExternalLink, ChevronRight, ChevronLeft, CheckCircle2,
  ClipboardPaste, Info, Rocket, Key, Copy, Check,
  AlertCircle, ArrowRightLeft, Loader2
} from 'lucide-react';
import { useUserStore, UserTier } from '@/store/useUserStore';
import { motion, AnimatePresence } from 'framer-motion';
import { db as masterDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { encryptConfig } from '@/lib/configCrypto';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

/**
 * SettingsModal - Manages User Tiers and BYOH Config.
 * RULE: Auth always on Master Firebase. Data routes to BYOH.
 * BYOH Config is ONLY saved locally (Zustand persist) for privacy.
 */

type ByohStep = 'ask' | 'manual' | 'guide-project' | 'guide-app' | 'guide-rules' | 'guide-finish';

const GUIDE_STEPS: { key: ByohStep; label: string }[] = [
  { key: 'guide-project', label: 'Create Project' },
  { key: 'guide-app',     label: 'Register App'  },
  { key: 'guide-rules',   label: 'Set Rules'     },
  { key: 'guide-finish',  label: 'Paste Config'  },
];

const REQUIRED_KEYS = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getByohDb(config: Record<string, any>) {
  const BYOH_NAME = 'byoh-migration-temp';
  try {
    const existing = getApps().find(a => a.name === BYOH_NAME);
    const app = existing ?? initializeApp(config, BYOH_NAME);
    return getFirestore(app);
  } catch {
    return getFirestore(getApp('byoh-migration-temp'));
  }
}

async function migrateDataToByoh(
  uid: string,
  projectId: string,
  byohConfig: Record<string, any>
): Promise<{ migrated: boolean; projectsMigrated: number; error?: string }> {
  try {
    const byohDb = await getByohDb(byohConfig);

    // Read all projects from Master
    const projectsRef = collection(masterDb, 'users', uid, 'projects');
    const projectSnaps = await getDocs(projectsRef);

    if (projectSnaps.empty) {
      return { migrated: true, projectsMigrated: 0 };
    }

    // Write each project to BYOH
    let count = 0;
    for (const snap of projectSnaps.docs) {
      const data = snap.data();
      const destRef = doc(byohDb, 'users', uid, 'projects', snap.id);
      // Only write if destination doesn't already have newer data
      const existing = await getDoc(destRef);
      if (!existing.exists() || (existing.data()?.updatedAt ?? 0) < (data.updatedAt ?? 0)) {
        await setDoc(destRef, data, { merge: true });
        count++;
      }
    }

    return { migrated: true, projectsMigrated: count };
  } catch (e: any) {
    console.error('[BYOH Migration] Error:', e);
    return { migrated: false, projectsMigrated: 0, error: e.message };
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SettingsModal() {
  const { user } = useAuth();
  const {
    tier, customFirebaseConfig, setTier, setCustomFirebaseConfig,
    isSettingsOpen, setSettingsOpen
  } = useUserStore();

  const [pendingTier, setPendingTier] = useState<UserTier>(tier);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);
  const [isSaving, setIsSaving]       = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ projectsMigrated: number } | null>(null);

  const [byohStep, setByohStep]     = useState<ByohStep>('ask');
  const [formConfig, setFormConfig] = useState(
    customFirebaseConfig ? JSON.stringify(customFirebaseConfig, null, 2) : ''
  );
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isSettingsOpen) {
      setPendingTier(tier);
      setError(null);
      setSuccess(false);
      setMigrationResult(null);
      setIsMigrating(false);
      setByohStep(customFirebaseConfig ? 'manual' : 'ask');
      setFormConfig(customFirebaseConfig ? JSON.stringify(customFirebaseConfig, null, 2) : '');
    }
  }, [isSettingsOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset BYOH step when user switches away from BYOH then back
  const handleTierChange = useCallback((newTier: UserTier) => {
    setPendingTier(newTier);
    setError(null);
    if (newTier === 'byoh') {
      setByohStep(customFirebaseConfig ? 'manual' : 'ask');
    }
  }, [customFirebaseConfig]);

  const handleSave = async () => {
    if (!user) return;
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      let finalConfig: Record<string, any> | null = null;

      if (pendingTier === 'byoh') {
        try {
          const parsed = JSON.parse(formConfig);
          for (const field of ['apiKey', 'projectId', 'appId']) {
            if (!parsed[field]) throw new Error(`Missing required field: "${field}"`);
          }
          finalConfig = parsed;
        } catch (e: any) {
          setError(e.message || 'Invalid JSON format for Firebase Config');
          setIsSaving(false);
          return;
        }

        // ── Migrate data from Master → BYOH ──────────────────────────────
        // Only migrate if the config is new or changed
        const prevConfigStr = customFirebaseConfig ? JSON.stringify(customFirebaseConfig) : '';
        const newConfigStr  = JSON.stringify(finalConfig);
        if (newConfigStr !== prevConfigStr) {
          setIsMigrating(true);
          // Get current projectId from URL if available
          const projectId = typeof window !== 'undefined'
            ? (window.location.pathname.split('/canvas/')?.[1] ?? 'default-project')
            : 'default-project';
          const result = await migrateDataToByoh(user.uid, projectId, finalConfig!);
          setIsMigrating(false);
          if (!result.migrated) {
            setError(`Migration warning: ${result.error ?? 'Could not copy data to your Firebase. Check your config.'}`);
            setIsSaving(false);
            return;
          }
          setMigrationResult({ projectsMigrated: result.projectsMigrated });
        }
      }

      // Save tier + encrypted BYOH config to Master Firestore
      // Using setDoc+merge so new user documents are created automatically
      const userDocRef = doc(masterDb, 'users', user.uid);
      const masterPayload: Record<string, any> = { tier: pendingTier, updatedAt: Date.now() };

      if (pendingTier === 'byoh' && finalConfig) {
        // Encrypt before persisting — raw keys never stored in plaintext
        masterPayload.encryptedByohConfig = await encryptConfig(finalConfig, user.uid);
      } else {
        // Clear any old encrypted config if user switches away from BYOH
        masterPayload.encryptedByohConfig = null;
      }

      await setDoc(userDocRef, masterPayload, { merge: true });

      // Commit to local store
      setTier(pendingTier);
      setCustomFirebaseConfig(finalConfig as any);

      setSuccess(true);
      setTimeout(() => {
        setTimeout(() => {
          setSuccess(false);
          setSettingsOpen(false);
        }, 900);
      }, 400);

    } catch (e: any) {
      console.error('Settings save error:', e);
      setError('Failed to update settings in Master Archive.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine if Save should be disabled
  const saveDisabled =
    isSaving ||
    isMigrating ||
    (pendingTier === 'byoh' && byohStep !== 'manual' && byohStep !== 'guide-finish');

  if (!user) return null;

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:scale-110 active:scale-95 hover:border-indigo-500/50 transition-all z-[90] group"
      >
        <Settings className="w-6 h-6 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
      </button>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[#0a0a0c] border border-white/10 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-br from-[#16161d] to-transparent shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <Settings className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold tracking-tight text-white italic">Sanctum Settings</h2>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mt-0.5">Configuration &amp; Hosting Tiers</p>
                  </div>
                </div>
                <button onClick={() => setSettingsOpen(false)} className="p-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="p-10 space-y-10 overflow-y-auto max-h-[65vh] custom-scrollbar">

                {/* Tier Selection */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400/80">Select Your Path</label>
                    <span className="text-[10px] text-zinc-600 font-serif italic">Login always via Lore Weaver Master</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <TierCard active={pendingTier === 'spark'} onClick={() => handleTierChange('spark')}
                      icon={<Sparkles className="w-5 h-5" />} title="Spark" color="zinc"
                      desc="Data lives in the Master Archive. Perfect for solo scribes."
                      subtext="Limited to 50 Characters & 100 Lore Items." />

                    <TierCard active={pendingTier === 'pro'} onClick={() => handleTierChange('pro')}
                      icon={<Gem className="w-5 h-5" />} title="Weaver Pro" color="emerald"
                      desc="Unlimited elements and high-definition assets. $5/mo."
                      subtext="Stored securely in the Master Archive." badge="Most Popular" />

                    <TierCard active={pendingTier === 'byoh'} onClick={() => handleTierChange('byoh')}
                      icon={<Terminal className="w-5 h-5" />} title="Bring Your Own Hosting" color="indigo"
                      desc="Direct routing to your personal Firebase instance."
                      subtext="Data remains completely private on your servers." />
                  </div>
                </div>

                {/* BYOH Wizard — inline, no AnimatePresence wrapping to avoid scroll issues */}
                {pendingTier === 'byoh' && (
                  <div className="pt-6 border-t border-white/5 space-y-6">
                    {byohStep === 'ask' && (
                      <ByohAsk
                        onHaveKeys={() => setByohStep('manual')}
                        onNeedGuide={() => setByohStep('guide-project')}
                      />
                    )}
                    {(byohStep === 'manual' || byohStep === 'guide-finish') && (
                      <ByohManual
                        formConfig={formConfig}
                        setFormConfig={setFormConfig}
                        error={error}
                        onBack={() => byohStep === 'guide-finish' ? setByohStep('guide-rules') : setByohStep('ask')}
                        isGuideFinish={byohStep === 'guide-finish'}
                        isMigrating={isMigrating}
                        migrationResult={migrationResult}
                      />
                    )}
                    {byohStep === 'guide-project' && (
                      <ByohGuideProject onNext={() => setByohStep('guide-app')} onBack={() => setByohStep('ask')} />
                    )}
                    {byohStep === 'guide-app' && (
                      <ByohGuideApp onNext={() => setByohStep('guide-rules')} onBack={() => setByohStep('guide-project')} />
                    )}
                    {byohStep === 'guide-rules' && (
                      <ByohGuideRules onNext={() => setByohStep('guide-finish')} onBack={() => setByohStep('guide-app')} copied={copied} onCopy={copyRules} />
                    )}
                  </div>
                )}

                {/* Top-level error (non-BYOH) */}
                {error && pendingTier !== 'byoh' && (
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-red-400 text-[11px] font-bold">{error}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-white/5 flex justify-end gap-4 bg-zinc-950/50 shrink-0">
                <button onClick={() => setSettingsOpen(false)}
                  className="px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveDisabled}
                  className={`
                    relative flex items-center gap-2 px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
                    ${success
                      ? 'bg-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.3)]'
                      : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95'}
                    ${saveDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                >
                  {isMigrating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Migrating Data...</>
                  ) : success ? (
                    <><ShieldCheck className="w-4 h-4" /> Sanctum Sealed</>
                  ) : (
                    <><Save className="w-4 h-4" /> Seal Settings</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── BYOH Sub-components ──────────────────────────────────────────────────────

function ByohAsk({ onHaveKeys, onNeedGuide }: { onHaveKeys: () => void; onNeedGuide: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400/80 mb-2">Firebase Setup Required</p>
        <p className="text-sm text-zinc-400 font-serif leading-relaxed">
          BYOH routes your data to your own free Firebase project.
          Do you already have your <span className="text-white font-bold">Firebase config keys</span> ready?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={onHaveKeys} className="flex flex-col gap-3 p-6 rounded-3xl border border-white/5 bg-white/[0.02] hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-300 text-left group">
          <div className="p-3 bg-black/40 border border-white/5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
            <Key className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Yes, I have my keys</h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed">Paste your Firebase config JSON and connect instantly.</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-auto">
            Connect Now <ChevronRight className="w-3 h-3" />
          </div>
        </button>

        <button onClick={onNeedGuide} className="flex flex-col gap-3 p-6 rounded-3xl border border-white/5 bg-white/[0.02] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-300 text-left group">
          <div className="p-3 bg-black/40 border border-white/5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
            <Rocket className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">No, guide me through it</h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed">Step-by-step setup of a free Firebase project — under 5 minutes.</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-black uppercase tracking-widest mt-auto">
            Start Setup <ChevronRight className="w-3 h-3" />
          </div>
        </button>
      </div>

      <div className="flex items-start gap-2 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
        <Info className="w-4 h-4 text-indigo-400/60 shrink-0 mt-0.5" />
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Your config stays <span className="text-zinc-400 font-bold">in your browser only</span>.
          Your existing project data will be <span className="text-zinc-400 font-bold">automatically copied</span> to your Firebase when you save.
        </p>
      </div>
    </div>
  );
}

function ByohManual({ formConfig, setFormConfig, error, onBack, isGuideFinish, isMigrating, migrationResult }: {
  formConfig: string;
  setFormConfig: (v: string) => void;
  error: string | null;
  onBack: () => void;
  isGuideFinish?: boolean;
  isMigrating?: boolean;
  migrationResult?: { projectsMigrated: number } | null;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 text-zinc-600 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400/80">
            {isGuideFinish ? 'Step 4 of 4 — Paste Your Config' : 'Firebase Config Object'}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Stored locally in your browser only.</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] text-zinc-500 font-bold">
          <ShieldCheck className="w-3 h-3 text-indigo-500/50" /> LOCAL ONLY
        </div>
      </div>

      {isGuideFinish && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-400 leading-relaxed">
            In Firebase Console → <span className="font-mono text-[10px] bg-black/30 px-1.5 py-0.5 rounded">Project Settings → Your apps → SDK setup → Config</span> — copy the <code className="font-mono">firebaseConfig</code> object and paste below.
          </p>
        </div>
      )}

      <div className="relative group">
        <textarea
          value={formConfig}
          onChange={(e) => setFormConfig(e.target.value)}
          placeholder={`{\n  "apiKey": "AIza...",\n  "authDomain": "your-project.firebaseapp.com",\n  "projectId": "your-project-id",\n  "storageBucket": "your-project.appspot.com",\n  "messagingSenderId": "123456789",\n  "appId": "1:123..."\n}`}
          className="w-full h-48 bg-black/40 border border-white/5 rounded-3xl p-6 text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-800 resize-none group-hover:border-white/10 shadow-inner"
        />
        <button
          onClick={() => navigator.clipboard.readText().then(t => setFormConfig(t))}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] text-zinc-500 hover:text-white transition-all"
        >
          <ClipboardPaste className="w-3 h-3" /> Paste
        </button>
      </div>

      <ConfigValidator config={formConfig} />

      {/* Migration status */}
      {isMigrating && (
        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
          <div>
            <p className="text-indigo-400 text-[11px] font-bold">Copying your data to your Firebase…</p>
            <p className="text-zinc-600 text-[10px]">This may take a moment for large projects.</p>
          </div>
        </div>
      )}
      {migrationResult && !isMigrating && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
          <ArrowRightLeft className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-emerald-400 text-[11px] font-bold">
            {migrationResult.projectsMigrated > 0
              ? `${migrationResult.projectsMigrated} project(s) copied to your Firebase!`
              : 'Connected. No existing projects to migrate.'}
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-400 text-[11px] font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}

function ConfigValidator({ config }: { config: string }) {
  let parsed: Record<string, any> | null = null;
  try { parsed = config.trim() ? JSON.parse(config) : null; } catch {}
  if (!parsed) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {REQUIRED_KEYS.map(k => {
        const ok = !!parsed![k];
        return (
          <span key={k} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${ok ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-red-500/30 bg-red-500/5 text-red-400'}`}>
            {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} {k}
          </span>
        );
      })}
    </div>
  );
}

// ─── Guide Steps ──────────────────────────────────────────────────────────────

function ByohGuideProject({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <GuideShell step={1} title="Create a Firebase Project" onNext={onNext} onBack={onBack} nextLabel="I created my project →">
      <GuideStepper steps={GUIDE_STEPS} current="guide-project" />
      <ol className="space-y-4 mt-4">
        <GuideStep n={1} text="Go to" link="https://console.firebase.google.com/" linkText="console.firebase.google.com" />
        <GuideStep n={2} text='Click "Add project" and enter a name (e.g. my-loreweaver-data).' />
        <GuideStep n={3} text='Disable Google Analytics if you prefer, then click "Create project".' />
        <GuideStep n={4} text="Wait for provisioning to finish, then click Continue." />
      </ol>
      <InfoBox text="The free Spark plan is sufficient. No credit card required." />
    </GuideShell>
  );
}

function ByohGuideApp({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <GuideShell step={2} title="Register a Web App &amp; Enable Firestore" onNext={onNext} onBack={onBack} nextLabel="Firestore is enabled →">
      <GuideStepper steps={GUIDE_STEPS} current="guide-app" />
      <ol className="space-y-4 mt-4">
        <GuideStep n={1} text="In your project dashboard, click the Web icon ( </> ) to add a web app." />
        <GuideStep n={2} text='Give it a nickname (e.g. "Lore Weaver") and click Register app. Skip Firebase Hosting.' />
        <GuideStep n={3} text='Click "Continue to console".' />
        <GuideStep n={4} text='In the sidebar go to Build → Firestore Database → Create database.' />
        <GuideStep n={5} text='Choose "Start in production mode" and pick the region closest to you, then click Enable.' />
      </ol>
      <InfoBox text="Production mode is fine — you will set the correct security rules in the next step." />
    </GuideShell>
  );
}

function ByohGuideRules({ onNext, onBack, copied, onCopy }: {
  onNext: () => void; onBack: () => void; copied: boolean; onCopy: () => void;
}) {
  return (
    <GuideShell step={3} title="Set Firestore Security Rules" onNext={onNext} onBack={onBack} nextLabel="Rules saved, continue →">
      <GuideStepper steps={GUIDE_STEPS} current="guide-rules" />
      <div className="space-y-4 mt-4">
        <p className="text-[12px] text-zinc-400 leading-relaxed">
          In Firestore, click the <span className="text-white font-bold">Rules</span> tab and replace everything with the rules below. This ensures only you can access your data.
        </p>
        <div className="relative">
          <pre className="bg-black/60 border border-white/5 rounded-2xl p-5 text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed whitespace-pre">{FIRESTORE_RULES}</pre>
          <button onClick={onCopy} className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] text-zinc-500 hover:text-white transition-all">
            {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">Click <span className="text-white font-bold">Publish</span> to apply, then proceed.</p>
      </div>
    </GuideShell>
  );
}

// ─── Shared Guide UI ──────────────────────────────────────────────────────────

function GuideShell({ step, title, children, onNext, onBack, nextLabel }: {
  step: number; title: string; children: React.ReactNode;
  onNext: () => void; onBack: () => void; nextLabel: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 text-zinc-600 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Step {step} of 4</p>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400/80" dangerouslySetInnerHTML={{ __html: title }} />
        </div>
      </div>
      {children}
      <button onClick={onNext} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all">
        {nextLabel} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function GuideStepper({ steps, current }: { steps: { key: string; label: string }[]; current: string }) {
  const idx = steps.findIndex(s => s.key === current);
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all
            ${i === idx ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400' : i < idx ? 'text-emerald-500' : 'text-zinc-700'}`}>
            {i < idx ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : null}{s.label}
          </div>
          {i < steps.length - 1 && <div className={`h-px flex-1 mx-1 ${i < idx ? 'bg-emerald-500/30' : 'bg-white/5'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function GuideStep({ n, text, link, linkText }: { n: number; text: string; link?: string; linkText?: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[9px] font-black text-indigo-400">{n}</span>
      <span className="text-[12px] text-zinc-400 leading-relaxed">
        {text}{' '}
        {link && (
          <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-400 hover:text-white transition-colors font-bold">
            {linkText} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </span>
    </li>
  );
}

function InfoBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
      <Info className="w-3.5 h-3.5 text-indigo-400/60 shrink-0 mt-0.5" />
      <p className="text-[10px] text-zinc-600 leading-relaxed">{text}</p>
    </div>
  );
}

// ─── TierCard ─────────────────────────────────────────────────────────────────

function TierCard({ active, onClick, icon, title, desc, subtext, color, badge }: {
  active: boolean; onClick: () => void; icon: React.ReactNode;
  title: string; desc: string; subtext: string; color: string; badge?: string;
}) {
  const colorMap = {
    zinc:    { border: active ? 'border-zinc-500/40'    : 'border-white/5', bg: active ? 'bg-zinc-500/5'    : 'bg-white/[0.02]', icon: active ? 'text-zinc-300'    : 'text-zinc-500', glow: active ? 'shadow-[0_0_30px_rgba(113,113,122,0.1)]' : '' },
    emerald: { border: active ? 'border-emerald-500/40' : 'border-white/5', bg: active ? 'bg-emerald-500/5' : 'bg-white/[0.02]', icon: active ? 'text-emerald-400' : 'text-zinc-500', glow: active ? 'shadow-[0_0_30px_rgba(16,185,129,0.1)]'    : '' },
    indigo:  { border: active ? 'border-indigo-500/40'  : 'border-white/5', bg: active ? 'bg-indigo-500/5'  : 'bg-white/[0.02]', icon: active ? 'text-indigo-400'  : 'text-zinc-500', glow: active ? 'shadow-[0_0_30px_rgba(99,102,241,0.1)]'    : '' },
  }[color as 'zinc' | 'emerald' | 'indigo'];

  return (
    <button onClick={onClick} className={`relative w-full p-6 flex flex-col items-start gap-4 rounded-3xl border transition-all duration-500 text-left group ${colorMap.border} ${colorMap.bg} ${colorMap.glow}`}>
      <div className="flex w-full items-start justify-between">
        <div className={`p-3 rounded-2xl transition-all duration-700 ${colorMap.icon} bg-black/40 border border-white/5 group-hover:scale-110 group-hover:rotate-3`}>{icon}</div>
        {active && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white">Active Path</span>
          </div>
        )}
        {!active && badge && (
          <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/10">{badge}</span>
        )}
      </div>
      <div className="space-y-1">
        <h3 className={`text-base font-serif font-bold tracking-tight transition-colors ${active ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'} text-left`}>{title}</h3>
        <p className={`text-[11px] leading-relaxed transition-colors ${active ? 'text-zinc-400' : 'text-zinc-500 group-hover:text-zinc-400'} text-left`}>{desc}</p>
        <p className={`text-[10px] mt-2 font-black uppercase tracking-[0.1em] opacity-60 ${active ? 'text-white/40' : 'text-zinc-700'} text-left`}>{subtext}</p>
      </div>
      {active && <motion.div layoutId="tier-glow" className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />}
    </button>
  );
}
