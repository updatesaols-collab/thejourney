import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    folder?: string;
  };

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { message: "Cloudinary is not configured." },
      { status: 500 }
    );
  }

  const folder =
    typeof payload.folder === "string" && payload.folder.trim()
      ? payload.folder.trim()
      : "the-journey/programs";
  const timestamp = Math.round(Date.now() / 1000);
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
  });
}
