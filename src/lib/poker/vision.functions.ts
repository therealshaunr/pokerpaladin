import { createServerFn } from "@tanstack/react-start";

interface VisionInput {
  image: string; // data URL (image/png or jpeg base64)
  variantLabel: string;
  heroSeatHint?: string;
}

export interface VisionResult {
  hole: string[]; // e.g. ["As","Kd"]
  board: string[]; // e.g. ["Th","9s","2c"]
  pot: number | null;
  toCall: number | null;
  notes: string;
}

function safeParse(text: string): VisionResult {
  const empty: VisionResult = { hole: [], board: [], pot: null, toCall: null, notes: "" };
  if (!text) return empty;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { ...empty, notes: text.slice(0, 200) };
  try {
    const obj = JSON.parse(match[0]);
    return {
      hole: Array.isArray(obj.hole) ? obj.hole.map(String) : [],
      board: Array.isArray(obj.board) ? obj.board.map(String) : [],
      pot: typeof obj.pot === "number" ? obj.pot : null,
      toCall: typeof obj.toCall === "number" ? obj.toCall : null,
      notes: typeof obj.notes === "string" ? obj.notes : "",
    };
  } catch {
    return { ...empty, notes: "Could not parse vision output." };
  }
}

export const analyzeTable = createServerFn({ method: "POST" })
  .inputValidator((input: VisionInput) => {
    if (!input || typeof input.image !== "string" || !input.image.startsWith("data:image")) {
      throw new Error("A captured table image is required.");
    }
    return input;
  })
  .handler(async ({ data }): Promise<VisionResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured (missing LOVABLE_API_KEY).");

    const prompt =
      `You are reading a screenshot of an online ${data.variantLabel} poker table. ` +
      `Identify ONLY what is clearly visible. Return STRICT JSON, no prose, in this shape:\n` +
      `{"hole":["As","Kd"],"board":["Th","9s","2c"],"pot":1234,"toCall":200,"notes":"short read"}\n` +
      `Use rank letters A K Q J T 9 8 7 6 5 4 3 2 and suit letters s h d c (e.g. "Qh"). ` +
      `hole = the player's own cards. board = community cards (empty array for stud). ` +
      `If a value is unknown use [] for arrays and null for numbers. ` +
      (data.heroSeatHint ? `Hero seat hint: ${data.heroSeatHint}. ` : "");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (resp.status === 429) throw new Error("Rate limited — wait a moment and analyze again.");
    if (resp.status === 402) throw new Error("AI credits exhausted — add credits in Settings → Workspace → Usage.");
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Vision failed [${resp.status}]: ${body.slice(0, 160)}`);
    }

    const json = await resp.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    return safeParse(text);
  });
