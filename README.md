# Safari 26 Status Bar Tinting — Next.js Demo

A Next.js demo app for testing and visualizing Safari 26's automatic browser UI tinting behavior.

## What This App Does

Safari 26 (macOS & iOS) **automatically derives** browser chrome colors — the status bar, toolbar — from the `background-color` of fixed or sticky elements positioned at the top of the page. This app provides an interactive testbed for that behavior, letting you toggle between transparent and tinted status bar states in real time.

Open the app in **Safari 26+ on iOS or macOS** to see the status bar change as you select different colors from the control panel.

## How It Works

Two zero-interaction elements sit above all content:

| Element | Role |
|---------|------|
| **Fixed `<nav>` at top** (`z-[100]`) | Tinting controller. No background → transparent status bar. Background color → tinted status bar matching that color. |
| **Fullscreen overlay `<div>`** (`z-[80]`) | Safe-zone enforcer. Ensures content respects safe-area insets when the nav has no background. |

Both use `pointer-events: none` so user interaction is unaffected, yet Safari still samples them.

### Safari 26 Sampling Criteria

For an element to be sampled for tinting, it must satisfy ALL of:

| Criteria | iOS | macOS |
|----------|-----|-------|
| Positioning | `fixed` or `sticky` | `fixed` or `sticky` |
| Distance from top | ≤ 4px | ≤ 4px |
| Width | ≥ 80% of viewport | ≥ 90% of viewport |
| Height | ≥ 3px | ≥ 3px |

### Key Insight

`viewport-fit=cover` has **no effect** on Safari 26's status bar tinting. The tinting is driven entirely by DOM element sampling, not by viewport meta tags.

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) 4
- [TypeScript](https://www.typescriptlang.org/) 5
- [pnpm](https://pnpm.io/) 10

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in **Safari 26+** to see the status bar tinting in action.

## How to Test

1. Open the app in Safari 26+ on iOS or macOS.
2. Use the bottom control panel to pick a nav background color.
3. Watch the status bar change — transparent when "None" is selected, tinted when a color is selected.
4. Toggle the overlay off to see the default fallback behavior (tinting falls back to `<body>` background).
5. Scroll the page — Safari re-samples the fixed element's background in real time, keeping the tint consistent.

## References

- [Safari Color Tinting — Demo & Documentation](https://safari-color-tinting.pages.dev/)
- [GitHub: andesco/safari-color-tinting](https://github.com/andesco/safari-color-tinting)
- [Luma: Apple & Perceived Brightness](https://github.com/andesco/safari-color-tinting/blob/main/luma.md)

## Project Structure

```
├── app/
│   ├── globals.css        # Tailwind CSS + CSS variables
│   ├── layout.tsx         # Root layout with Geist fonts
│   └── page.tsx           # Main page — tinting demo + controls
├── lib/
│   └── hooks/             # Custom React hooks (extendable)
├── public/                # Static assets (Next.js & Vercel logos)
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies & scripts
└── safari-status-bar-tinting.md  # Detailed technical write-up
```

