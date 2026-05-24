// Exercise definitions — steps for each gilding exercise
export type ExerciseStep = {
  prompt: string;
  inputType: "textarea" | "select" | "breathing";
  placeholder?: string;
  options?: string[];
  advanceLabel: string;
};

export type ExerciseDefinition = {
  id: string;
  title: string;
  steps: ExerciseStep[];
  completionNarrative: string;
};

export const exerciseDefinitions: ExerciseDefinition[] = [
  {
    id: "tracing-the-crack",
    title: "Tracing the Crack",
    steps: [
      {
        prompt: "Close your eyes for three quiet breaths. Now, locate where this emotional tension rests in your physical form. Is it a weight in your chest, a tightness in your throat, or a quiet ache in your temple?",
        inputType: "textarea",
        placeholder: "The cold heavy slate pressing against my chest...",
        advanceLabel: "Advance to Holding",
      },
      {
        prompt: "Look at the thought that holds the fracture in place. Write it plainly, without softening it. What is the belief underneath the pain?",
        inputType: "textarea",
        placeholder: "I believe that I am fundamentally...",
        advanceLabel: "Trace deeper",
      },
      {
        prompt: "Now, ask yourself — is this belief about you as a person, or about what happened? They are not the same thing. Sit with that difference.",
        inputType: "textarea",
        placeholder: "What I notice when I hold this distinction...",
        advanceLabel: "Name the gold vein",
      },
    ],
    completionNarrative: "You have traced the fracture with patience. The crack is visible now — and visible things can be gilded.",
  },
  {
    id: "holding-the-shard",
    title: "Holding the Shard",
    steps: [
      {
        prompt: "Temperature change can interrupt the distress spiral. Hold something cold — a glass of water, an ice cube — or splash cold water on your face. Then describe what you feel as sensation, not story.",
        inputType: "textarea",
        placeholder: "The cold moves from my hands into...",
        advanceLabel: "Stay with it",
      },
      {
        prompt: "Pace your movement for 20 seconds — a brisk walk, stepping in place. Notice: what shifted in the weight of the feeling?",
        inputType: "textarea",
        placeholder: "After movement, the feeling became...",
        advanceLabel: "Return to stillness",
      },
      {
        prompt: "Breathe in for 4 counts. Hold for 2. Out for 6. Repeat three times. When you are ready, name one thing you will allow yourself to feel right now — without judgment.",
        inputType: "textarea",
        placeholder: "I allow myself to feel...",
        advanceLabel: "Rest with this",
      },
    ],
    completionNarrative: "You held the shard without cutting yourself on it. That is its own kind of courage.",
  },
  {
    id: "setting-the-lacquer",
    title: "Setting the Lacquer",
    steps: [
      {
        prompt: "Describe the situation that is causing you pain. Just the facts — what actually happened, without interpretation.",
        inputType: "textarea",
        placeholder: "The situation was...",
        advanceLabel: "Continue",
      },
      {
        prompt: "What thoughts came up about yourself, the other person, or the future? Write them as you experienced them — even the harsh ones.",
        inputType: "textarea",
        placeholder: "My thoughts told me...",
        advanceLabel: "Examine the thought",
      },
      {
        prompt: "Look at one of those thoughts. What evidence supports it? What evidence gently contradicts it? A balanced thought holds both.",
        inputType: "textarea",
        placeholder: "On one side... on the other...",
        advanceLabel: "Name the gold vein",
      },
    ],
    completionNarrative: "The lacquer has been set. A reframed thought is not a denial — it is an honest reconstruction.",
  },
  {
    id: "naming-the-glaze",
    title: "Naming the Glaze",
    steps: [
      {
        prompt: "What is the primary emotion present right now? Name it as precisely as you can — not just 'sad', but the specific texture of this sadness.",
        inputType: "textarea",
        placeholder: "The emotion is a kind of...",
        advanceLabel: "Hold the name",
      },
      {
        prompt: "Emotions carry information. What is this emotion trying to protect, preserve, or tell you?",
        inputType: "textarea",
        placeholder: "This feeling is trying to say...",
        advanceLabel: "Listen to it",
      },
      {
        prompt: "Give this emotional experience a name — as if it were a piece of pottery in your collection. Something dignified, something that honors what you have carried.",
        inputType: "textarea",
        placeholder: "I name this experience...",
        advanceLabel: "Receive the glaze",
      },
    ],
    completionNarrative: "Named things become known things. And known things can be held.",
  },
  {
    id: "steady-hands",
    title: "Steady Hands",
    steps: [
      {
        prompt: "Box Breathing: Breathe in for 4 counts. Hold for 4 counts. Breathe out for 4 counts. Hold for 4 counts. Repeat 4 times. Use this screen as your guide — just follow the rhythm.",
        inputType: "breathing",
        advanceLabel: "Continue to 4-7-8",
      },
      {
        prompt: "4-7-8 Breath: Breathe in through the nose for 4 counts. Hold for 7. Breathe out through the mouth for 8, slowly. Repeat twice. Your nervous system is listening.",
        inputType: "breathing",
        advanceLabel: "Rest with stillness",
      },
      {
        prompt: "Place one hand on your chest and feel your heartbeat. You are here. You have survived every difficult moment that came before this one. What do you need to carry from this practice?",
        inputType: "textarea",
        placeholder: "What I carry forward is...",
        advanceLabel: "Complete the practice",
      },
    ],
    completionNarrative: "Your hands are steadier now. The gold sets best on a still surface.",
  },
];
