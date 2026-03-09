import { Collection, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import type { RitualRecord } from "@/lib/types";

type RitualDocument = {
  _id?: ObjectId;
  title: string;
  content: string;
  userId: string;
  userName?: string;
  createdAt: Date;
  updatedAt: Date;
};

const COLLECTION_NAME = "rituals";

const toPreview = (value: string) =>
  sanitizeRichHtml(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);

const normalizeRitual = (doc: RitualDocument & { _id: { toString(): string } }): RitualRecord => ({
  id: doc._id.toString(),
  title: doc.title || "",
  content: sanitizeRichHtml(doc.content || ""),
  preview: toPreview(doc.content || ""),
  userId: doc.userId || "",
  userName: doc.userName || "",
  createdAt: doc.createdAt?.toISOString(),
  updatedAt: doc.updatedAt?.toISOString(),
});

const getRitualCollection = async (): Promise<Collection<RitualDocument>> => {
  const db = await getDb();
  return db.collection<RitualDocument>(COLLECTION_NAME);
};

export const listRituals = async (filters?: {
  q?: string;
  userId?: string;
  limit?: number;
}) => {
  const collection = await getRitualCollection();
  const query: Record<string, unknown> = {};

  if (filters?.q) {
    query.$or = [
      { title: { $regex: filters.q, $options: "i" } },
      { content: { $regex: filters.q, $options: "i" } },
      { userName: { $regex: filters.q, $options: "i" } },
      { userId: { $regex: filters.q, $options: "i" } },
    ];
  }
  if (filters?.userId) {
    query.userId = filters.userId;
  }

  let cursor = collection.find(query).sort({ updatedAt: -1, _id: -1 });
  if (filters?.limit) {
    cursor = cursor.limit(filters.limit);
  }

  const docs = await cursor.toArray();
  return docs.map((doc) =>
    normalizeRitual(doc as RitualDocument & { _id: { toString(): string } })
  );
};

export const getRitualById = async (id: string) => {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getRitualCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc || !doc._id) return null;
  return normalizeRitual(doc as RitualDocument & { _id: { toString(): string } });
};

export const createRitual = async (payload: {
  title: string;
  content: string;
  userId: string;
  userName?: string;
}) => {
  const collection = await getRitualCollection();
  const now = new Date();
  const doc: RitualDocument = {
    title: payload.title.trim() || "Untitled ritual",
    content: sanitizeRichHtml(payload.content || ""),
    userId: payload.userId,
    userName: payload.userName?.trim() || "",
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);
  return normalizeRitual({ ...doc, _id: result.insertedId } as RitualDocument & {
    _id: { toString(): string };
  });
};

export const updateRitual = async (
  id: string,
  payload: Partial<Pick<RitualRecord, "title" | "content" | "userName">>
) => {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getRitualCollection();
  const updates: Partial<RitualDocument> = {
    updatedAt: new Date(),
  };

  if (payload.title !== undefined) {
    updates.title = payload.title.trim() || "Untitled ritual";
  }
  if (payload.content !== undefined) {
    updates.content = sanitizeRichHtml(payload.content);
  }
  if (payload.userName !== undefined) {
    updates.userName = payload.userName.trim();
  }

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!result || !result._id) return null;
  return normalizeRitual(result as RitualDocument & { _id: { toString(): string } });
};

export const deleteRitual = async (id: string) => {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getRitualCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};
