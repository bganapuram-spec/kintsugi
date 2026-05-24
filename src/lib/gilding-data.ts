export const gildingExercises = [
  {
    id: "tracing-the-crack",
    phase: "Phase I",
    title: "Tracing the Crack",
    subtitle: "Cognitive Distortion Identification",
    description: "Slowly locate where the pain became a physical presence. Tap the fissure with continuous breath.",
    status: "active",
    durationMins: 8,
  },
  {
    id: "holding-the-shard",
    phase: "Phase II",
    title: "Holding the Shard",
    subtitle: "Distress Tolerance / TIPP",
    description: "Inspecting raw pieces of self-doubt and isolation without immediately trying to clean or wipe them away.",
    status: "active",
    durationMins: 10,
  },
  {
    id: "setting-the-lacquer",
    phase: "Phase III",
    title: "Setting the Lacquer",
    subtitle: "Thought Record",
    description: "Bonding memory fragments with the warm golden adhesive of structured CBT/DBT reframing prompts.",
    status: "active",
    durationMins: 10,
  },
  {
    id: "naming-the-glaze",
    phase: "Phase IV",
    title: "Naming the Glaze",
    subtitle: "Emotion Labeling",
    description: "Naming your repaired history with a title representing survival and authentic, customized resilience.",
    status: "active",
    durationMins: 7,
  },
  {
    id: "steady-hands",
    phase: "Phase V",
    title: "Steady Hands",
    subtitle: "Box Breathing / 4-7-8",
    description: "A physical centering exercise to regulate the heartbeat. Keep the hands steady.",
    status: "active",
    durationMins: 5,
  },
];

export type GildingExercise = typeof gildingExercises[number];
