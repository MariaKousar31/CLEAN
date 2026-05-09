import { NextResponse } from "next/server";
import { INTENT_EXTRACTION_PROMPT } from "@/lib/ai/prompts";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json();

  // Slack URL verification challenge
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  const event = body.event;
  if (!event || event.bot_id || req.headers.get("x-slack-retry-num")) {
    return NextResponse.json({ ok: true });
  }

  const text = event.text?.trim();
  if (!text) return NextResponse.json({ ok: true });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: INTENT_EXTRACTION_PROMPT },
          { role: "user", content: `Message:\n"${text}"` },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    const ai = JSON.parse(data.choices[0].message.content || "{}");

    store.add({
      id: `slack-${Date.now()}`,
      sourceApp: "Slack",
      sender: event.user || "Slack User",
      snippet: text.substring(0, 60) + (text.length > 60 ? "..." : ""),
      fullText: text,
      urgency: ai.urgency || "Medium",
      actions: (ai.actions || []).map((a: any, i: number) => ({
        id: `action-${Date.now()}-${i}`, ...a,
      })),
      simulation: ai.simulation || {
        timeSavedMinutes: 5,
        contextSwitchesAvoided: 2,
        insight: "Automating this reduces manual coordination.",
      },
    });
  } catch (err) {
    console.error("Slack webhook error:", err);
  }

  return NextResponse.json({ ok: true });
}