import { Collection, ObjectId } from "mongodb";
import { LIBRARY_ITEMS } from "@/data/library";
import { getDb } from "@/lib/mongodb";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import type { LibraryKind, LibraryRecord, LibraryTone } from "@/lib/types";

type LibraryDocument = {
  _id?: ObjectId;
  kind: LibraryKind;
  title: string;
  description: string;
  imageUrl?: string;
  link?: string;
  eyebrow?: string;
  tag?: string;
  time?: string;
  tone?: LibraryTone;
  buttonLabel?: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

const COLLECTION_NAME = "library";

/**
 * Normalizes Mongo document to API-facing LibraryRecord.
 */
const normalizeLibrary = (
  doc: LibraryDocument & { _id: { toString(): string } }
): LibraryRecord => ({
  id: doc._id.toString(),
  kind: doc.kind,
  title: doc.title || "",
  description: sanitizeRichHtml(doc.description || ""),
  imageUrl: doc.imageUrl || "",
  link: doc.link || "",
  eyebrow: doc.eyebrow || "",
  tag: doc.tag || "",
  time: doc.time || "",
  tone: doc.tone,
  buttonLabel: doc.buttonLabel || "",
  order: Number.isFinite(doc.order) ? Number(doc.order) : 0,
  createdAt: doc.createdAt?.toISOString(),
  updatedAt: doc.updatedAt?.toISOString(),
});

const seedLibrary = (): LibraryDocument[] => {
  const now = new Date();
  return LIBRARY_ITEMS.map((item) => ({
    ...item,
    order: Number.isFinite(item.order) ? item.order : 0,
    createdAt: now,
    updatedAt: now,
  }));
};

const getLibraryCollection = async (): Promise<Collection<LibraryDocument>> => {
  const db = await getDb();
  return db.collection<LibraryDocument>(COLLECTION_NAME);
};

export const ensureLibrarySeeded = async () => {
  const collection = await getLibraryCollection();
  const count = await collection.countDocuments();
  if (count > 0) return;
  await collection.insertMany(seedLibrary());
};

/**
 * Lists library content with optional kind and free-text title filter.
 */
export const listLibrary = async (filters?: { kind?: string; q?: string }) => {
  await ensureLibrarySeeded();
  const collection = await getLibraryCollection();
  const query: Record<string, unknown> = {};
  if (filters?.kind) {
    query.kind = filters.kind;
  }
  if (filters?.q) {
    query.title = { $regex: filters.q, $options: "i" };
  }
  const docs = await collection.find(query).sort({ order: 1, _id: 1 }).toArray();
  return docs.map((doc) =>
    normalizeLibrary(doc as LibraryDocument & { _id: { toString(): string } })
  );
};

/**
 * Fetches one library item by Mongo ObjectId string.
 */
export const getLibraryById = async (id: string) => {
  await ensureLibrarySeeded();
  if (!ObjectId.isValid(id)) return null;
  const collection = await getLibraryCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc || !doc._id) return null;
  return normalizeLibrary(doc as LibraryDocument & { _id: { toString(): string } });
};

const getFallbackForKind = (kind: LibraryKind) => {
  const seed = LIBRARY_ITEMS.find((item) => item.kind === kind);
  if (seed) {
    return seed;
  }
  if (kind === "hero") {
    return {
      kind,
      title: "Library of calm",
      description: "Short reads and guided reflections for every day.",
      eyebrow: "Daily guidance",
      buttonLabel: "Start here",
      order: 0,
    } as const;
  }
  if (kind === "cta") {
    return {
      kind,
      title: "Unlock the full library",
      description: "Save favorites and get weekly reflections.",
      buttonLabel: "Subscribe",
      order: 0,
    } as const;
  }
  if (kind === "article") {
    return {
      kind,
      title: "New read",
      description: "A short guide from the Journey library.",
      tag: "Guidance",
      time: "5 min read",
      order: 0,
    } as const;
  }
  if (kind === "quick") {
    return {
      kind,
      title: "Quick practice",
      description: "",
      time: "3 min",
      order: 0,
    } as const;
  }
  if (kind === "intent") {
    return {
      kind,
      title: "I want to...",
      description: "",
      link: "/library",
      order: 0,
    } as const;
  }
  return {
    kind,
    title: "New suggestion",
    description: "A supportive practice for calmer days.",
    tone: "sleep",
    order: 0,
  } as const;
};

export const createLibraryItem = async (payload: Partial<LibraryRecord>) => {
  const collection = await getLibraryCollection();
  const now = new Date();
  const kind = (payload.kind as LibraryKind) || "suggestion";
  const fallback = getFallbackForKind(kind);

  const doc: LibraryDocument = {
    kind,
    title: payload.title?.trim() || fallback.title,
    description: sanitizeRichHtml(
      payload.description !== undefined ? payload.description : fallback.description
    ),
    imageUrl: payload.imageUrl !== undefined ? payload.imageUrl.trim() : "",
    link: payload.link !== undefined ? payload.link.trim() : fallback.link,
    eyebrow: payload.eyebrow !== undefined ? payload.eyebrow : fallback.eyebrow,
    tag: payload.tag !== undefined ? payload.tag : fallback.tag,
    time: payload.time !== undefined ? payload.time : fallback.time,
    tone: (payload.tone as LibraryTone) ?? fallback.tone,
    buttonLabel:
      payload.buttonLabel !== undefined ? payload.buttonLabel : fallback.buttonLabel,
    order: Number.isFinite(payload.order) ? Number(payload.order) : fallback.order,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);
  return normalizeLibrary({ ...doc, _id: result.insertedId } as LibraryDocument & {
    _id: { toString(): string };
  });
};

/**
 * Updates editable fields for a library item and returns the updated row.
 */
export const updateLibraryItem = async (id: string, payload: Partial<LibraryRecord>) => {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getLibraryCollection();
  const updates: Partial<LibraryDocument> = {
    updatedAt: new Date(),
  };

  if (payload.kind !== undefined) updates.kind = payload.kind as LibraryKind;
  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.description !== undefined) {
    updates.description = sanitizeRichHtml(payload.description);
  }
  if (payload.imageUrl !== undefined) updates.imageUrl = payload.imageUrl.trim();
  if (payload.link !== undefined) updates.link = payload.link.trim();
  if (payload.eyebrow !== undefined) updates.eyebrow = payload.eyebrow;
  if (payload.tag !== undefined) updates.tag = payload.tag;
  if (payload.time !== undefined) updates.time = payload.time;
  if (payload.tone !== undefined) updates.tone = payload.tone as LibraryTone;
  if (payload.buttonLabel !== undefined) updates.buttonLabel = payload.buttonLabel;
  if (payload.order !== undefined) updates.order = Number(payload.order);

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!result || !result._id) return null;
  return normalizeLibrary(result as LibraryDocument & { _id: { toString(): string } });
};

/**
 * Deletes a library item by id.
 */
export const deleteLibraryItem = async (id: string) => {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getLibraryCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};
