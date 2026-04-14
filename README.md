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

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase Project

### Setup
1. Clone the repository:
   ```bash
   git clone [current-repo-url]
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env.local` file with your Firebase configuration:
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

## 🛠️ Deployment

This project is configured for **Firebase App Hosting**. 
- `apphosting.yaml` handles the server configuration.
- `firebase.json` defines hosting rules.

## 🤝 Collaboration

Currently collaborating with **[NikoCloud](https://github.com/NikoCloud)**.

---
*Created for dreamers and world-builders.*
