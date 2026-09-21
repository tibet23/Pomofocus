# Pomofocus

> An ultra-minimalist, distraction-free Pomodoro timer designed for deep work. Engineered with high-contrast monochrome themes, timestamp-accurate background drift protection, and an integrated task management workflow.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## Overview

**Pomofocus** strips away the visual clutter of traditional productivity tools in favor of mathematical typography, strict negative space, and high-contrast monochrome color schemes. It delivers a tactile, focused environment that keeps you locked into your flow state without battery-draining animations or intrusive notifications.

---

## Key Features

### ⏱️ Precision Pomodoro Engine
- **Classic 25-5-15 Interval Sequences**: Effortlessly switch between **Focus**, **Short Break**, and **Long Break** sessions.
- **Drift-Protected Background Timing**: Uses timestamp-delta calculations (`Date.now()`) rather than naive interval ticks, ensuring countdown accuracy even when browser tabs are throttled or placed into the background.
- **Cycle & Streak Tracking**: Visual round indicators keep track of completed focus sessions in each set.

### 🎨 High-Contrast Monochrome Themes
- **White on Black**: True OLED deep black canvas with high-contrast white typography.
- **White on Dark Gray**: Balanced charcoal theme providing subtle elevation and softer contrast.
- **Black on White**: Clean, bright paper-white layout for well-lit daytime work sessions.
- **Vector Brand Integration**: Custom SVG branding with automatic color synchronization across themes.

### 📝 Integrated Focus Queue
- Minimalist, in-place task manager to define and prioritize current goals.
- Inline task creation, completion toggles, and direct active-task targeting.
- Persistent local storage ensures zero data loss upon page refresh or browser restart.

### 🔔 Tactile Feedback & Audio Alerts
- Synthesized Web Audio API chimes (clean sine/bell harmonics) that require no external sound assets.
- Customizable alert volume and audio toggle.
- Optional browser push notifications for interval completions.

### ⌨️ Keyboard Shortcuts
- `Space`: Start Timer
- `M`: Toggle Audio Chime

---

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js 15 (App Router)** | Modern React framework for performant routing and server-side rendering |
| **React 19** | Component-driven UI state management and hooks |
| **TypeScript** | Strict type safety across application state and timer primitives |
| **Tailwind CSS v4** | Utility-first, zero-runtime styling engine |
| **Lucide React** | Clean, accessible vector icons |
| **Web Audio API** | Real-time browser audio synthesis for alerts and chimes |

---


## Project Structure

```
pomofocus/
├── app/
│   ├── favicon.ico
│   ├── globals.css         # Global Tailwind CSS configurations
│   ├── layout.tsx          # Root HTML layout, metadata, viewport settings
│   └── page.tsx            # Main Pomofocus timer application & components
├── public/
│   ├── pomofocus-logo.svg  # Custom vector logo
│   └── icon.svg            # Browser tab favicon
├── package.json            # Project manifest and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md
```

---

## Privacy & Offline First

Pomofocus is 100% client-side:
- **No telemetry or analytics tracking**
- **No external account requirements**
- **Offline capable**: All session data and settings stay securely inside your browser's local storage.

---

## License

Distributed under the MIT License. See `LICENSE` for more details.
