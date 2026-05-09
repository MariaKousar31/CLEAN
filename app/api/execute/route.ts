import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { taskId, actions } = await req.json();
    if (!taskId) return NextResponse.json({ error: "Task ID required" }, { status: 400 });

    const results = [];

    for (const action of actions || []) {
      // Send real Slack message for Slack actions
      if (action.app === "Slack") {
        await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          },
          body: JSON.stringify({
            channel: "#general",
            text: `✅ *${action.action}*\n${action.details}`,
          }),
        });
        results.push({ action: action.action, status: "sent to Slack" });
      }

      // For other apps just log for now
      else {
        results.push({ action: action.action, status: "simulated" });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("Execute error:", err);
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}