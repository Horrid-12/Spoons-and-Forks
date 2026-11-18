# Spoons and Forks

<p align="center">
  <img src="Icon.png" width="120" height="120" alt="Spoons and Forks Logo">
</p>

<h1 align="center">Spoons and Forks</h1>

<p align="center">Local-first calorie and macro tracking powered by Tauri 2, Groq, and Google Gemini</p>

<p align="center">
  <a href="https://github.com/Horrid-12/Spoons-and-Forks/releases/latest"><img alt="Latest Release" src="https://img.shields.io/github/v/release/Horrid-12/Spoons-and-Forks?style=flat-square&amp;logo=github&amp;logoColor=white"></a>
  <a href="https://opensource.org/licenses/MIT"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&amp;logo=opensourceinitiative&amp;logoColor=white"></a>
  <a href="https://tauri.app/"><img alt="Platforms: Windows, macOS, Linux, Android" src="https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android-4C1D95?style=flat-square&amp;logo=tauri&amp;logoColor=white"></a>
  <a href="https://v2.tauri.app/"><img alt="Tauri v2" src="https://img.shields.io/badge/Tauri-2.0-FFC131?style=flat-square&amp;logo=tauri&amp;logoColor=black"></a>
  <a href="https://supabase.com/"><img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?style=flat-square&amp;logo=supabase&amp;logoColor=black"></a>
  <a href="https://react.dev/"><img alt="React" src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&amp;logo=react&amp;logoColor=black"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&amp;logo=typescript&amp;logoColor=white"></a>
</p>

## Navigation

<a href="#features">Features</a> ·
<a href="#architecture">Architecture</a> ·
<a href="#preview">Preview</a> ·
<a href="#get-started">Get Started</a> ·
<a href="#installation">Installation</a> ·
<a href="#contributing">Contributing</a> ·
<a href="#security">Security</a> ·
<a href="#license">License</a>

