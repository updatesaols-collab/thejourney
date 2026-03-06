import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { RegistrationRecord } from "@/lib/types";

type RegistrationDocument = Omit<RegistrationRecord, "id" | "createdAt"> & {
  createdAt: Date;
};

const normalizeRegistration = (doc: RegistrationDocument & { _id: ObjectId }) => ({
  id: doc._id.toString(),
  fullName: doc.fullName,
  email: doc.email,
  phone: doc.phone,
  address: doc.address,
  dob: doc.dob,
  message: doc.message,
  aolExperience: doc.aolExperience,
  programSlug: doc.programSlug,
  programTitle: doc.programTitle,
  programDate: doc.programDate,
  programDay: doc.programDay,
  programTime: doc.programTime,
  programDuration: doc.programDuration,
  programTag: doc.programTag,
  status: doc.status,
  userId: doc.userId,
  createdAt: doc.createdAt.toISOString(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status");
  const program = searchParams.get("program");
  const userId = searchParams.get("userId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = searchParams.get("limit");

  const db = await getDb();
  const collection = db.collection<RegistrationDocument>("registrations");
  const query: Record<string, unknown> = {};

  if (q) {
    query.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { programTitle: { $regex: q, $options: "i" } },
    ];
  }
  if (status && status !== "All") {
    query.status = status;
  }
  if (program && program !== "All") {
    query.programTitle = program;
  }
  if (userId) {
    query.userId = userId;
  }
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      range.$lte = toDate;
    }
    query.createdAt = range;
  }

  let cursor = collection.find(query).sort({ createdAt: -1 });
  if (limit) {
    cursor = cursor.limit(Number(limit));
  }
  const docs = await cursor.toArray();
  const normalized = docs.map((doc) =>
    normalizeRegistration(doc as RegistrationDocument & { _id: ObjectId })
  );
  return NextResponse.json(normalized);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<RegistrationRecord> | Partial<RegistrationRecord>[];
  const db = await getDb();
  const programs = db.collection("programs");
  const profiles = db.collection("profiles");
  const collection = db.collection<RegistrationDocument>("registrations");

  const buildDoc = async (item: Partial<RegistrationRecord>) => {
    const program = item.programSlug
      ? await programs.findOne({ slug: item.programSlug })
      : null;
    const profile = item.userId
      ? await profiles.findOne({ userId: item.userId })
      : null;

    const now = new Date();
    return {
      fullName: item.fullName || profile?.fullName || "Seeker",
      email: item.email || profile?.email || "",
      phone: item.phone || profile?.phone || "",
      address: item.address || profile?.address || "",
      dob: item.dob || profile?.dob || "",
      message: item.message || "",
      aolExperience: item.aolExperience || "",
      programSlug: item.programSlug || program?.slug || "",
      programTitle: item.programTitle || program?.title || "",
      programDate: item.programDate || program?.date || "",
      programDay: item.programDay || program?.day || "",
      programTime: item.programTime || program?.time || "",
      programDuration: item.programDuration || program?.duration || "",
      programTag: item.programTag || program?.tag || undefined,
      status: item.status || "Pending",
      userId: item.userId || "",
      createdAt: now,
    } satisfies RegistrationDocument;
  };

  if (Array.isArray(payload)) {
    const docs: RegistrationDocument[] = [];
    for (const item of payload) {
      // eslint-disable-next-line no-await-in-loop
      docs.push(await buildDoc(item));
    }
    const result = await collection.insertMany(docs);
    const normalized = docs.map((doc, index) =>
      normalizeRegistration({
        ...doc,
        _id: result.insertedIds[index],
      })
    );
    return NextResponse.json(normalized, { status: 201 });
  }

  const doc = await buildDoc(payload);
  const result = await collection.insertOne(doc);
  return NextResponse.json(
    normalizeRegistration({ ...doc, _id: result.insertedId }),
    { status: 201 }
  );
}

export async function PATCH(request: NextRequest) {
  const payload = (await request.json()) as Partial<RegistrationRecord> & { id?: string };
  if (!payload.id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }
  if (!ObjectId.isValid(payload.id)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  const db = await getDb();
  const collection = db.collection<RegistrationDocument>("registrations");
  const id = new ObjectId(payload.id);

  const updates: Partial<RegistrationDocument> = {};
  if (payload.fullName !== undefined) updates.fullName = payload.fullName;
  if (payload.email !== undefined) updates.email = payload.email;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.address !== undefined) updates.address = payload.address;
  if (payload.dob !== undefined) updates.dob = payload.dob;
  if (payload.message !== undefined) updates.message = payload.message;
  if (payload.aolExperience !== undefined) updates.aolExperience = payload.aolExperience;
  if (payload.programTitle !== undefined) updates.programTitle = payload.programTitle;
  if (payload.programSlug !== undefined) updates.programSlug = payload.programSlug;
  if (payload.programDate !== undefined) updates.programDate = payload.programDate;
  if (payload.programDay !== undefined) updates.programDay = payload.programDay;
  if (payload.programTime !== undefined) updates.programTime = payload.programTime;
  if (payload.programDuration !== undefined) updates.programDuration = payload.programDuration;
  if (payload.programTag !== undefined) updates.programTag = payload.programTag;
  if (payload.status !== undefined) updates.status = payload.status;

  const result = await collection.findOneAndUpdate(
    { _id: id },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!result.value) {
    return NextResponse.json({ message: "Registration not found" }, { status: 404 });
  }

  return NextResponse.json(
    normalizeRegistration(result.value as RegistrationDocument & { _id: ObjectId })
  );
}

export async function DELETE(request: NextRequest) {
  const payload = (await request.json()) as { id?: string };
  if (!payload.id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }
  if (!ObjectId.isValid(payload.id)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  const db = await getDb();
  const collection = db.collection<RegistrationDocument>("registrations");
  const result = await collection.deleteOne({ _id: new ObjectId(payload.id) });
  if (!result.deletedCount) {
    return NextResponse.json({ message: "Registration not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
