import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { ProfileRecord, ProfileSettings } from "@/lib/types";

type ProfileDocument = Omit<ProfileRecord, "id" | "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
};

const defaultSettings: ProfileSettings = {
  emailUpdates: true,
  smsReminders: false,
  weeklyDigest: true,
};

const normalizeProfile = (doc: ProfileDocument & { _id: ObjectId }) => ({
  id: doc._id.toString(),
  userId: doc.userId,
  fullName: doc.fullName || "",
  email: doc.email || "",
  phone: doc.phone || "",
  address: doc.address || "",
  dob: doc.dob || "",
  settings: doc.settings || defaultSettings,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = searchParams.get("limit");

  const db = await getDb();
  const collection = db.collection<ProfileDocument>("profiles");
  const query: Record<string, unknown> = {};

  if (q) {
    query.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
      { userId: { $regex: q, $options: "i" } },
    ];
  }

  let cursor = collection.find(query).sort({ updatedAt: -1 });
  if (limit) {
    cursor = cursor.limit(Number(limit));
  }

  const docs = await cursor.toArray();
  return NextResponse.json(
    docs.map((doc) => normalizeProfile(doc as ProfileDocument & { _id: ObjectId }))
  );
}
