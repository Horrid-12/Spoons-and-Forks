# 🍴 Spoons and Forks

> A  local-first Calorie & Macro Tracker powered by Tauri 2 and Google Gemini AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Desktop-Windows%20%7C%20macOS%20%7C%20Linux-blueviolet)](https://tauri.app/)
[![Android](https://img.shields.io/badge/Mobile-Android-success)](https://developer.android.com/)
[![Built with React](https://img.shields.io/badge/Built%20with-React%20%2B%20TS-61dafb)](https://react.dev/)

---

<p align="center">
  <img src="Icon.png" width="120" height="120" alt="Spoons and Forks Icon" />
</p>

## ✨ Key Features

- **  AI Logging** – Just type *"2 large boiled eggs and a slice of buttered toast"* and let Google Gemini (3.5 Flash or 3.1 Flash Lite) extract the exact calories, protein, carbs, and fat instantly.
- **Custom Theming Support** – Complete UI color customization (background, cards, font, accent colors) directly in the app. Supports **Material You (Monet) dynamic colors on Android 12+**!
- ** Local-First, Offline-First** – Fully-featured SQLite backend via Tauri SQL Plugin. Zero latency, 100% private, and works flawlessly without an internet connection.
- ** Sync & Cloud Backup** – Secure, end-to-end cloud synchronization using Supabase auth and database. Safe pull-then-push sync cycle preserves deletion states across all your devices.
- **Multi-Platform** – Built with Tauri 2 to run as a native desktop application (Windows, macOS, Linux) and Android mobile app, sharing a unified, ultra-responsive codebase.


---

## 🛠️ Tech Stack & Architecture

Spoons and Forks is engineered with an ultra-modern tech stack designed for high performance and strict local data ownership:

- **Frontend:** React, TypeScript, Vite, Tailwind CSS (Lucide Icons, Shadcn utilities)
- **Runtime:** Tauri v2 (Desktop & Android)
- **Database:** Local SQLite (`spoons-and-forks.db`) via `@tauri-apps/plugin-sql`
- **Cloud Sync:** Supabase (Auth, Realtime synchronization, PostgreSQL storage)
- **AI Engine:** Google Gemini Developer API (using GA `/v1/` endpoint with strict JSON schema parsing)

---
## 🗡 Installation
- Download the Suitable Version for your Devices from the Releases page

## 🚀 Getting Started (Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://www.rust-lang.org/tools/install) (v1.75+)
- Android SDK & NDK (for mobile compilation)

### Setup
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/yourusername/spoons-and-forks.git
   cd spoons-and-forks
   npm install
   ```

2. Configure environment variables (copy `.env.example` to `.env`):
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_KEY=your-supabase-anon-key
   ```

### Execution Commands

- **Run Desktop App (React + Tauri Window):**
  ```bash
  npm run tauri dev
  ```
- **Run Android Dev (Emulator/Device):**
  ```bash
  npx tauri android dev
  ```
- **Check TypeScript Errors:**
  ```bash
  npx tsc --noEmit
  ```
- **Build Desktop Installers:**
  ```bash
  npm run build && npm run tauri build
  ```
- **Build Android APK/AAB:**
  ```bash
  npx tauri android build
  ```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/spoons-and-forks/issues).

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<p align="center">Made by Howwid with ♥</p>
