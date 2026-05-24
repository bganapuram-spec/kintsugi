import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getVeinsByUser, createVein } from "@/lib/db/queries/veins";
import { getOrCreateSession } from "@/lib/db/queries/chat-sessions";
import { getThreads } from "@/lib/db/queries/threads";

export function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: "kintsugi-mcp",
    version: "1.0.0",
  });

  // Tool: list gold veins
  server.tool(
    "list_gold_veins",
    "List all gold veins (saved emotional reframes) for the authenticated user.",
    {},
    async () => {
      const veins = await getVeinsByUser(userId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              veins.map((v) => ({
                id: v.id,
                source: v.source,
                goldVeinText: v.goldVeinText,
                narrativeText: v.narrativeText.slice(0, 200),
                createdAt: v.createdAt,
                sharedPublicly: v.sharedPublicly,
              })),
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Tool: save a gold vein
  server.tool(
    "save_gold_vein",
    "Save a new gold vein — a healed emotional reframe — to the user's Kintsugi vessel.",
    {
      narrativeText: z.string().describe("The original emotional narrative or struggle."),
      goldVeinText: z.string().describe("The insight, strength, or truth revealed — the gold vein itself."),
      source: z.enum(["chat", "exercise"]).default("chat").describe("Where this vein originated."),
    },
    async ({ narrativeText, goldVeinText, source }) => {
      const vein = await createVein({ userId, source, narrativeText, goldVeinText });
      return {
        content: [
          {
            type: "text",
            text: `Gold vein saved with id: ${vein.id}. The vessel grows more beautiful.`,
          },
        ],
      };
    }
  );

  // Tool: get vessel summary
  server.tool(
    "get_vessel_summary",
    "Get a summary of the user's Kintsugi vessel — how many fractures have been gilded, and a brief overview of their healing journey.",
    {},
    async () => {
      const veins = await getVeinsByUser(userId);
      const count = veins.length;
      const sources = veins.reduce(
        (acc, v) => ({ ...acc, [v.source]: (acc[v.source as "chat" | "exercise"] || 0) + 1 }),
        { chat: 0, exercise: 0 } as Record<string, number>
      );
      const latest = veins[0];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                totalVeins: count,
                fromChat: sources.chat,
                fromExercises: sources.exercise,
                latestGoldVein: latest?.goldVeinText ?? null,
                latestCreatedAt: latest?.createdAt ?? null,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Tool: browse community threads
  server.tool(
    "browse_gold_threads",
    "Browse the anonymous Gold Threads community — shared emotional reframes from others.",
    {
      limit: z.number().min(1).max(20).default(10).describe("Number of threads to retrieve."),
    },
    async ({ limit }) => {
      const threads = await getThreads(limit);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              threads.map((t) => ({
                id: t.id,
                narrative: t.anonymizedNarrative,
                resonanceCount: t.resonanceCount,
              })),
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Tool: get chat history summary
  server.tool(
    "get_chat_session",
    "Retrieve the user's most recent Restorer chat session with The Restorer.",
    {},
    async () => {
      const session = await getOrCreateSession(userId);
      const messages = (session.messages as Array<{ role: string; content: string }>).slice(-10);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                sessionId: session.id,
                messageCount: messages.length,
                recentMessages: messages.map((m) => ({
                  role: m.role,
                  preview: m.content.slice(0, 150),
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  return server;
}
