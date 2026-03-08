import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, requireUser } from "@/lib/requestAuth";
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
  avatarUrl: doc.avatarUrl || "",
  phone: doc.phone || "",
  address: doc.address || "",
  dob: doc.dob || "",
  settings: doc.settings || defaultSettings,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const emptyProfile = (userId: string, email = "") => ({
  id: "",
  userId,
  fullName: "",
  email,
  avatarUrl: "",
  phone: "",
  address: "",
  dob: "",
  settings: defaultSettings,
});

const upsertProfile = async (
  userId: string,
  payload: Partial<ProfileRecord>,
  forcedEmail?: string
) => {
  const db = await getDb();
  const collection = db.collection<ProfileDocument>("profiles");
  const now = new Date();
  const updates: Partial<ProfileDocument> = {
    updatedAt: now,
  };

  if (payload.fullName !== undefined) updates.fullName = payload.fullName;
  if (payload.email !== undefined) updates.email = payload.email;
  if (payload.avatarUrl !== undefined) updates.avatarUrl = payload.avatarUrl;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.address !== undefined) updates.address = payload.address;
  if (payload.dob !== undefined) updates.dob = payload.dob;
  if (payload.settings !== undefined) updates.settings = payload.settings;
  if (forcedEmail) updates.email = forcedEmail;

  const result = await collection.findOneAndUpdate(
    { userId },
    {
      $set: updates,
      $setOnInsert: { userId, createdAt: now },
    },
    { upsert: true, returnDocument: "after" }
  );

  if (!result || !result._id) return null;
  return normalizeProfile(result as ProfileDocument & { _id: ObjectId });
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get("userId")?.trim() || "";

  const admin = requireAdmin(request);
  const user = requireUser(request);

  if (!admin.ok && !user.ok) {
    return user.response;
  }

  const targetUserId =
    admin.ok && requestedUserId
      ? requestedUserId
      : user.ok
        ? user.subject
        : "";
  if (!targetUserId) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  const db = await getDb();
  const collection = db.collection<ProfileDocument>("profiles");
  const doc = await collection.findOne({ userId: targetUserId });

  if (!doc || !doc._id) {
    return NextResponse.json(
      emptyProfile(targetUserId, user.ok ? user.subject : "")
    );
  }

  return NextResponse.json(normalizeProfile(doc as ProfileDocument & { _id: ObjectId }));
}

export async function POST(request: NextRequest) {
  return PUT(request);
}

export async function PUT(request: NextRequest) {
  const payload = (await request.json()) as Partial<ProfileRecord>;
  const admin = requireAdmin(request);
  const user = requireUser(request);

  if (admin.ok && payload.userId?.trim()) {
    const userId = payload.userId?.trim() || "";
    const profile = await upsertProfile(userId, payload);
    if (!profile) {
      return NextResponse.json({ message: "Unable to update profile" }, { status: 500 });
    }
    return NextResponse.json(profile);
  }

  if (!user.ok) return user.response;

  const profile = await upsertProfile(user.subject, payload, user.subject);
  if (!profile) {
    return NextResponse.json({ message: "Unable to update profile" }, { status: 500 });
  }

  return NextResponse.json(profile);
}
