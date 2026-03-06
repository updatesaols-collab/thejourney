import { Collection } from "mongodb";
import { PROGRAMS } from "@/data/programs";
import { getDb } from "@/lib/mongodb";
import { slugify } from "@/lib/slug";
import type { ProgramRecord, ProgramStatus, ProgramTag } from "@/lib/types";

type ProgramDocument = {
  _id?: unknown;
  slug: string;
  title: string;
  date: string;
  day: string;
  time: string;
  duration: string;
  tag: ProgramTag;
  location: string;
  summary: string;
  description: string;
  highlights: string[];
  facilitator: string;
  seats: number;
  status: ProgramStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

const COLLECTION_NAME = "programs";

const normalizeProgram = (doc: ProgramDocument & { _id: { toString(): string } }): ProgramRecord => ({
  id: doc._id.toString(),
  slug: doc.slug,
  title: doc.title,
  date: doc.date,
  day: doc.day,
  time: doc.time,
  duration: doc.duration,
  tag: doc.tag,
  location: doc.location,
  summary: doc.summary || "",
  description: doc.description || "",
  highlights: doc.highlights ?? [],
  facilitator: doc.facilitator || "Journey Guides",
  seats: Number.isFinite(doc.seats) ? doc.seats : 0,
  status: doc.status || "Open",
});

const seedPrograms = (): ProgramDocument[] => {
  const now = new Date();
  return PROGRAMS.map((program) => ({
    ...program,
    slug: program.slug || slugify(program.title),
    facilitator: program.facilitator || "Journey Guides",
    seats: Number.isFinite(program.seats) ? program.seats : 24,
    status: program.status || "Open",
    createdAt: now,
    updatedAt: now,
  }));
};

const getProgramsCollection = async (): Promise<Collection<ProgramDocument>> => {
  const db = await getDb();
  return db.collection<ProgramDocument>(COLLECTION_NAME);
};

export const ensureProgramsSeeded = async () => {
  const collection = await getProgramsCollection();
  const count = await collection.countDocuments();
  if (count > 0) return;
  await collection.insertMany(seedPrograms());
};

export const listPrograms = async (filters?: {
  q?: string;
  tag?: string;
  status?: string;
  limit?: number;
}) => {
  await ensureProgramsSeeded();
  const collection = await getProgramsCollection();
  const query: Record<string, unknown> = {};

  if (filters?.q) {
    query.title = { $regex: filters.q, $options: "i" };
  }
  if (filters?.tag && filters.tag !== "All") {
    query.tag = filters.tag;
  }
  if (filters?.status && filters.status !== "All") {
    query.status = filters.status;
  }

  let cursor = collection.find(query).sort({ _id: -1 });
  if (filters?.limit) {
    cursor = cursor.limit(filters.limit);
  }
  const docs = await cursor.toArray();
  return docs.map((doc) => normalizeProgram(doc as ProgramDocument & { _id: { toString(): string } }));
};

export const getProgramBySlug = async (slug: string) => {
  await ensureProgramsSeeded();
  const collection = await getProgramsCollection();
  const doc = await collection.findOne({ slug });
  if (!doc || !doc._id) return null;
  return normalizeProgram(doc as ProgramDocument & { _id: { toString(): string } });
};

export const createProgram = async (payload: Partial<ProgramRecord>) => {
  const collection = await getProgramsCollection();
  const now = new Date();
  const slugBase = payload.slug?.trim() || slugify(payload.title || "program");
  let slug = slugBase;
  const existing = await collection.findOne({ slug });
  if (existing) {
    slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const doc: ProgramDocument = {
    slug,
    title: payload.title || "Untitled program",
    date: payload.date || "",
    day: payload.day || "",
    time: payload.time || "",
    duration: payload.duration || "",
    tag: (payload.tag as ProgramTag) || "Meditation",
    location: payload.location || "Live · Main Hall",
    summary:
      payload.summary ||
      "A guided session designed to support calm, clarity, and inner renewal.",
    description:
      payload.description ||
      "Join a thoughtful, guided practice to relax the nervous system and reconnect with what matters.",
    highlights:
      payload.highlights && payload.highlights.length
        ? payload.highlights
        : ["Guided practice", "Breath-led reset", "Closing reflection"],
    facilitator: payload.facilitator || "Journey Guides",
    seats: Number.isFinite(payload.seats) ? Number(payload.seats) : 24,
    status: (payload.status as ProgramStatus) || "Open",
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);
  return normalizeProgram({ ...doc, _id: result.insertedId } as ProgramDocument & {
    _id: { toString(): string };
  });
};

export const updateProgram = async (slug: string, payload: Partial<ProgramRecord>) => {
  const collection = await getProgramsCollection();
  const updates: Partial<ProgramDocument> = {
    updatedAt: new Date(),
  };

  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.date !== undefined) updates.date = payload.date;
  if (payload.day !== undefined) updates.day = payload.day;
  if (payload.time !== undefined) updates.time = payload.time;
  if (payload.duration !== undefined) updates.duration = payload.duration;
  if (payload.tag !== undefined) updates.tag = payload.tag as ProgramTag;
  if (payload.location !== undefined) updates.location = payload.location;
  if (payload.summary !== undefined) updates.summary = payload.summary;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.highlights !== undefined) updates.highlights = payload.highlights;
  if (payload.facilitator !== undefined) updates.facilitator = payload.facilitator;
  if (payload.seats !== undefined) updates.seats = Number(payload.seats);
  if (payload.status !== undefined) updates.status = payload.status as ProgramStatus;

  if (payload.slug && payload.slug !== slug) {
    updates.slug = payload.slug;
  }

  const result = await collection.findOneAndUpdate(
    { slug },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!result.value || !result.value._id) return null;
  return normalizeProgram(result.value as ProgramDocument & { _id: { toString(): string } });
};

export const deleteProgram = async (slug: string) => {
  const collection = await getProgramsCollection();
  const result = await collection.deleteOne({ slug });
  return result.deletedCount > 0;
};
