import { Collection, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { REVIEWS } from "@/data/reviews";
import type { ReviewRecord, ReviewStatus } from "@/lib/types";

type ReviewDocument = {
  _id?: ObjectId;
  name: string;
  role?: string;
  location?: string;
  rating: number;
  message: string;
  program?: string;
  featured: boolean;
  order: number;
  status: ReviewStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

const COLLECTION_NAME = "reviews";

const normalizeReview = (
  doc: ReviewDocument & { _id: { toString(): string } }
): ReviewRecord => ({
  id: doc._id.toString(),
  name: doc.name || "",
  role: doc.role || "",
  location: doc.location || "",
  rating: Number.isFinite(doc.rating) ? Number(doc.rating) : 5,
  message: doc.message || "",
  program: doc.program || "",
  featured: Boolean(doc.featured),
  order: Number.isFinite(doc.order) ? Number(doc.order) : 0,
  status: doc.status || "Published",
  createdAt: doc.createdAt?.toISOString(),
  updatedAt: doc.updatedAt?.toISOString(),
});

const seedReviews = (): ReviewDocument[] => {
  const now = new Date();
  return REVIEWS.map((item) => ({
    ...item,
    rating: Number.isFinite(item.rating) ? Number(item.rating) : 5,
    featured: Boolean(item.featured),
    order: Number.isFinite(item.order) ? Number(item.order) : 0,
    createdAt: now,
    updatedAt: now,
  }));
};

const getReviewsCollection = async (): Promise<Collection<ReviewDocument>> => {
  const db = await getDb();
  return db.collection<ReviewDocument>(COLLECTION_NAME);
};

export const ensureReviewsSeeded = async () => {
  const collection = await getReviewsCollection();
  const count = await collection.countDocuments();
  if (count > 0) return;
  await collection.insertMany(seedReviews());
};

export const listReviews = async (filters?: {
  q?: string;
  status?: string;
  rating?: number;
  featured?: boolean;
  limit?: number;
}) => {
  await ensureReviewsSeeded();
  const collection = await getReviewsCollection();
  const query: Record<string, unknown> = {};

  if (filters?.q) {
    query.$or = [
      { name: { $regex: filters.q, $options: "i" } },
      { role: { $regex: filters.q, $options: "i" } },
      { location: { $regex: filters.q, $options: "i" } },
      { message: { $regex: filters.q, $options: "i" } },
      { program: { $regex: filters.q, $options: "i" } },
    ];
  }
  if (filters?.status && filters.status !== "All") {
    query.status = filters.status;
  }
  if (filters?.rating && Number.isFinite(filters.rating)) {
    query.rating = Number(filters.rating);
  }
  if (typeof filters?.featured === "boolean") {
    query.featured = filters.featured;
  }

  let cursor = collection
    .find(query)
    .sort({ featured: -1, order: 1, updatedAt: -1, _id: 1 });
  if (filters?.limit) {
    cursor = cursor.limit(filters.limit);
  }
  const docs = await cursor.toArray();
  return docs.map((doc) => normalizeReview(doc as ReviewDocument & { _id: { toString(): string } }));
};

export const getReviewById = async (id: string) => {
  await ensureReviewsSeeded();
  if (!ObjectId.isValid(id)) return null;
  const collection = await getReviewsCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc || !doc._id) return null;
  return normalizeReview(doc as ReviewDocument & { _id: { toString(): string } });
};

export const createReview = async (payload: Partial<ReviewRecord>) => {
  const collection = await getReviewsCollection();
  const now = new Date();
  const doc: ReviewDocument = {
    name: payload.name?.trim() || "Anonymous",
    role: payload.role?.trim() || "",
    location: payload.location?.trim() || "",
    rating: Number.isFinite(payload.rating) ? Number(payload.rating) : 5,
    message: payload.message?.trim() || "Great experience.",
    program: payload.program?.trim() || "",
    featured: Boolean(payload.featured),
    order: Number.isFinite(payload.order) ? Number(payload.order) : 0,
    status: (payload.status as ReviewStatus) || "Published",
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);
  return normalizeReview({ ...doc, _id: result.insertedId } as ReviewDocument & {
    _id: { toString(): string };
  });
};

export const updateReview = async (id: string, payload: Partial<ReviewRecord>) => {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getReviewsCollection();
  const updates: Partial<ReviewDocument> = {
    updatedAt: new Date(),
  };

  if (payload.name !== undefined) updates.name = payload.name.trim();
  if (payload.role !== undefined) updates.role = payload.role.trim();
  if (payload.location !== undefined) updates.location = payload.location.trim();
  if (payload.rating !== undefined) {
    updates.rating = Number.isFinite(payload.rating) ? Number(payload.rating) : 5;
  }
  if (payload.message !== undefined) updates.message = payload.message.trim();
  if (payload.program !== undefined) updates.program = payload.program.trim();
  if (payload.featured !== undefined) updates.featured = Boolean(payload.featured);
  if (payload.order !== undefined) updates.order = Number(payload.order);
  if (payload.status !== undefined) updates.status = payload.status as ReviewStatus;

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!result || !result._id) return null;
  return normalizeReview(result as ReviewDocument & { _id: { toString(): string } });
};

export const deleteReview = async (id: string) => {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getReviewsCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};
