# 📚 LoreWeaver: Canvas Workshop

LoreWeaver is a premium, professional-grade world-building workshop for novelists and storytellers. Built with **Next.js 15**, **React Flow**, and **Firebase**, it provides an interactive canvas to map out complex narratives, characters, and lore.

![Dashboard Preview](https://your-preview-link.com/preview.png)

## 🎨 Core Features

### 🌌 Universal Canvas
- **Dynamic Node System**: Map out your story using specialized templates:
  - **Characters**: Detailed profiles including portraits (Firebase Storage), physical appearance, personality traits, and character growth arcs.
  - **Chapter Notes**: Narrative-specific nodes for chapter summaries, world-building beats, and tracking unresolved plot threads.
  - **Notes (Lore Fragments)**: Quick-capture snippets for lore, world facts, and sudden inspiration.
- **Weaver's Threads**: Create visual connections between character nodes and story beats to visualize relationships and plot influence.
- **Thread Toggle**: Instantly hide/show connections to maintain a clean workspace layout.

### 📜 The Grimoire Panel
- A context-aware property editor that appears when a node is selected.
- Real-time cloud sync with **Firestore**.
- Native image upload support for character portraits and mood board assets.

### 🏗️ Technical Architecture
- **Framework**: Next.js 15 (App Router)
- **State Management**: Zustand (with optimized selectors for performance)
- **Canvas Engine**: React Flow
- **Styling**: Vanilla CSS + Tailwind (interspersed with bespoke Glassmorphism accents)
- **Backend**: Firebase (Auth, Firestore, Storage)

## 🗄️ Data Storage — Choose Your Setup

When you first sign in, LoreWeaver asks you one question: **do you already have a Firebase account?**

Your answer determines how your data is stored, and it matters.

---

### ✅ Option 1: Bring Your Own Firebase (Recommended if you have Firebase)

> **If you already use Firebase, Firestore, or Google Cloud — choose this.**

Paste your project's config keys and you're done in 30 seconds. Your characters, canvases, and worldbuilding data live entirely inside **your own Google account**. LoreWeaver is just the canvas — we never touch your data.

**Why this is better for you:**
- Your data is yours, full stop — no middleman
- Free forever on Firebase's generous free tier
- Works offline — changes sync automatically when you reconnect
- You can access your data directly from the Firebase Console
- Full export/import control from within the canvas toolbar

**How to get your config keys:**
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Open your project → **Project Settings** (gear icon)
3. Scroll to **Your apps** → select your Web app (or create one)
4. Copy the `firebaseConfig` object — paste each field into LoreWeaver's setup screen

---

### ☁️ Option 2: LoreWeaver Cloud (For writers new to Firebase)

> **If you've never used Firebase and don't want to — choose this.**

We handle the entire setup automatically. Nothing to install, nothing to configure, no accounts to create. Just sign in with Google and start writing.

Your data is stored securely, isolated to your account (no other user can see it), and you can export a full JSON backup at any time from the canvas toolbar.

**When this makes sense:**
- You've never heard of Firebase and don't want to learn it
- You want to try LoreWeaver before committing to any setup
- You're on a deadline and want to start immediately

> 💡 **You can always migrate later.** Export your project as JSON from the canvas, create a Firebase account, and re-import — your work moves with you.

---

## 🚀 Getting Started (Self-Hosting / Development)

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore enabled ([free tier](https://firebase.google.com/pricing) is more than enough)

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/lilizblack/LoreWeaver-Canvas.git
   cd LoreWeaver-Canvas
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

### Deploying Your Own Instance
The app deploys to Vercel with zero config — just connect your GitHub repo and add the Firebase env vars in your Vercel project settings.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Canvas | React Flow |
| State | Zustand |
| Database | Firebase Firestore (with IndexedDB offline cache) |
| Auth | Firebase Auth (Google Sign-In) |
| Storage | Firebase Storage (character portraits, media) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

## 🤝 Collaboration

Currently collaborating with **[NikoCloud](https://github.com/NikoCloud)**.

---
*Built for writers who think in worlds, not documents.*
