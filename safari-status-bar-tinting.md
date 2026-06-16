# Safari 26 Status Bar Tinting — How It Actually Works

**Live Demo:** [next-webkit-bar.vercel.app](https://next-webkit-bar.vercel.app/)
**Repository:** [github.com/ianfebi01/next-webkit-bar](https://github.com/ianfebi01/next-webkit-bar)

## Background

Starting with Safari 26 (macOS & iOS), Apple **abandoned** the `<meta name="theme-color">` approach (used in Safari 15–18) and switched to automatically deriving browser UI colors from the `background-color` of standard page elements — specifically `<body>` or qualifying `position: fixed | sticky` elements.

> **Source:** [andesco/safari-color-tinting](https://github.com/andesco/safari-color-tinting)

---

## `viewport-fit=cover` Is Ignored for Tinting

Contrary to common belief, **`viewport-fit=cover` has NO effect on Safari 26's status bar tinting behavior**. The tinting is determined entirely by DOM element sampling, not by the viewport meta tag.

`viewport-fit=cover` is only needed for:
- Enabling `env(safe-area-inset-*)` CSS environment variables
- Bottom bar tinting in home-screen web apps (PWAs)

---

## How Safari 26 Samples Elements

Safari samples the `background-color` of elements that meet ALL of these criteria:

| Criteria | iOS | macOS |
|----------|-----|-------|
| Positioning | `fixed` or `sticky` | `fixed` or `sticky` |
| Distance from top | ≤ 4px from top | ≤ 4px from top |
| Width | ≥ 80% of viewport | ≥ 90% of viewport |
| Height | ≥ 3px | ≥ 3px |

### What Gets Sampled (Surprisingly)

- `visibility: hidden` — **still sampled**
- `pointer-events: none` — **still sampled**
- Elements partially off-screen (up to `bottom: -8px` with `min-height: 12px`)

### What Does NOT Get Sampled

- `display: none`
- `position: absolute` children inside fixed/sticky parents
- Pseudo-elements (`::before`, `::after`) on fixed/sticky elements
- `backdrop-filter` effects

---

## The Runtime Re-Sample Problem

Safari 26 has a **live observer** that watches for `background-color` changes on qualifying elements. However, the observer is inconsistent — some transitions are silently ignored:

| Transition | Detected? |
|------------|-----------|
| Color A → Color B | ✅ Usually |
| Color → `transparent` | ❌ Often missed |
| `transparent` → Color | ❌ Often missed |
| Property removed entirely (no `background-color`) | ❌ Never detected |

### The Fix: Meta Tag `+ "fe"` Dance

Even though Safari 26 ignores `<meta name="theme-color">` for the *source* of the tint, **changing the meta tag's `content` attribute still pokes Safari's internal observer** and forces a full re-sample of all DOM tinting sources (body + fixed elements).

The proven 3-step pattern:

```tsx
// Step 1: Set body background + meta to target immediately
document.body.style.backgroundColor = targetColor;
meta.setAttribute("content", targetColor);

// Step 2: Next frame — nudge meta with "+fe" suffix
requestAnimationFrame(() => {
  meta.setAttribute("content", targetColor + "fe");

  // Step 3: Frame after — restore clean value
  requestAnimationFrame(() => {
    meta.setAttribute("content", targetColor);
  });
});
```

The `+ "fe"` suffix creates a slightly different (invalid) color value that Safari's observer registers as a *change*, waking it up. The clean value is restored immediately after. This double-change is imperceptible to users but forces Safari to re-sample every qualifying element.

### Complete Hook Implementation

```tsx
function useSafariTintForce(targetColor: string) {
  const metaRef = useRef<HTMLMetaElement | null>(null);
  const prevRef = useRef(targetColor);

  // Ensure <meta name="theme-color"> exists in <head>
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = "";
      document.head.appendChild(meta);
    }
    metaRef.current = meta;
  }, []);

  useEffect(() => {
    const meta = metaRef.current;
    if (!meta) return;
    if (targetColor === prevRef.current) return;
    prevRef.current = targetColor;

    const color = targetColor || "transparent";
    const metaColor = targetColor || "#ffffff";

    document.body.style.backgroundColor = color;
    meta.setAttribute("content", metaColor);

    const r1 = requestAnimationFrame(() => {
      meta.setAttribute("content", metaColor + "fe");
      const r2 = requestAnimationFrame(() => {
        meta.setAttribute("content", metaColor);
      });
      return () => cancelAnimationFrame(r2);
    });
    return () => cancelAnimationFrame(r1);
  }, [targetColor]);
}
```

### What Does NOT Work

These approaches were tested and **failed** to trigger Safari's observer:

| Attempt | Why it failed |
|---------|---------------|
| Changing `el.style.backgroundColor` directly | Observer skips transparent ↔ color transitions |
| `rAF` flicker: `transparent → rgb(0,0,0,0.004) → transparent` | Near-identical values ignored |
| DOM unmount/remount via React `key` | Observer didn't re-trigger on re-insertion |
| Tailwind classes (`bg-blue-600` → `""`) | Removing the property entirely = no change detected |

---

## The Tinting Strip Pattern

You don't need your visible header to be the tinting source. A **thin, invisible strip** at the very top of the page can control the status bar independently:

```html
<!-- Invisible 4px strip — Safari samples THIS for status bar color -->
<div
  aria-hidden="true"
  style="position: fixed; top: 0; width: 100%; height: 4px;
         background-color: #2563eb; pointer-events: none; z-index: 200"
/>

<!-- Visible header — can be ANY color, independent of status bar -->
<header
  style="position: fixed; top: 0; width: 100%; height: 96px;
         background-color: #ffffff; z-index: 100"
>
  Your site header...
</header>
```

**Why 4px?** Safari's minimum height threshold is 3px. At 4px the strip is reliably sampled while being invisible to users.

### Architecture Diagram

```
┌── Tinting Strip (4px, z-200) ──┐  ← Safari samples THIS
├── Visible Header (h-24, z-100) ─┤  ← Users see THIS (any color)
│                                 │
│         Page Content            │  ← Body background (independent)
│                                 │
└─────────────────────────────────┘
```

This separation lets you:
- Set the status bar to `Red` while the header is `White`
- Make the status bar transparent while keeping a visible colored header
- Tint the status bar without any visible header at all

---

## The Two-Element Pattern (Safe Zone Control)

Using two fixed elements together:

```tsx
{/* Element 1 — Controls status bar tint */}
<header
  className="fixed top-0 w-full h-24 z-100 pointer-events-none"
  style={{ backgroundColor: statusColor }}
/>

{/* Element 2 — Safe zone enforcer overlay */}
<div className="fixed inset-0 z-80 pointer-events-none">
  <div className="absolute inset-0 bg-transparent" />
</div>
```

| Element | Purpose |
|---------|---------|
| Fixed `<header>` at top | Tinting controller — its `background-color` determines the status bar appearance |
| Fixed fullscreen `<div>` | Safe zone enforcer — ensures content respects safe-area insets |

### Behavior Matrix

| Status Bar Color | Overlay | Result |
|-----------------|---------|--------|
| `transparent` (no bg) | ON | **Transparent status bar** — content flows behind it |
| Any color (e.g. `#2563eb`) | ON | **Tinted status bar** — matches the color, content in safe zone |
| N/A (header removed) | ON | Falls back to `<body>` background, content in safe zone |
| Any | OFF | Falls back to `<body>` background |

---

## Inline Styles vs Tailwind Classes

**Always use inline styles** for the `background-color` that Safari samples. Tailwind classes are unreliable because:

```tsx
// ❌ BROKEN — Tailwind class interpolation
// When navBg = "", the background-color property is REMOVED entirely.
// Safari's observer sees no property → no change → no re-sample.
<nav className={`fixed top-0 … ${navBg}`} />

// ✅ WORKS — Inline style
// background-color is ALWAYS explicitly set, even when "transparent".
// Safari's observer sees every value change.
<nav style={{ backgroundColor: navBg || "transparent" }} />
```

---

## Key Takeaways

1. **`viewport-fit=cover` does not control tinting.** Don't rely on it for status bar color.
2. **Runtime re-sampling requires the meta tag `+ "fe"` dance.** Safari's live observer ignores many transitions unless poked via `<meta name="theme-color">` manipulation.
3. **Use inline styles, not Tailwind classes.** The `background-color` property must always be explicitly present for Safari to track changes.
4. **A 4px fixed strip at the top** can control the status bar independently of your visible header.
5. **`pointer-events: none` does not prevent Safari sampling.** Use it to create invisible tinting controllers.
6. **The fullscreen overlay** (fixed `inset-0` with transparent background) acts as a safe zone enforcer alongside the tinting controller.
7. **Safari uses luma (perceived brightness)** of the sampled color to determine whether status bar text/icons should be dark or light.

---

## Practical Usage

```tsx
// Transparent status bar (content flows behind)
<header style={{
  position: "fixed", top: 0, width: "100%", height: "4px",
  backgroundColor: "transparent", pointerEvents: "none"
}} />

// Tinted status bar
<header style={{
  position: "fixed", top: 0, width: "100%", height: "4px",
  backgroundColor: "#2563eb", pointerEvents: "none"
}} />

// With the re-sample hook
function MyPage() {
  const [color, setColor] = useState("#ffffff");
  useSafariTintForce(color);

  return (
    <header style={{
      position: "fixed", top: 0, width: "100%", height: "4px",
      backgroundColor: color, pointerEvents: "none"
    }} />
  );
}
```

---

## References

- [Safari Color Tinting — Demo & Documentation](https://safari-color-tinting.pages.dev/)
- [GitHub: andesco/safari-color-tinting](https://github.com/andesco/safari-color-tinting)
- [Luma: Apple & Perceived Brightness](https://github.com/andesco/safari-color-tinting/blob/main/luma.md)
- [Live Demo (this project)](https://next-webkit-bar.vercel.app/)
- [Repository](https://github.com/ianfebi01/next-webkit-bar)
