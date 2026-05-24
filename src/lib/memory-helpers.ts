import { memory } from "@eazo/sdk";

export function recordVeinSaved(veinId: string, source: "chat" | "exercise", goldVeinText: string) {
  memory
    .reportAction({
      content: `User saved a gold vein from ${source}: "${goldVeinText.slice(0, 100)}"`,
      event_type: "create",
      page: source === "chat" ? "atelier" : "gilding-station",
      metadata: {
        type: "save_gold_vein",
        vein_id: veinId,
        source,
        action_kind: "domain_event",
        action_type: "save_gold_vein",
        app_id: process.env.NEXT_PUBLIC_EAZO_APP_ID || "",
        count_delta: 1,
        subject_id: veinId,
      },
    })
    .catch(() => {});
}

export function recordExerciseCompleted(exerciseId: string, exerciseTitle: string) {
  memory
    .reportAction({
      content: `User completed exercise: "${exerciseTitle}"`,
      event_type: "complete",
      page: "exercise",
      metadata: {
        type: "complete_exercise",
        exercise_id: exerciseId,
        action_kind: "domain_event",
        action_type: "complete_exercise",
        app_id: process.env.NEXT_PUBLIC_EAZO_APP_ID || "",
        count_delta: 1,
        subject_id: exerciseId,
      },
    })
    .catch(() => {});
}

export function recordThreadResonated(threadId: string) {
  memory
    .reportAction({
      content: `User resonated with a gold thread`,
      event_type: "interact",
      page: "threads",
      metadata: {
        type: "resonate_thread",
        thread_id: threadId,
      },
    })
    .catch(() => {});
}
