import { Collection, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { FAQS } from "@/data/faqs";
import type { FaqRecord, FaqStatus } from "@/lib/types";

type FaqDocument = {
  _id?: ObjectId;
  question: string;
  answer: string;
  category: string;
  order: number;
  status: FaqStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

const COLLECTION_NAME = "faqs";

const normalizeFaq = (doc: FaqDocument & { _id: { toString(): string } }): FaqRecord => ({
  id: doc._id.toString(),
  question: doc.question || "",
  answer: doc.answer || "",
  category: doc.category || "General",
  order: Number.isFinite(doc.order) ? Number(doc.order) : 0,
  status: doc.status || "Published",
  createdAt: doc.createdAt?.toISOString(),
  updatedAt: doc.updatedAt?.toISOString(),
});

const seedFaqs = (): FaqDocument[] => {
  const now = new Date();
  return FAQS.map((item) => ({
    ...item,
    order: Number.isFinite(item.order) ? Number(item.order) : 0,
    createdAt: now,
    updatedAt: now,
  }));
};

const getFaqsCollection = async (): Promise<Collection<FaqDocument>> => {
  const db = await getDb();
  return db.collection<FaqDocument>(COLLECTION_NAME);
};

export const ensureFaqsSeeded = async () => {
  const collection = await getFaqsCollection();
  const count = await collection.countDocuments();
  if (count > 0) return;
  await collection.insertMany(seedFaqs());
};

export const listFaqs = async (filters?: {
  q?: string;
  status?: string;
  category?: string;
  limit?: number;
}) => {
  await ensureFaqsSeeded();
  const collection = await getFaqsCollection();
  const query: Record<string, unknown> = {};
  if (filters?.q) {
    query.$or = [
      { question: { $regex: filters.q, $options: "i" } },
      { answer: { $regex: filters.q, $options: "i" } },
      { category: { $regex: filters.q, $options: "i" } },
    ];
  }
  if (filters?.status && filters.status !== "All") {
    query.status = filters.status;
  }
  if (filters?.category && filters.category !== "All") {
    query.category = filters.category;
  }

  let cursor = collection.find(query).sort({ order: 1, updatedAt: -1, _id: 1 });
  if (filters?.limit) {
    cursor = cursor.limit(filters.limit);
  }
  const docs = await cursor.toArray();
  return docs.map((doc) => normalizeFaq(doc as FaqDocument & { _id: { toString(): string } }));
};

export const getFaqById = async (id: string) => {
  await ensureFaqsSeeded();
  if (!ObjectId.isValid(id)) return null;
  const collection = await getFaqsCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc || !doc._id) return null;
  return normalizeFaq(doc as FaqDocument & { _id: { toString(): string } });
};

export const createFaq = async (payload: Partial<FaqRecord>) => {
  const collection = await getFaqsCollection();
  const now = new Date();
  const doc: FaqDocument = {
    question: payload.question?.trim() || "New question",
    answer: payload.answer?.trim() || "Answer coming soon.",
    category: payload.category?.trim() || "General",
    order: Number.isFinite(payload.order) ? Number(payload.order) : 0,
    status: (payload.status as FaqStatus) || "Published",
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);
  return normalizeFaq({ ...doc, _id: result.insertedId } as FaqDocument & {
    _id: { toString(): string };
  });
};

export const updateFaq = async (id: string, payload: Partial<FaqRecord>) => {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getFaqsCollection();
  const updates: Partial<FaqDocument> = {
    updatedAt: new Date(),
  };

  if (payload.question !== undefined) updates.question = payload.question.trim();
  if (payload.answer !== undefined) updates.answer = payload.answer.trim();
  if (payload.category !== undefined) updates.category = payload.category.trim();
  if (payload.order !== undefined) updates.order = Number(payload.order);
  if (payload.status !== undefined) updates.status = payload.status as FaqStatus;

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!result || !result._id) return null;
  return normalizeFaq(result as FaqDocument & { _id: { toString(): string } });
};

export const deleteFaq = async (id: string) => {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getFaqsCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};
