# Spoons and Forks // Developer Agent Guide

This repository contains a hyper-minimalist, local-first Calorie & Macro Tracker packaged as a **Tauri 2 application** with a React (Vite + TypeScript + Tailwind) frontend. It runs on **Windows / macOS / Linux desktop** and **Android**.

---

## 🛠️ Key Developer Commands

- **Start Desktop Dev Environment (React + Tauri Window):**
  ```bash
  npm run tauri dev
  ```
- **Start Android Dev (requires Android SDK/NDK and a connected device or emulator):**
  ```bash
  npx tauri android dev
  ```
- **Check TypeScript Errors:**
  ```bash
  npx tsc --noEmit
  ```
- **Build Production Desktop App:**
  ```bash
  npm run build && npm run tauri build
  ```
- **Build Android APK / AAB:**
  ```bash
  npx tauri android build
  ```
- **Regenerate Tauri icons from source.png (run before any release):**
  ```bash
  npx tauri icon src-tauri/icons/source.png
  ```
- **Cut a release (bump version, build installers, push to git, optional gh release):**
  ```powershell
  .\release.ps1 -Version "0.2.0"
  ```

---

## ⚡ Critical Architecture Quirks (Do Not Miss)

### 1. The Dynamic Custom Theme Engine
- **No Hardcoded Dark Colors:** The app supports complete UI color customization (bg, card, font, accents) through Settings.
- **Rule:** Do NOT use hardcoded colors like `bg-zinc-950` on layout elements.
- **Instead, use CSS variables & Tailwind Custom classes:**
  - Backgrounds: `bg-[var(--bg)]`
  - Cards / Panels: `bg-[var(--card)]`
  - Font / Primary Text: `text-[var(--font)]` (applied at root)
  - Accent Text / Buttons: `text-[var(--accent)]` or `bg-[var(--accent)]`
- **Borders are static:** Use `border-zinc-800` for all borders. Do not introduce a new `--border` CSS variable; the design intentionally keeps borders fixed.
- **Curves & Rounding Aesthetic:** Main container cards use `rounded-3xl` (24px) and inner items/buttons/capsules use `rounded-2xl` or `rounded-full` (capsules). Do not make new layout panels flat or sharp unless explicitly requested.

### 2. Logical Day Cycles (Not Calendar Days)
- The app handles user-configured day start times (e.g., 5:00 AM) so late-night snack logging works properly.
- **Rule:** Never use vanilla calendar dates (`new Date().toDateString()`) to filter today's items.
- **Instead, use the logical day helper:**
  ```typescript
  import { getLogicalDayString } from '../lib/dayLogic';
  const todayString = getLogicalDayString(Date.now(), settings.dayStartHour);
  ```

### 3. Local-First SQLite Persistence (Tauri SQL Plugin)
- All app data is stored in a local SQLite file (`spoons-and-forks.db`) via `@tauri-apps/plugin-sql`.
- **Do NOT use `localStorage` for new data** — it caps at ~5–10MB and isn't shared across desktop/mobile.
- The DB layer lives in `src/lib/db.ts` with `getDb()`, `loadEntries`, `insertEntry`, `deleteEntryById`, `updateEntryById`, `loadSettings`, `saveSettings`.
- The hooks `useFoodLog` and `useSettings` are async; consumers must handle the `loading` state. `App.tsx` shows a full-screen `// initializing local store` placeholder until both are ready.
- **One-time migration:** `importFromLocalStorage()` runs on app start. If it finds legacy `nutrack-log` or `spoons-and-forks-settings` keys, it copies the data into SQLite and clears the keys. After this runs once, it has no effect.

### 4. Gemini AI Configuration
- **Model:** Currently hardcoded to `gemini-3.5-flash` using the stable `/v1/` endpoint.
- **Output Constraints:** We do **not** use `response_mime_type` (rejected by `/v1/` stable). Instead, we use explicit prompting in `src/lib/ai.ts` instructing the model to respond in raw JSON, and extract via regex: `/\{[\s\S]*?\}/`. Maintain this extraction pattern if you modify the API parsing logic.
- **Edibility guard:** The model is told to return `{ edible: false, ... }` for non-food queries. The hook short-circuits the call in that case.

### 5. Tauri 2 Configuration
- **Capabilities:** Tauri 2 requires explicit permission mapping. `src-tauri/capabilities/default.json` grants `core:default`, `sql:default`, and the `sql:allow-*` operations.
- **Icon Compilation Requirement:** Tauri validates icon existence during Rust compilation. `src-tauri/icons/icon.ico` must remain a valid multi-resolution Windows ICO. Regenerate from `source.png` (the canonical source) using `npx tauri icon`.
- **CSP (Content Security Policy):** `"csp": null` is used in `tauri.conf.json` to allow hot-reloads and frontend direct calls to Google Gemini API. Tighten before any production release.
- **Multi-platform config:** Tauri 2 picks up `tauri.android.conf.json` automatically when building for Android, which currently sets `app.android.minSdkVersion = 24`.

### 6. Mobile (Android) UI Adaptation
- The same React codebase runs on desktop and Android. Tailwind's `md:` (768px) breakpoint separates the two layouts.
- On **desktop (≥ md)**: standard vertical flow, hover interactions, input at the top inside `<main>`.
- On **mobile (< md)**: the `LogInput` is fixed to the bottom of the viewport (thumb zone) with a backdrop-blur, and `TodaysLog` rows use touch-friendly tap targets (44px+), always-visible pencil icons, and `p-2` delete buttons.
- **Rule:** Don't add `hover:`-only interactions without a touch fallback. Tap targets should be at least 44px on small screens.
- `pb-28 md:pb-0` on `<main>` reserves space for the sticky bottom input on mobile.

### 7. release.ps1 Quirks
- **Smart project root resolution:** The script starts at `$PSScriptRoot` and walks up looking for `package.json`, so it works when invoked from any directory.
- **PowerShell here-strings** (`@'...'@`) **cannot be passed directly as function arguments.** Always assign to a variable first (see how `$iconReplacement` is used).
- **Cargo.toml regex** requires `(?m)^` to anchor to start-of-line. PowerShell's `^` only matches start-of-input by default.
- **Icon regeneration** is step 2b — it always runs before `tauri build` so the source.png design is honored on every release.
