import { Collection, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { HERO_SLIDES } from "@/data/heroSlides";
import type { HeroSlideRecord, HeroSlideStatus } from "@/lib/types";

type HeroSlideDocument = {
  _id?: unknown;
  imageUrl: string;
  link?: string;
  order?: number;
  status: HeroSlideStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

const COLLECTION_NAME = "hero_slides";

const normalizeHeroSlide = (
  doc: HeroSlideDocument & { _id: { toString(): string } }
): HeroSlideRecord => ({
  id: doc._id.toString(),
  imageUrl: doc.imageUrl || "",
  link: doc.link?.trim() || undefined,
  order: Number.isFinite(doc.order) ? Number(doc.order) : 0,
  status: doc.status || "Active",
  createdAt: doc.createdAt?.toISOString(),
  updatedAt: doc.updatedAt?.toISOString(),
});

const seedHeroSlides = (): HeroSlideDocument[] => {
  const now = new Date();
  return HERO_SLIDES.map((item) => ({
    ...item,
    createdAt: now,
    updatedAt: now,
  }));
};

const getHeroSlidesCollection = async (): Promise<Collection<HeroSlideDocument>> => {
  const db = await getDb();
  return db.collection<HeroSlideDocument>(COLLECTION_NAME);
};

export const ensureHeroSlidesSeeded = async () => {
  const collection = await getHeroSlidesCollection();
  const count = await collection.countDocuments();
  if (count > 0) return;
  const seeds = seedHeroSlides();
  if (seeds.length === 0) return;
  await collection.insertMany(seeds);
};

export const listHeroSlides = async (filters?: { status?: string; limit?: number }) => {
  await ensureHeroSlidesSeeded();
  const collection = await getHeroSlidesCollection();
  const query: Record<string, unknown> = {};
  if (filters?.status && filters.status !== "All") {
    query.status = filters.status;
  }
  let cursor = collection.find(query).sort({ order: 1, _id: 1 });
  if (filters?.limit) {
    cursor = cursor.limit(filters.limit);
  }
  const docs = await cursor.toArray();
  return docs.map((doc) =>
    normalizeHeroSlide(doc as HeroSlideDocument & { _id: { toString(): string } })
  );
};

export const getHeroSlideById = async (id: string) => {
  await ensureHeroSlidesSeeded();
  if (!ObjectId.isValid(id)) return null;
  const collection = await getHeroSlidesCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc || !doc._id) return null;
  return normalizeHeroSlide(doc as HeroSlideDocument & { _id: { toString(): string } });
};

export const createHeroSlide = async (payload: Partial<HeroSlideRecord>) => {
  const collection = await getHeroSlidesCollection();
  const now = new Date();
  const doc: HeroSlideDocument = {
    imageUrl: payload.imageUrl?.trim() || "",
    link: payload.link?.trim() || "",
    order: Number.isFinite(payload.order) ? Number(payload.order) : 0,
    status: (payload.status as HeroSlideStatus) || "Active",
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc);
  return normalizeHeroSlide({ ...doc, _id: result.insertedId } as HeroSlideDocument & {
    _id: { toString(): string };
  });
};

export const updateHeroSlide = async (id: string, payload: Partial<HeroSlideRecord>) => {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getHeroSlidesCollection();
  const updates: Partial<HeroSlideDocument> = {
    updatedAt: new Date(),
  };

  if (payload.imageUrl !== undefined) updates.imageUrl = payload.imageUrl.trim();
  if (payload.link !== undefined) updates.link = payload.link.trim();
  if (payload.order !== undefined) updates.order = Number(payload.order);
  if (payload.status !== undefined) updates.status = payload.status as HeroSlideStatus;

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!result.value || !result.value._id) return null;
  return normalizeHeroSlide(
    result.value as HeroSlideDocument & { _id: { toString(): string } }
  );
};

export const deleteHeroSlide = async (id: string) => {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getHeroSlidesCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};
