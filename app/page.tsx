"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// CSS color values (not Tailwind classes) — inline styles for Safari's observer.
const COLORS = [
  { label: "None", value: "" },
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Blue", value: "#2563eb" },
  { label: "Red", value: "#ef4444" },
  { label: "Green", value: "#10b981" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Amber", value: "#d97706" },
  { label: "Pink", value: "#ec4899" },
] as const;

const cssColor = (v: string) => v || "transparent";
const isTint = (v: string) => v !== "" && v !== "transparent";

/**
 * Force Safari 26 to re-sample tinting.
 *
 * Proven pattern from andesco/safari-color-tinting research:
 * 1. Set body bg + meta to target
 * 2. Next frame: nudge meta with "+fe" suffix
 * 3. Frame after: restore clean value
 *
 * This 3-step dance pokes Safari's internal observer.
 */
function useSafariTintForce(targetColor: string) {
  const metaRef = useRef<HTMLMetaElement | null>(null);
  const prevRef = useRef(targetColor);

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

    const color = cssColor(targetColor);
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

export default function Home() {
  const [statusColor, setStatusColor] = useState("");
  const [bodyColor, setBodyColor] = useState("");
  const [overlayVisible, setOverlayVisible] = useState(true);

  // Meta-tag dance for Safari re-sampling, driven by status bar color.
  useSafariTintForce(statusColor);

  // Apply body background independently.
  useEffect(() => {
    document.body.style.backgroundColor = cssColor(bodyColor);
  }, [bodyColor]);

  const scenario = !overlayVisible
    ? "No overlay — fallback to <body>"
    : isTint(statusColor)
      ? `Status bar tinted (${statusColor || "color"})`
      : "Status bar transparent";

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* ---- Tinting Strip ---- */}
      {/* Safari 26 height thresholds (empirically tested):        */}
      {/*   4px  — tints initially, but fades to shadow on scroll   */}
      {/*   5px+ — tints persist on scroll, but won't auto-switch   */}
      {/*          colors without the meta-tag "+fe" dance           */}
      {/*  11px+ — fully reliable: scroll-safe, instant switching,  */}
      {/*          independent of body bg. ✓                         */}
      {/*                                                           */}
      {/* ⚠ Body bg interaction: with overlay ON and body bg set,   */}
      {/*   the URL bar (navbar) follows body bg. Must toggle       */}
      {/*   overlay OFF→ON to sync navbar to body bg change.       */}
      {/* ⚠ Transparent navbar (content visible behind):            */}
      {/*   overlay must be OFF.                                    */}
      {/* ⚠ Content under status bar: fixed element with no bg,     */}
      {/*   but requires page reload to take effect.                */}
      {/* ⚠ Body bg None + status bar colored: the navbar (URL bar) */}
      {/*   shows a shadow tint of the status bar color on scroll.  */}
      <div
        aria-hidden="true"
        className="fixed top-0 w-full z-[200] pointer-events-none"
        style={{ height: "11px", backgroundColor: cssColor(statusColor) }}
      />

      {/* ---- Visible Header ---- */}
      {/* Its background is what Safari samples for the status bar tint. */}
      {/* <header
        className="fixed top-0 w-full h-24 z-100 transition-colors duration-500 pointer-events-none border"
        style={{ backgroundColor: cssColor(statusColor) }}
      /> */}

      {/* ---- Safe Zone Enforcer ---- */}
      {overlayVisible && (
        <div
          className="fixed inset-0 z-[80] transition-all duration-500 border pointer-events-none"
          aria-hidden={false}
        >
          <div className="absolute inset-0 bg-transparent transition-opacity duration-500" />
        </div>
      )}

      {/* ---- Page Content ---- */}
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Safari Status Bar Tinting Test
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Use the controls below. Open in{" "}
            <strong>Safari 26+ on iOS or macOS</strong> to see the effect.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>

      {/* ---- Section 2 ---- */}
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-zinc-100 dark:bg-zinc-900 sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h2 className="max-w-xs text-2xl font-semibold leading-9 tracking-tight text-black dark:text-zinc-50">
            Scroll to see behavior
          </h2>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Safari re-samples the fixed element&apos;s background in real time
            as you scroll.
          </p>
        </div>
      </main>

      {/* ---- Section 3 ---- */}
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h2 className="max-w-xs text-2xl font-semibold leading-9 tracking-tight text-black dark:text-zinc-50">
            Luma-based text color
          </h2>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Safari uses{" "}
            <a
              href="https://github.com/andesco/safari-color-tinting/blob/main/luma.md"
              className="font-medium text-blue-600 dark:text-blue-400 underline"
            >
              luma (perceived brightness)
            </a>{" "}
            to pick dark or light status bar text.
          </p>
        </div>
      </main>

      {/* ---- Control Panel ---- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-3 max-w-[95vw]">
        {/* Scenario indicator */}
        <div className="rounded-full bg-black/70 px-4 py-1.5 text-xs text-white backdrop-blur-sm text-center">
          {scenario}
        </div>

        {/* Status Bar color row */}
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm dark:bg-zinc-800/90">
          <span className="mr-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            Status Bar:
          </span>
          {COLORS.map(({ label, value }) => (
            <button
              key={"s-" + label}
              onClick={() => setStatusColor(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                statusColor === value
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Nav Bar color row */}
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm dark:bg-zinc-800/90">
          <span className="mr-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            Body BG:
          </span>
          {COLORS.map(({ label, value }) => (
            <button
              key={"b-" + label}
              onClick={() => setBodyColor(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                bodyColor === value
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Overlay toggle */}
        <button
          onClick={() => setOverlayVisible((v) => !v)}
          className={`rounded-full px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-sm transition-all ${
            overlayVisible
              ? "bg-emerald-500 text-white hover:bg-emerald-600"
              : "bg-zinc-400 text-white hover:bg-zinc-500"
          }`}
        >
          Overlay: {overlayVisible ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}
