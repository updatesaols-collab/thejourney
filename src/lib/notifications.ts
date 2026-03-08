import { Collection, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { NOTIFICATIONS } from "@/data/notifications";
import type { NotificationRecord, NotificationStatus } from "@/lib/types";

type NotificationDocument = {
  _id?: unknown;
  title: string;
  message: string;
  link?: string;
  status: NotificationStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

const COLLECTION_NAME = "notifications";

const normalizeNotification = (
  doc: NotificationDocument & { _id: { toString(): string } }
): NotificationRecord => ({
  id: doc._id.toString(),
  title: doc.title || "",
  message: doc.message || "",
  link: doc.link || "",
  status: doc.status || "Active",
  createdAt: doc.createdAt?.toISOString(),
  updatedAt: doc.updatedAt?.toISOString(),
});

const seedNotifications = (): NotificationDocument[] => {
  const now = new Date();
  return NOTIFICATIONS.map((item) => ({
    ...item,
    createdAt: now,
    updatedAt: now,
  }));
};

const getNotificationsCollection = async (): Promise<Collection<NotificationDocument>> => {
  const db = await getDb();
  return db.collection<NotificationDocument>(COLLECTION_NAME);
};

export const ensureNotificationsSeeded = async () => {
  const collection = await getNotificationsCollection();
  const count = await collection.countDocuments();
  if (count > 0) return;
  await collection.insertMany(seedNotifications());
};

export const listNotifications = async (filters?: {
  q?: string;
  status?: string;
  limit?: number;
}) => {
  await ensureNotificationsSeeded();
  const collection = await getNotificationsCollection();
  const query: Record<string, unknown> = {};

  if (filters?.q) {
    query.title = { $regex: filters.q, $options: "i" };
  }
  if (filters?.status && filters.status !== "All") {
    query.status = filters.status;
  }

  let cursor = collection.find(query).sort({ createdAt: -1, _id: -1 });
  if (filters?.limit) {
    cursor = cursor.limit(filters.limit);
  }
  const docs = await cursor.toArray();
  return docs.map((doc) =>
    normalizeNotification(doc as NotificationDocument & { _id: { toString(): string } })
  );
};

export const getNotificationById = async (id: string) => {
  await ensureNotificationsSeeded();
  if (!ObjectId.isValid(id)) return null;
  const collection = await getNotificationsCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc || !doc._id) return null;
  return normalizeNotification(doc as NotificationDocument & { _id: { toString(): string } });
};

export const createNotification = async (payload: Partial<NotificationRecord>) => {
  const collection = await getNotificationsCollection();
  const now = new Date();
  const doc: NotificationDocument = {
    title: payload.title?.trim() || "New update",
    message: payload.message?.trim() || "A new notification is available.",
    link: payload.link?.trim() || "",
    status: (payload.status as NotificationStatus) || "Active",
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc);
  return normalizeNotification({ ...doc, _id: result.insertedId } as NotificationDocument & {
    _id: { toString(): string };
  });
};

export const updateNotification = async (
  id: string,
  payload: Partial<NotificationRecord>
) => {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getNotificationsCollection();
  const updates: Partial<NotificationDocument> = {
    updatedAt: new Date(),
  };

  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.message !== undefined) updates.message = payload.message;
  if (payload.link !== undefined) updates.link = payload.link;
  if (payload.status !== undefined) updates.status = payload.status as NotificationStatus;

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!result.value || !result.value._id) return null;
  return normalizeNotification(
    result.value as NotificationDocument & { _id: { toString(): string } }
  );
};

export const deleteNotification = async (id: string) => {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getNotificationsCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};
