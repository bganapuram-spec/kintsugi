"use client";

import { motion } from "framer-motion";

export interface SeamData {
  id: string;
  source: string;
  goldVeinText: string;
  createdAt: string;
}

// 12 organic seam paths contained within the vessel silhouette
const SEAM_PATHS = [
  "M 88,48 C 82,72 90,96 84,120 C 80,138 68,150 70,168",
  "M 112,46 C 118,70 110,95 116,118 C 120,136 132,148 130,166",
  "M 68,60 C 78,82 70,106 76,126 C 80,142 92,154 90,170",
  "M 132,58 C 122,80 130,104 124,124 C 120,140 108,152 110,170",
  "M 78,50 C 72,76 80,100 74,122 C 70,140 58,152 60,170",
  "M 122,52 C 128,78 120,102 126,124 C 130,142 142,154 140,170",
  "M 100,44 C 96,70 104,96 98,120 C 94,140 82,152 84,170",
  "M 60,68 C 70,90 62,112 68,132 C 72,148 84,158 82,172",
  "M 140,66 C 130,88 138,110 132,130 C 128,146 116,156 118,172",
  "M 94,46 C 88,72 96,98 90,120 C 86,140 74,152 76,170",
  "M 106,46 C 112,72 104,98 110,120 C 114,140 126,152 124,170",
  "M 72,56 C 66,80 74,104 68,126 C 64,144 52,156 54,172",
];

interface Props {
  seams: SeamData[];
  dustLevel?: number; // 0–1
  highlightId?: string;
  onSeamClick?: (seam: SeamData) => void;
}

export function VesselSVG({ seams, dustLevel = 0, highlightId, onSeamClick }: Props) {
  return (
    <svg viewBox="0 0 200 215" className="w-full h-full" style={{ filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.8))" }}>
      <defs>
        <radialGradient id="mvGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#3d2f2c" />
          <stop offset="60%" stopColor="#25201e" />
          <stop offset="100%" stopColor="#160f0e" />
        </radialGradient>
        <radialGradient id="mvSheen" cx="28%" cy="22%" r="42%">
          <stop offset="0%" stopColor="#5c4540" stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <filter id="seamGlow">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
        <filter id="seamActive">
          <feGaussianBlur stdDeviation="2.8" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
        <clipPath id="mvClip">
          <path d="M 50,44 C 50,44 20,66 20,120 C 20,168 58,184 100,184 C 142,184 180,168 180,120 C 180,66 150,44 150,44 Z" />
        </clipPath>
      </defs>

      {/* Vessel body */}
      <path d="M 50,44 C 50,44 20,66 20,120 C 20,168 58,184 100,184 C 142,184 180,168 180,120 C 180,66 150,44 150,44 Z"
        fill="url(#mvGrad)" stroke="#C9A961" strokeWidth="0.7" />
      {/* Sheen */}
      <path d="M 50,44 C 50,44 20,66 20,120 C 20,168 58,184 100,184 C 142,184 180,168 180,120 C 180,66 150,44 150,44 Z"
        fill="url(#mvSheen)" />
      {/* Neck */}
      <path d="M 50,44 Q 100,34 150,44" fill="none" stroke="#C9A961" strokeWidth="0.8" strokeOpacity="0.7" />
      <path d="M 56,46 Q 100,37 144,46" fill="none" stroke="#C9A961" strokeWidth="0.3" strokeOpacity="0.3" />
      {/* Base shadow */}
      <ellipse cx="100" cy="184" rx="30" ry="4.5" fill="#C9A961" fillOpacity="0.1" />

      {/* Gold seams */}
      <g clipPath="url(#mvClip)">
        {seams.map((seam, i) => {
          const path = SEAM_PATHS[i % SEAM_PATHS.length];
          const isActive = highlightId === seam.id;
          return (
            <motion.path
              key={seam.id}
              d={path}
              fill="none"
              stroke="#C9A961"
              strokeWidth={isActive ? 2.4 : 1.5}
              strokeLinecap="round"
              filter={isActive ? "url(#seamActive)" : "url(#seamGlow)"}
              style={{ cursor: onSeamClick ? "pointer" : "default" }}
              initial={{ pathLength: 0, opacity: 0, strokeOpacity: 0.2 }}
              animate={{ pathLength: 1, opacity: 1, strokeOpacity: isActive ? 1 : 0.92 }}
              transition={{
                pathLength: { duration: 2.1, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.9, delay: i * 0.18 },
                strokeOpacity: { duration: 1.6, delay: i * 0.18 + 1.2 },
              }}
              whileHover={onSeamClick ? { strokeWidth: 2.6, strokeOpacity: 1 } : undefined}
              onClick={() => onSeamClick?.(seam)}
            />
          );
        })}
      </g>

      {/* Dust overlay */}
      {dustLevel > 0 && (
        <motion.rect x="20" y="44" width="160" height="140"
          fill={`rgba(138,133,128,${dustLevel * 0.28})`}
          clipPath="url(#mvClip)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        />
      )}
    </svg>
  );
}