[![Architecture diagram of Spoons and Forks](https://gitdiagram.com/horrid-12/spoons-and-forks/diagram.png)](https://gitdiagram.com/horrid-12/spoons-and-forks?utm_source=readme&utm_medium=picture)

## <img src="./docs/assets/icons/sparkles.svg" width="18" alt=""> Features

### <img src="./docs/assets/icons/brain.svg" width="16" alt=""> AI Logging

- Parse natural language meal descriptions into structured macros
- Validate edibility before logging entries
- Use Groq as the fast primary provider, with automatic Gemini fallback
- Choose from configurable Groq and Gemini models in Settings

### <img src="./docs/assets/icons/history.svg" width="16" alt=""> Statistics & Insights

- Dedicated analytics view with 7-day, 30-day, 90-day, and all-time filters
- Daily calorie chart with a target line, average intake, highest/lowest day, and target-hit rate
- Protein, carbohydrate, and fat trends, macro target completion, and macro distribution
- Activity heatmap, current/longest logging streaks, active days, and entries per day
- Most-logged descriptions, time-of-day distribution, and weekday versus weekend averages
- Averages count logged days only. Unlogged days and today's in-progress day are missing data, never zero-calorie days.

### <img src="./docs/assets/icons/palette.svg" width="16" alt=""> Custom Theming

- Customize app colors directly in settings
- Support for Material You (Monet) dynamic colors on Android 12+

### <img src="./docs/assets/icons/database.svg" width="16" alt=""> Local-First Storage

- SQLite backend via Tauri SQL plugin for offline access
- No account required; entries stay on your device
- Meal descriptions are sent only to your configured AI provider when you log an entry

### <img src="./docs/assets/icons/cloud.svg" width="16" alt=""> Sync and Cloud Backup

- Secure authentication and sync via Supabase
- Pull-then-push sync preserves deletion states

### <img src="./docs/assets/icons/devices.svg" width="16" alt=""> Cross-Platform

- Native desktop on Windows, macOS, and Linux via Tauri 2
- Android mobile app sharing the same codebase

## <img src="./docs/assets/icons/compass.svg" width="18" alt=""> Architecture

Spoons and Forks uses a modern Tauri 2 architecture with a React + TypeScript frontend and a Rust backend. For implementation details, see the [Architecture.md](Architecture.md) file if present, or review the source in src/ and src-tauri/.

| Layer | Stack |
|---|---|
| Frontend | <img alt="React" src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&amp;logo=react&amp;logoColor=black"> <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat-square&amp;logo=typescript&amp;logoColor=white"> <img alt="Vite" src="https://img.shields.io/badge/Vite-5.3.3-646CFF?style=flat-square&amp;logo=vite&amp;logoColor=white"> <img alt="TailwindCSS" src="https://img.shields.io/badge/TailwindCSS-3.4.4-06B6D4?style=flat-square&amp;logo=tailwindcss&amp;logoColor=white"> |
| Runtime | <img alt="Tauri" src="https://img.shields.io/badge/Tauri-2.0.0-FFC131?style=flat-square&amp;logo=tauri&amp;logoColor=black"> <img alt="Rust" src="https://img.shields.io/badge/Rust-1.92.0-000000?style=flat-square&amp;logo=rust&amp;logoColor=white"> |
| Database | <img alt="SQLite" src="https://img.shields.io/badge/SQLite-Tauri%20SQL%20Plugin-003B57?style=flat-square&amp;logo=sqlite&amp;logoColor=white"> |
| Backend Services | <img alt="Supabase" src="https://img.shields.io/badge/Supabase-2.108.0-3FCF8E?style=flat-square&amp;logo=supabase&amp;logoColor=black"> |
| AI | Groq API + Google Gemini (automatic failover) |

## <img src="./docs/assets/icons/play.svg" width="18" alt=""> Get Started

### Prerequisites

- Node.js (v18+)
- Rust & Cargo (v1.77.2+)
- Android SDK & NDK (for mobile compilation)

### Clone and Install

```bash
git clone https://github.com/Horrid-12/Spoons-and-Forks.git
cd spoons-and-forks
npm install
```

### Environment Configuration

Create .env from .env.example with the following variables:

| Variable | Required | Description |
|---|---|---|
| VITE_SUPABASE_URL | Yes | Supabase project URL |
| VITE_SUPABASE_KEY | Yes | Supabase anon/public key |

### AI Provider Setup

Meal parsing is configured inside the app under Settings:

- **Groq (recommended)** — create a free key at [console.groq.com/keys](https://console.groq.com/keys). The default model is Llama 3.1 8B Instant, with Llama 3.3 70B and GPT-OSS 120B available.
- **Gemini (fallback)** — add an `AIza...` key from [Google AI Studio](https://aistudio.google.com/apikey). It is used automatically when Groq is unavailable.
- Both keys can be stored at once. A provider's key is sent only to that provider.
- If you sign in to Supabase, both keys are included in the synced settings payload.

### Run Commands

- Run Desktop App (React + Tauri Window):
  ```bash
  npm run tauri dev
  ```
- Run Android Dev (Emulator/Device):
  ```bash
  npx tauri android dev
  ```
- Check TypeScript Errors:
  ```bash
  npx tsc --noEmit
  ```
- Build Desktop Installers:
  ```bash
  npm run build && npm run tauri build
  ```
- Build Android APK/AAB:
  ```bash
  npx tauri android build
  ```

<details>
<summary>Windows PowerShell</summary>

```powershell
# Clone
git clone https://github.com/Horrid-12/Spoons-and-Forks.git
cd spoons-and-forks
npm install

# Run desktop
npm run tauri dev

# Build
npm run build; npm run tauri build
```
</details>

## <img src="./docs/assets/icons/download.svg" width="18" alt=""> Installation

| Platform | Status | Notes |
|---|---|---|
| Windows | Available | Download from [Releases](https://github.com/Horrid-12/Spoons-and-Forks/releases) |
| macOS | Available | Download from [Releases](https://github.com/Horrid-12/Spoons-and-Forks/releases) |
| Linux | Available | Download from [Releases](https://github.com/Horrid-12/Spoons-and-Forks/releases) |
| Android | Available | Download APK from [Releases](https://github.com/Horrid-12/Spoons-and-Forks/releases) |

## <img src="./docs/assets/icons/users.svg" width="18" alt=""> Contributing

Contributions, issues, and feature requests are welcome. Please check the [issues page](https://github.com/Horrid-12/Spoons-and-Forks/issues).

## <img src="./docs/assets/icons/shield.svg" width="18" alt=""> Security

For security information and reporting guidelines, see [SECURITY.md](SECURITY.md).

## <img src="./docs/assets/icons/file-text.svg" width="18" alt=""> License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made by Howwid</p>

## <img src="./docs/assets/icons/image.svg" width="18" alt=""> Preview

<p align="center">
  <img src="Icon.png" width="700" alt="Spoons and Forks Application Logo">
  <br>
  <sub>Spoons and Forks application identity</sub>
</p>
