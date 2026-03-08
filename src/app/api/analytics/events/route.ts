import { NextRequest, NextResponse } from "next/server";
import type { Document } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getUserSessionSubject } from "@/lib/requestAuth";
import type { InteractionEventType } from "@/lib/types";

type IncomingInteractionEvent = {
  type?: InteractionEventType;
  path?: string;
  label?: string;
  target?: string;
  userId?: string;
  sessionId?: string;
};

type InteractionEventDocument = {
  type: InteractionEventType;
  path: string;
  label?: string;
  target?: string;
  userId: string;
  sessionId: string;
  userAgent: string;
  createdAt: Date;
};

const COLLECTION_NAME = "analytics_events";
const ALLOWED_TYPES: InteractionEventType[] = ["page_view", "click", "form_submit"];

const normalizeText = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const ensurePath = (value: unknown) => {
  const normalized = normalizeText(value, 240);
  if (!normalized) return "/";
  if (normalized.startsWith("/")) return normalized;
  return `/${normalized.replace(/^\/+/, "")}`;
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as IncomingInteractionEvent;
    const type = payload.type;

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ message: "Invalid event type" }, { status: 400 });
    }

    const path = ensurePath(payload.path);
    const label = normalizeText(payload.label, 160);
    const target = normalizeText(payload.target, 320);
    const userId = getUserSessionSubject(request) || normalizeText(payload.userId, 120) || "anonymous";
    const sessionId = normalizeText(payload.sessionId, 120) || "unknown-session";

    const db = await getDb();
    const collection = db.collection<InteractionEventDocument & Document>(COLLECTION_NAME);

    const doc: InteractionEventDocument = {
      type,
      path,
      userId,
      sessionId,
      userAgent: normalizeText(request.headers.get("user-agent"), 280),
      createdAt: new Date(),
    };

    if (label) {
      doc.label = label;
    }
    if (target) {
      doc.target = target;
    }

    await collection.insertOne(doc);

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json({ message: "Unable to capture interaction" }, { status: 500 });
  }
}
