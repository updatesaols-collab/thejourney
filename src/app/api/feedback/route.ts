import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { FeedbackRecord } from "@/lib/types";

type FeedbackDocument = Omit<FeedbackRecord, "id" | "createdAt"> & {
  createdAt: Date;
};

const normalizeFeedback = (doc: FeedbackDocument & { _id: ObjectId }) => ({
  id: doc._id.toString(),
  type: doc.type,
  name: doc.name,
  program: doc.program,
  rating: doc.rating,
  prompt: doc.prompt,
  message: doc.message,
  userId: doc.userId,
  createdAt: doc.createdAt.toISOString(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const program = searchParams.get("program");
  const rating = searchParams.get("rating");
  const type = searchParams.get("type");
  const userId = searchParams.get("userId");

  const db = await getDb();
  const collection = db.collection<FeedbackDocument>("feedback");
  const query: Record<string, unknown> = {};

  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { program: { $regex: q, $options: "i" } },
      { message: { $regex: q, $options: "i" } },
    ];
  }
  if (program && program !== "All") query.program = program;
  if (rating && rating !== "All") query.rating = Number(rating);
  if (type && type !== "All") query.type = type;
  if (userId) query.userId = userId;

  const docs = await collection.find(query).sort({ createdAt: -1 }).toArray();
  return NextResponse.json(
    docs.map((doc) => normalizeFeedback(doc as FeedbackDocument & { _id: ObjectId }))
  );
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<FeedbackRecord> | Partial<FeedbackRecord>[];
  const db = await getDb();
  const profiles = db.collection("profiles");
  const collection = db.collection<FeedbackDocument>("feedback");

  const buildDoc = async (item: Partial<FeedbackRecord>) => {
    const profile = item.userId
      ? await profiles.findOne({ userId: item.userId })
      : null;

    return {
      type: item.type || "journal",
      name: item.name || profile?.fullName || "Seeker",
      program: item.program || "",
      rating: item.rating ? Number(item.rating) : undefined,
      prompt: item.prompt || "",
      message: item.message || "",
      userId: item.userId || "",
      createdAt: new Date(),
    } satisfies FeedbackDocument;
  };

  if (Array.isArray(payload)) {
    const docs: FeedbackDocument[] = [];
    for (const item of payload) {
      // eslint-disable-next-line no-await-in-loop
      docs.push(await buildDoc(item));
    }
    const result = await collection.insertMany(docs);
    const normalized = docs.map((doc, index) =>
      normalizeFeedback({
        ...doc,
        _id: result.insertedIds[index],
      })
    );
    return NextResponse.json(normalized, { status: 201 });
  }

  const doc = await buildDoc(payload);
  const result = await collection.insertOne(doc);
  return NextResponse.json(
    normalizeFeedback({ ...doc, _id: result.insertedId }),
    { status: 201 }
  );
}

export async function PATCH(request: NextRequest) {
  const payload = (await request.json()) as Partial<FeedbackRecord> & { id?: string };
  if (!payload.id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }
  if (!ObjectId.isValid(payload.id)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  const db = await getDb();
  const collection = db.collection<FeedbackDocument>("feedback");
  const id = new ObjectId(payload.id);

  const updates: Partial<FeedbackDocument> = {};
  if (payload.type !== undefined) updates.type = payload.type;
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.program !== undefined) updates.program = payload.program;
  if (payload.rating !== undefined) updates.rating = payload.rating;
  if (payload.prompt !== undefined) updates.prompt = payload.prompt;
  if (payload.message !== undefined) updates.message = payload.message;

  const result = await collection.findOneAndUpdate(
    { _id: id },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!result.value) {
    return NextResponse.json({ message: "Feedback not found" }, { status: 404 });
  }

  return NextResponse.json(
    normalizeFeedback(result.value as FeedbackDocument & { _id: ObjectId })
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
  const collection = db.collection<FeedbackDocument>("feedback");
  const result = await collection.deleteOne({ _id: new ObjectId(payload.id) });
  if (!result.deletedCount) {
    return NextResponse.json({ message: "Feedback not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
