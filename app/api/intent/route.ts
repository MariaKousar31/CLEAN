import { NextResponse } from "next/server";
import { INTENT_EXTRACTION_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: Request) {
  try {
    const { text, sourceApp = "Gmail", sender = "Unknown" } = await req.json();
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

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
          { role: "user", content: `Message:\n"${text}"` }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    console.log("Groq raw:", JSON.stringify(data, null, 2));

    if (data.error) throw new Error(data.error.message);

    const ai = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      id: `task-${Date.now()}`,
      sourceApp, sender,
      snippet: text.substring(0, 60) + "...",
      fullText: text,
      urgency: ai.urgency || "Medium",
      actions: (ai.actions || []).map((a: any, i: number) => ({ id: `action-${Date.now()}-${i}`, ...a })),
      simulation: ai.simulation || { timeSavedMinutes: 5, contextSwitchesAvoided: 2, insight: "Automating this reduces friction." },
    });
  } catch (err) {
    console.error("Intent Error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}