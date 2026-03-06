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
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  const db = await getDb();
  const collection = db.collection<ProfileDocument>("profiles");
  const doc = await collection.findOne({ userId });

  if (!doc || !doc._id) {
    return NextResponse.json({
      id: "",
      userId,
      fullName: "",
      email: "",
      phone: "",
      address: "",
      dob: "",
      settings: defaultSettings,
    });
  }

  return NextResponse.json(normalizeProfile(doc as ProfileDocument & { _id: ObjectId }));
}

const upsertProfile = async (payload: Partial<ProfileRecord>) => {
  if (!payload.userId) {
    return null;
  }

  const db = await getDb();
  const collection = db.collection<ProfileDocument>("profiles");
  const now = new Date();
  const updates: Partial<ProfileDocument> = {
    updatedAt: now,
  };

  if (payload.fullName !== undefined) updates.fullName = payload.fullName;
  if (payload.email !== undefined) updates.email = payload.email;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.address !== undefined) updates.address = payload.address;
  if (payload.dob !== undefined) updates.dob = payload.dob;
  if (payload.settings !== undefined) updates.settings = payload.settings;

  const result = await collection.findOneAndUpdate(
    { userId: payload.userId },
    {
      $set: updates,
      $setOnInsert: { userId: payload.userId, createdAt: now },
    },
    { upsert: true, returnDocument: "after" }
  );

  if (!result.value || !result.value._id) return null;
  return normalizeProfile(result.value as ProfileDocument & { _id: ObjectId });
};

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<ProfileRecord>;
  const profile = await upsertProfile(payload);
  if (!profile) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }
  return NextResponse.json(profile);
}

export async function PUT(request: NextRequest) {
  const payload = (await request.json()) as Partial<ProfileRecord>;
  const profile = await upsertProfile(payload);
  if (!profile) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }
  return NextResponse.json(profile);
}
