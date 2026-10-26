```markdown
# System Architecture & Technical Design

This document details the system design, frontend architecture, and edge networking topology for `pomofocus.live`. The project is built with Next.js 15, React 19, and Tailwind CSS v4, deployed behind Cloudflare's Edge network to achieve zero-latency client interactions and strict security boundaries.

---

## 1. Edge & Network Topology

The application utilizes an Edge-first architecture. Cloudflare terminates TLS, evaluates Web Application Firewall (WAF) policies, intercepts static requests via Edge Cache Rules, and negotiates HTTP/3 protocols before passing dynamic or cache-miss requests to the Next.js origin server.

```text
       +---------------------------------------------+
       |             End-User Devices                |
       |  (Mobile Safari / Chrome / Desktop Web)     |
       +---------------------------------------------+
                              |
                              | HTTPS (TLSv1.3 / HTTP/3 QUIC)
                              v
       +---------------------------------------------+
       |            Cloudflare Global Edge           |
       |---------------------------------------------|
       | 1. Canonical Redirect (www -> apex via 301) |
       | 2. Custom WAF Rules:                        |
       |    - Block Vulnerability Probes (wp-, .git) |
       |    - Drop Headless Scrapers (httpx, curl)   |
       | 3. Edge Cache Rules:                        |
       |    - Cache Next.js Static Chunks (1 Month)  |
       | 4. Early Hints (HTTP 103) Engine            |
       +---------------------------------------------+
                 |                           |
                 | (Cache Hit)               | (Dynamic Route /
                 | CF-Cache-Status: HIT      |  Static Miss)
                 v                           v
       +-------------------+       +-------------------------+
       | Instant Edge Fast |       |      Next.js Origin     |
       | Response (<35ms)  |       |  (Server-Side Rendering |
       +-------------------+       |   & App Router Assets)  |
                                   +-------------------------+

```

### Architectural Safeguards at the Edge

* **Origin Shielding:** Static bundles (`/_next/static/*`) are permanently held in edge memory, keeping origin CPU and memory usage negligible during peak traffic surges.
* **Malicious Reconnaissance Drop:** Path scanners and non-browser user agents are terminated at the nearest regional edge node, preventing origin thread exhaustion.

---

## 2. Component & Directory Architecture

The repository separates concerns across Next.js App Router conventions, adaptive layout hooks, and static configurations:

```text
├── app/                  # Next.js App Router (Layouts, routes, error boundaries)
│   ├── globals.css       # Core design tokens and Tailwind v4 base layers
│   ├── layout.tsx        # Root layout, HTML/body shell, global font injection
│   ├── manifest.ts       # Dynamic PWA manifest generation
│   └── page.tsx          # Main Pomodoro dashboard composition
├── hooks/                # Custom hooks isolating non-visual side effects
│   └── use-mobile.ts     # Adaptive breakpoint listener (max-width: 767px)
├── lib/                  # Pure utility functions and deterministic domain rules
├── public/               # Static assets exposed directly to the browser
│   ├── _headers          # Custom Cloudflare/CDN header definitions
│   ├── llms.txt          # AI agent context file
│   └── robots.txt        # Crawler directives
└── docs/                 # SRE, architecture, and infrastructure documentation

```

### Separation of Concerns

* **App Router (`app/`):** Focuses solely on layout structure, server metadata injection for SEO, and React 19 route boundaries.
* **Adaptive Interfaces (`hooks/`):** Uses `useIsMobile` via a `window.matchMedia` event listener to conditionally render desktop vs. mobile components without SSR hydration mismatches.
* **AI & Forms:** Leverages `@google/genai` for intelligence features and `@hookform/resolvers` for robust client-side validation.

---

## 3. Technology Stack

* **Framework:** Next.js 15 (App Router, React Server Components)
* **View Layer:** React 19
* **Language:** TypeScript
* **Styling & UI:** Tailwind CSS v4, Lucide React, Motion (Framer)
* **Edge & Security Layer:** Cloudflare Edge, WAF Rules, HTTP/3 (QUIC), 103 Early Hints

```
