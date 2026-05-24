"use client";

import Link from "next/link";
import { gildingExercises } from "@/lib/gilding-data";

export default function GildingStationScreen() {
  return (
    <div className="flex flex-col min-h-svh" style={{ backgroundColor: "#221E1D" }}>
      {/* Header */}
      <header
        className="h-[60px] px-4 flex items-center justify-between z-10"
        style={{ borderBottom: "1px solid rgba(201,169,97,0.15)", backgroundColor: "#2A2826" }}
      >
        <Link
          href="/"
          className="flex items-center text-xs uppercase tracking-wide gap-1 transition-colors"
          style={{ color: "#C9A961" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M15.75 19.5L8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Atelier</span>
        </Link>
        <h2
          className="text-xs uppercase tracking-wider"
          style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}
        >
          Active Craft Steps
        </h2>
        <div className="w-8" />
      </header>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto pb-24">
        <div className="text-center max-w-xs mx-auto mb-6">
          <span className="text-[9px] uppercase tracking-widest block" style={{ color: "#C9A961" }}>
            Crafting emotional pottery
          </span>
          <h3
            className="text-2xl font-light leading-snug"
            style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}
          >
            The Gilding Station
          </h3>
          <p
            className="text-xs font-light mt-2 italic leading-relaxed"
            style={{ color: "#8A8580" }}
          >
            Select a tactile step of the assembly line to trace, hold, and mend specific shards of memory.
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-4 max-w-sm mx-auto">
          {gildingExercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>

        {/* Disclaimer */}
        <div
          className="max-w-sm mx-auto p-4 mt-8"
          style={{ border: "1px solid rgba(201,169,97,0.15)", backgroundColor: "rgba(34,30,29,0.6)" }}
        >
          <div className="flex items-start gap-3">
            <span className="text-xs font-semibold mt-0.5" style={{ color: "#C9A961" }}>
              ✦
            </span>
            <p className="text-[10px] leading-relaxed italic" style={{ color: "#8A8580" }}>
              Kintsugi is an artful companion, not a certified clinical alternative. In moments of extreme
              vulnerability, please contact licensed services or 988 directly. We value your physical breath.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({ exercise }: { exercise: typeof gildingExercises[number] }) {
  const isActive = true; // all exercises are navigable

  if (!isActive) {
    return (
      <div
        className="p-5 relative opacity-85"
        style={{ border: "1px solid rgba(201,169,97,0.15)", backgroundColor: "rgba(34,30,29,0.4)" }}
      >
        <div className="flex justify-between items-center mb-3">
          <span
            className="text-[9px] uppercase tracking-widest"
            style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#8A8580" }}
          >
            {exercise.phase}
          </span>
          <span className="text-[8px] uppercase tracking-widest" style={{ color: "#8A8580" }}>
            Awaiting Trace
          </span>
        </div>
        <h4
          className="text-lg italic font-light"
          style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#8A8580" }}
        >
          {exercise.title}
        </h4>
        <p className="text-xs font-light leading-relaxed mt-1 italic" style={{ color: "#8A8580" }}>
          {exercise.description}
        </p>
      </div>
    );
  }

  return (
    <Link
      href={`/gilding-station/${exercise.id}`}
      className="p-5 relative group cursor-pointer transition-all duration-500 block"
      style={{ border: "1px solid #C9A961", backgroundColor: "#2A2826" }}
    >
      <div className="flex justify-between items-center mb-3">
        <span
          className="text-[9px] uppercase tracking-widest"
          style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#C9A961" }}
        >
          {exercise.phase}
        </span>
        <span
          className="text-[9px] uppercase tracking-wider px-1.5 py-0.5"
          style={{ color: "#C9A961", border: "1px solid rgba(201,169,97,0.15)" }}
        >
          Ready to glaze
        </span>
      </div>
      <h4
        className="text-lg italic font-light"
        style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}
      >
        {exercise.title}
      </h4>
      <p className="text-xs font-light leading-relaxed mt-2 italic" style={{ color: "#8A8580" }}>
        {exercise.description}
      </p>
      <span
        className="mt-4 inline-flex items-center text-[10px] uppercase tracking-widest hover:underline"
        style={{ color: "#C9A961" }}
      >
        Begin task →
      </span>
    </Link>
  );
}
