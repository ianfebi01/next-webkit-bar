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

## The Two-Element Pattern Explained

Using the following code pattern (from `page.tsx` lines 8–13):

```tsx
{/* Line 8 — Controls the status bar tint */}
<nav className="fixed top-0 w-full h-24 z-[100] transition-colors duration-500 pointer-events-none border"></nav>

{/* Line 9 — Controls safe zone behavior */}
<div className="fixed inset-0 z-[80] transition-all duration-500 border pointer-events-none">
  <div className="absolute inset-0 bg-transparent transition-opacity duration-500" />
</div>
```

---

### Element 1: The Fixed `<nav>` (Line 8)

This element is the **tinting controller** for the status bar.

**Why it works:**
- `fixed top-0` — positions it at the very top edge (within 4px of top)
- `w-full` — 100% width (>= 80% width)
- `h-24` — 96px tall (>= 3px height)
- `pointer-events-none` — Safari still samples it

**Behavior:**

| State | Result |
|-------|--------|
| **No `background-color` set** (current state — only `border`) | Status bar becomes **transparent**. Content flows **behind** the status bar. The user sees content bleeding through the status bar area. |
| **`background-color` added** (e.g., `bg-white`) | Status bar is **tinted** with that color. Content stays **in the safe zone** below the status bar. The status bar is opaque with the specified color. |
| **Element removed entirely** | Safari falls back to `<body>` background. Content stays **in the safe zone** below the status bar. No transparency. |

### Element 2: The Fixed Fullscreen `<div>` (Line 9)

This element acts as a **safe zone enforcer**. Its child `<div>` with `bg-transparent` ensures that when the nav has no background, Safari still respects the safe area insets for regular content while the overlay provides a transparent layer for the status bar to sample.

---

## The Three Scenarios (Summary Table)

| Scenario | Line 8 (nav) | Line 9 (overlay) | Status Bar | Content Position |
|----------|-------------|-------------------|------------|-----------------|
| **Transparent header** | Present, **no background** | Present | Transparent | Behind status bar |
| **Colored header** | Present, **with background** | Present | Tinted to nav color | In safe zone (below status bar) |
| **Default** | Removed | Present | Falls back to body color | In safe zone (below status bar) |

---

## Key Takeaways

1. **`viewport-fit=cover` does not control tinting.** Don't rely on it for status bar color.
2. **A `fixed` element at the top with no background** is the trick to get a transparent status bar — Safari samples the transparent background and renders the status bar as clear.
3. **Adding a background to that same fixed element** instantly tints the status bar to match.
4. **`pointer-events: none` does not prevent Safari sampling.** You can use this to create invisible tinting controllers that don't interfere with user interaction.
5. **The fullscreen overlay (line 9)** works as a complementary mechanism — ensuring content behaves correctly in the safe zone when the tinting element has no background.
6. **Safari uses luma (perceived brightness)** of the sampled color to determine whether status bar text/icons should be dark or light.

---

## Practical Usage

To dynamically control the status bar tint:

```tsx
// Transparent status bar (content flows behind)
<nav className="fixed top-0 w-full h-6 pointer-events-none" />

// Tinted status bar (matches your brand color)
<nav className="fixed top-0 w-full h-6 bg-blue-600 pointer-events-none" />

// Toggle between states with state management
<nav className={`fixed top-0 w-full h-6 pointer-events-none transition-colors duration-500 ${isScrolled ? 'bg-white' : ''}`} />
```

> **Note:** The element only needs to be ≥ 3px tall to be sampled. You don't need a full-height nav — a thin 6px strip at the top is sufficient to control the entire status bar tint.

---

## References

- [Safari Color Tinting — Demo & Documentation](https://safari-color-tinting.pages.dev/)
- [GitHub: andesco/safari-color-tinting](https://github.com/andesco/safari-color-tinting)
- [Luma: Apple & Perceived Brightness](https://github.com/andesco/safari-color-tinting/blob/main/luma.md)
