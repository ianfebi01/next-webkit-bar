"use client";

import Image from "next/image";
import { useState } from "react";

const PRESET_COLORS = [
  { label: "None", value: "" },
  { label: "White", value: "bg-white" },
  { label: "Black", value: "bg-black" },
  { label: "Blue", value: "bg-blue-600" },
  { label: "Red", value: "bg-red-500" },
  { label: "Green", value: "bg-emerald-500" },
  { label: "Indigo", value: "bg-indigo-600" },
] as const;

export default function Home() {
  const [navBg, setNavBg] = useState("");
  const [overlayVisible, setOverlayVisible] = useState(true);

  const hasTint = navBg !== "";
  const scenario = !overlayVisible
    ? "No overlay — default fallback to <body>"
    : hasTint
      ? "Tinted status bar (colored nav background)"
      : "Transparent status bar (nav with no background)";

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* ---- Safari Tinting Controller: Fixed <nav> at top ---- */}
      {/* No background → transparent status bar. With background → tinted status bar. */}
      <nav
        className={`fixed top-0 w-full h-24 z-[100] transition-colors duration-500 pointer-events-none border ${navBg}`}
      />

      {/* ---- Safe Zone Enforcer: Fixed fullscreen overlay ---- */}
      {/* When present, ensures content respects safe-area behavior alongside the nav. */}
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
            Use the controls below to toggle between transparent and tinted
            status bar states. Open this page in{" "}
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

      {/* ---- Second section (scroll target) ---- */}
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-zinc-100 dark:bg-zinc-900 sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h2 className="max-w-xs text-2xl font-semibold leading-9 tracking-tight text-black dark:text-zinc-50">
            Scroll to see status bar behavior
          </h2>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            As you scroll, observe how the status bar tint remains consistent.
            Safari re-samples the fixed element&apos;s background in real time.
          </p>
        </div>
      </main>

      {/* ---- Third section (scroll target) ---- */}
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h2 className="max-w-xs text-2xl font-semibold leading-9 tracking-tight text-black dark:text-zinc-50">
            Try different colors
          </h2>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Safari uses the{" "}
            <a
              href="https://github.com/andesco/safari-color-tinting/blob/main/luma.md"
              className="font-medium text-blue-600 dark:text-blue-400 underline"
            >
              luma (perceived brightness)
            </a>{" "}
            of the sampled color to decide whether status bar text should be
            dark or light.
          </p>
        </div>
      </main>

      {/* ---- Control Panel ---- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-3">
        {/* Scenario indicator */}
        <div className="rounded-full bg-black/70 px-4 py-1.5 text-xs text-white backdrop-blur-sm">
          {scenario}
        </div>

        {/* Nav background color picker */}
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm dark:bg-zinc-800/90">
          <span className="mr-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Nav BG:
          </span>
          {PRESET_COLORS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setNavBg(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                navBg === value
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
