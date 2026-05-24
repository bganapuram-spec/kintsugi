"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

function createSoundscape(ctx: AudioContext): () => void {
  const nodes: AudioNode[] = [];

  // Kiln crackle — filtered noise bursts
  const crackleBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const crackleData = crackleBuffer.getChannelData(0);
  for (let i = 0; i < crackleData.length; i++) {
    crackleData[i] = (Math.random() * 2 - 1) * (Math.random() < 0.003 ? 1 : 0.02);
  }
  const crackleSource = ctx.createBufferSource();
  crackleSource.buffer = crackleBuffer;
  crackleSource.loop = true;
  const crackleFilter = ctx.createBiquadFilter();
  crackleFilter.type = "bandpass";
  crackleFilter.frequency.value = 2800;
  crackleFilter.Q.value = 0.7;
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.18;
  crackleSource.connect(crackleFilter);
  crackleFilter.connect(crackleGain);
  crackleGain.connect(ctx.destination);
  crackleSource.start();
  nodes.push(crackleSource, crackleFilter, crackleGain);

  // Rain on shoji — pink-ish noise
  const rainBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const rainData = rainBuffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < rainData.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    rainData[i] = (b0 + b1 + b2 + white * 0.0556) / 7;
  }
  const rainSource = ctx.createBufferSource();
  rainSource.buffer = rainBuffer;
  rainSource.loop = true;
  const rainFilter = ctx.createBiquadFilter();
  rainFilter.type = "highpass";
  rainFilter.frequency.value = 400;
  const rainGain = ctx.createGain();
  rainGain.gain.value = 0.09;
  rainSource.connect(rainFilter);
  rainFilter.connect(rainGain);
  rainGain.connect(ctx.destination);
  rainSource.start();
  nodes.push(rainSource, rainFilter, rainGain);

  // Slow low hum — warmth
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 58;
  const oscGain = ctx.createGain();
  oscGain.gain.value = 0.04;
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start();
  nodes.push(osc, oscGain);

  return () => {
    nodes.forEach((n) => { try { (n as AudioBufferSourceNode).stop?.(); n.disconnect(); } catch { } });
  };
}

interface Props {
  initialOn?: boolean;
  onChange?: (on: boolean) => void;
}

export default function SoundscapeToggle({ initialOn = false, onChange }: Props) {
  const [on, setOn] = useState(initialOn);
  const ctxRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (on) {
      if (!ctxRef.current) ctxRef.current = new AudioContext();
      if (ctxRef.current.state === "suspended") ctxRef.current.resume();
      cleanupRef.current = createSoundscape(ctxRef.current);
    } else {
      cleanupRef.current?.();
      cleanupRef.current = null;
    }
    return () => { cleanupRef.current?.(); };
  }, [on]);

  const toggle = () => {
    const next = !on;
    setOn(next);
    onChange?.(next);
  };

  return (
    <motion.button
      onClick={toggle}
      title={on ? "Mute ambient sound" : "Enable ambient soundscape"}
      className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500"
      style={{
        backgroundColor: on ? "rgba(201,169,97,0.15)" : "transparent",
        border: `1px solid ${on ? "#C9A961" : "rgba(201,169,97,0.25)"}`,
      }}
      whileTap={{ scale: 0.88 }}
    >
      {on ? (
        <motion.span className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "#C9A961" }}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#8A8580" }} />
      )}
    </motion.button>
  );
}
