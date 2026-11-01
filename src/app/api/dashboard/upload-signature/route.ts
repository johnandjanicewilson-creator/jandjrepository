import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();

  if (session?.user?.id !== "john" && session?.user?.id !== "janice") {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 401 }
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Photograph uploading is not configured" },
      { status: 503 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "travel-drafts";
  const publicId = crypto.randomUUID();

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, public_id: publicId, overwrite: "false" },
    apiSecret
  );

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    folder,
    publicId,
    overwrite: false,
    signature,
  });
}
