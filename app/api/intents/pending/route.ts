// app/api/intents/pending/route.ts
import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ intents: store.getAll() });
}

export async function DELETE() {
  store.clear();
  return NextResponse.json({ ok: true });
}