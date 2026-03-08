import { Collection, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { CATEGORIES } from "@/data/categories";
import type { CategoryRecord, ProgramTag } from "@/lib/types";

type CategoryDocument = {
  _id?: ObjectId;
  title: string;
  tag: ProgramTag;
  imageUrl?: string;
  iconName?: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

const COLLECTION_NAME = "categories";

const normalizeCategory = (
  doc: CategoryDocument & { _id: { toString(): string } }
): CategoryRecord => ({
  id: doc._id.toString(),
  title: doc.title || "",
  tag: doc.tag,
  imageUrl: doc.imageUrl || "",
  iconName: doc.iconName || "",
  order: Number.isFinite(doc.order) ? Number(doc.order) : 0,
  createdAt: doc.createdAt?.toISOString(),
  updatedAt: doc.updatedAt?.toISOString(),
});

const seedCategories = (): CategoryDocument[] => {
  const now = new Date();
  return CATEGORIES.map((item) => ({
    ...item,
    createdAt: now,
    updatedAt: now,
  }));
};

const getCategoriesCollection = async (): Promise<Collection<CategoryDocument>> => {
  const db = await getDb();
  return db.collection<CategoryDocument>(COLLECTION_NAME);
};

export const ensureCategoriesSeeded = async () => {
  const collection = await getCategoriesCollection();
  const count = await collection.countDocuments();
  if (count > 0) return;
  await collection.insertMany(seedCategories());
};

export const listCategories = async (filters?: { q?: string; limit?: number }) => {
  await ensureCategoriesSeeded();
  const collection = await getCategoriesCollection();
  const query: Record<string, unknown> = {};
  if (filters?.q) {
    query.title = { $regex: filters.q, $options: "i" };
  }
  let cursor = collection.find(query).sort({ order: 1, _id: 1 });
  if (filters?.limit) {
    cursor = cursor.limit(filters.limit);
  }
  const docs = await cursor.toArray();
  return docs.map((doc) =>
    normalizeCategory(doc as CategoryDocument & { _id: { toString(): string } })
  );
};

export const getCategoryById = async (id: string) => {
  await ensureCategoriesSeeded();
  if (!ObjectId.isValid(id)) return null;
  const collection = await getCategoriesCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc || !doc._id) return null;
  return normalizeCategory(doc as CategoryDocument & { _id: { toString(): string } });
};

export const createCategory = async (payload: Partial<CategoryRecord>) => {
  const collection = await getCategoriesCollection();
  const now = new Date();
  const doc: CategoryDocument = {
    title: payload.title?.trim() || payload.tag?.toString() || "New category",
    tag: (payload.tag as ProgramTag) || "Meditation",
    imageUrl: payload.imageUrl?.trim() || "",
    iconName: payload.iconName?.trim() || "",
    order: Number.isFinite(payload.order) ? Number(payload.order) : 0,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc);
  return normalizeCategory({ ...doc, _id: result.insertedId } as CategoryDocument & {
    _id: { toString(): string };
  });
};

export const updateCategory = async (id: string, payload: Partial<CategoryRecord>) => {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getCategoriesCollection();
  const updates: Partial<CategoryDocument> = {
    updatedAt: new Date(),
  };

  if (payload.tag !== undefined) {
    updates.tag = payload.tag as ProgramTag;
    if (payload.title === undefined) {
      updates.title = payload.tag as string;
    }
  }
  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.imageUrl !== undefined) updates.imageUrl = payload.imageUrl.trim();
  if (payload.iconName !== undefined) updates.iconName = payload.iconName.trim();
  if (payload.order !== undefined) updates.order = Number(payload.order);

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!result || !result._id) return null;
  return normalizeCategory(result as CategoryDocument & { _id: { toString(): string } });
};

export const deleteCategory = async (id: string) => {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getCategoriesCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};
