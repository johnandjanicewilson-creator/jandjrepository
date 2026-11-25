import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();

  if (session?.user?.id !== "john" &&
      session?.user?.id !== "janice") {
    return NextResponse.json(
      { error: "Not authorized" }, { status: 401 }
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured" },
      { status: 503 }
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  try {
    const cursor = new URL(request.url).searchParams.get("cursor");

    const result = await cloudinary.api.resources({
      resource_type: "image",
      type: "upload",
      max_results: 50,
      ...(cursor ? { next_cursor: cursor } : {}),
    });

    return NextResponse.json({
      photos: result.resources.map(
        (photo: { public_id: string; secure_url: string }) => ({
          id: photo.public_id,
          url: photo.secure_url,
          thumbnail: cloudinary.url(photo.public_id, {
            width: 180,
            height: 120,
            crop: "fit",
            secure: true,
          }),
        })
      ),
      nextCursor: result.next_cursor ?? null,
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to retrieve photographs" },
      { status: 502 }
    );
  }
}
